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
