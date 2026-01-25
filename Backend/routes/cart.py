from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId

cart_bp = Blueprint("cart", __name__)

carts = None
products = None
orders = None
configurations = None


def init_cart_routes(db):
    global carts, products, orders, configurations
    carts = db["carts"]
    products = db["products"]
    orders = db["orders"]
    configurations = db["configurations"]



@cart_bp.route("/add", methods=["POST"])
@jwt_required()
def add_to_cart():
    login = get_jwt_identity()
    data = request.json

    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not product_id:
        return jsonify({"error": "product_id required"}), 400

    product = products.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    cart = carts.find_one({"login": login})

    if not cart:
        carts.insert_one({
            "login": login,
            "items": [{"product_id": ObjectId(product_id), "quantity": quantity}],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    else:
        carts.update_one(
            {
                "login": login,
                "items.product_id": ObjectId(product_id)
            },
            {
                "$inc": {"items.$.quantity": quantity},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        carts.update_one(
            {
                "login": login,
                "items.product_id": {"$ne": ObjectId(product_id)}
            },
            {
                "$push": {"items": {"product_id": ObjectId(product_id), "quantity": quantity}}
            }
        )

    return jsonify({"message": "Added to cart"})


@cart_bp.route("/remove/<product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_cart(product_id):
    login = get_jwt_identity()

    carts.update_one(
        {"login": login},
        {
            "$pull": {"items": {"product_id": ObjectId(product_id)}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return jsonify({"message": "Product removed"})


@cart_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_quantity():
    login = get_jwt_identity()
    data = request.json

    carts.update_one(
        {
            "login": login,
            "items.product_id": ObjectId(data["product_id"])
        },
        {
            "$set": {
                "items.$.quantity": int(data["quantity"]),
                "updated_at": datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Quantity updated"})


@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart():
    login = get_jwt_identity()

    pipeline = [
        {"$match": {"login": login}},
        {"$unwind": "$items"},
        {
            "$lookup": {
                "from": "products",
                "localField": "items.product_id",
                "foreignField": "_id",
                "as": "product"
            }
        },
        {"$unwind": "$product"},
        {
            "$group": {
                "_id": "$login",
                "items": {
                    "$push": {
                        "product_id": "$product._id",
                        "brand": "$product.brand",
                        "model": "$product.model",
                        "price": "$product.price",
                        "power_draw": {"$ifNull": ["$product.power_draw", 0]},
                        "quantity": "$items.quantity"
                    }
                },
                "total_price": {
                    "$sum": {"$multiply": ["$product.price", "$items.quantity"]}
                },
                "total_power_draw": {
                    "$sum": {
                        "$multiply": [
                            {"$ifNull": ["$product.power_draw", 0]},
                            "$items.quantity"
                        ]
                    }
                }
            }
        }
    ]

    result = list(carts.aggregate(pipeline))

    if not result:
        return jsonify({
            "items": [],
            "total_price": 0,
            "total_power_draw": 0
        })

    cart = result[0]
    for item in cart["items"]:
        item["product_id"] = str(item["product_id"])

    return jsonify(cart)


@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    login = get_jwt_identity()
    carts.delete_one({"login": login})
    return jsonify({"message": "Cart cleared"})

@cart_bp.route("/checkout", methods=["POST"])
@jwt_required()
def checkout():
    login = get_jwt_identity()

    cart = carts.find_one({"login": login})
    if not cart or not cart.get("items"):
        return jsonify({"error": "Cart is empty"}), 400

    order_items = []
    total_price = 0
    total_power = 0

    for item in cart["items"]:
        product = products.find_one({"_id": item["product_id"]})
        if not product:
            continue

        order_items.append({
            "product_id": product["_id"],
            "brand": product["brand"],
            "model": product["model"],
            "price": product["price"],
            "quantity": item["quantity"]
        })

        total_price += product["price"] * item["quantity"]
        total_power += product.get("power_draw", 0) * item["quantity"]

        # 🔥 WARIANT A: zmniejsz stock
        products.update_one(
            {"_id": product["_id"]},
            {"$inc": {"stock": -item["quantity"]}}
        )


    orders.insert_one({
        "login": login,
        "items": order_items,
        "total_price": total_price,
        "total_power_draw": total_power,
        "created_at": datetime.utcnow()
    })

    carts.delete_one({"login": login})

    return jsonify({"message": "Order placed successfully"})


@cart_bp.route("/orders", methods=["GET"])
@jwt_required()
def order_history():
    login = get_jwt_identity()

    orders_list = list(
        orders.find({"login": login}).sort("created_at", -1)
    )

    for order in orders_list:
        order["_id"] = str(order["_id"])
        for item in order["items"]:
            item["product_id"] = str(item["product_id"])

    return jsonify(orders_list)


@cart_bp.route("/configurations", methods=["POST"])
@jwt_required()
def save_configuration():
    login = get_jwt_identity()
    data = request.json

    configurations.insert_one({
        "login": login,
        "name": data.get("name", "My PC Build"),
        "items": data["items"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    return jsonify({"message": "Configuration saved"})


@cart_bp.route("/configurations", methods=["GET"])
@jwt_required()
def get_configurations():
    login = get_jwt_identity()

    configs = list(configurations.find({"login": login}))
    for c in configs:
        c["_id"] = str(c["_id"])
        for i in c["items"]:
            i["product_id"] = str(i["product_id"])

    return jsonify(configs)


@cart_bp.route("/configurations/<config_id>/restore", methods=["POST"])
@jwt_required()
def restore_configuration(config_id):
    login = get_jwt_identity()

    config = configurations.find_one({
        "_id": ObjectId(config_id),
        "login": login
    })

    if not config:
        return jsonify({"error": "Configuration not found"}), 404

    carts.update_one(
        {"login": login},
        {
            "$set": {
                "items": config["items"],
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return jsonify({"message": "Configuration restored to cart"})


@cart_bp.route("/configurations/<config_id>", methods=["PUT"])
@jwt_required()
def update_configuration(config_id):
    login = get_jwt_identity()
    data = request.json

    configurations.update_one(
        {"_id": ObjectId(config_id), "login": login},
        {
            "$set": {
                "name": data.get("name"),
                "items": data.get("items"),
                "updated_at": datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Configuration updated"})


@cart_bp.route("/configurations/<config_id>/add-to-cart", methods=["POST"])
@jwt_required()
def add_configuration_to_cart(config_id):
    login = get_jwt_identity()

    config = configurations.find_one({
        "_id": ObjectId(config_id),
        "login": login
    })

    if not config:
        return jsonify({"error": "Configuration not found"}), 404

    cart = carts.find_one({"login": login})

    if not cart:
        carts.insert_one({
            "login": login,
            "items": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

    for item in config["items"]:
        product_id = ObjectId(item["product_id"])
        quantity = int(item.get("quantity", 1))

        result = carts.update_one(
            {
                "login": login,
                "items.product_id": product_id
            },
            {
                "$inc": {"items.$.quantity": quantity},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        # jeśli NIE było produktu → dodaj nowy
        if result.matched_count == 0:
            carts.update_one(
                {"login": login},
                {
                    "$push": {
                        "items": {
                            "product_id": product_id,
                            "quantity": quantity
                        }
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )

    return jsonify({"message": "Configuration added to cart"})
