from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from bson.errors import InvalidId
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

#spoko do opisania
def validate_object_id(value, field="id"):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise ValueError(f"Invalid {field}")
#spoko do opisania
def validate_quantity(value):
    try:
        q = int(value)
        if q <= 0:
            raise ValueError
        return q
    except (ValueError, TypeError):
        raise ValueError("Quantity must be a positive integer")
#spoko do opisania
def validate_items_array(items):
    if not isinstance(items, list) or not items:
        raise ValueError("Items must be a non-empty list")

    for item in items:
        if "product_id" not in item:
            raise ValueError("product_id missing in items")
        validate_object_id(item["product_id"], "product_id")
        validate_quantity(item.get("quantity", 1))


#spoko do opisania
@cart_bp.route("/add", methods=["POST"])
@jwt_required()
def add_to_cart():
    login = get_jwt_identity()
    data = request.json or {}

    product_id = data.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id required"}), 400

    try:
        product_oid = ObjectId(product_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid product_id"}), 400

    try:
        quantity = int(data.get("quantity", 1))
        if quantity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    product = products.find_one({"_id": product_oid})
    if not product:
        return jsonify({"error": "Product not found"}), 404


    cart = carts.find_one({"login": login})

    if not cart:
        carts.insert_one({
            "login": login,
            "items": [
                {"product_id": product_oid, "quantity": quantity}
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    else:
        result = carts.update_one(
            {
                "login": login,
                "items.product_id": product_oid
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
                            "product_id": product_oid,
                            "quantity": quantity
                        }
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )

    return jsonify({"message": "Added to cart"}), 200



@cart_bp.route("/remove/<product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_cart(product_id):
    login = get_jwt_identity()

    try:
        product_oid = ObjectId(product_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid product_id"}), 400

    result = carts.update_one(
        {"login": login},
        {
            "$pull": {"items": {"product_id": product_oid}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        return jsonify({"error": "Product not found in cart"}), 404

    return jsonify({"message": "Product removed"}), 200



@cart_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_quantity():
    login = get_jwt_identity()
    data = request.json or {}

    product_id = data.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id required"}), 400

    try:
        product_oid = ObjectId(product_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid product_id"}), 400

    try:
        quantity = int(data.get("quantity"))
        if quantity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    result = carts.update_one(
        {
            "login": login,
            "items.product_id": product_oid
        },
        {
            "$set": {
                "items.$.quantity": quantity,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": "Product not found in cart"}), 404

    return jsonify({"message": "Quantity updated"}), 200



@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart():
    login = get_jwt_identity()

    if not carts.find_one({"login": login}):
        return jsonify({
            "items": [],
            "total_price": 0,
            "total_power_draw": 0
        }), 200

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
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": False}},
        {
            "$group": {
                "_id": "$login",
                "items": {
                    "$push": {
                        "product_id": "$items.product_id",
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
        }), 200

    cart = result[0]

    for item in cart["items"]:
        item["product_id"] = str(item["product_id"])

    return jsonify({
        "items": cart["items"],
        "total_price": cart["total_price"],
        "total_power_draw": cart["total_power_draw"]
    }), 200



@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    login = get_jwt_identity()

    result = carts.delete_one({"login": login})

    if result.deleted_count == 0:
        return jsonify({"message": "Cart already empty"}), 200

    return jsonify({"message": "Cart cleared"}), 200

#to pominoć w sumie bo to przyciks kupowania
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
        quantity = item.get("quantity", 0)
        if not isinstance(quantity, int) or quantity <= 0:
            return jsonify({"error": "Invalid quantity in cart"}), 400

        product = products.find_one({"_id": item["product_id"]})
        if not product:
            return jsonify({"error": "Product no longer available"}), 400


        order_items.append({
            "product_id": product["_id"],
            "brand": product["brand"],
            "model": product["model"],
            "price": product["price"],
            "quantity": quantity
        })

        total_price += product["price"] * quantity
        total_power += product.get("power_draw", 0) * quantity

    for item in order_items:
        products.update_one(
            {"_id": item["product_id"]},
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

    return jsonify({"message": "Order placed successfully"}), 201


@cart_bp.route("/orders", methods=["GET"])
@jwt_required()
def order_history():
    login = get_jwt_identity()

    orders_list = list(
        orders.find({"login": login}).sort("created_at", -1)
    )

    if not orders_list:
        return jsonify([]), 200

    for order in orders_list:
        order["_id"] = str(order["_id"])
        order["items"] = order.get("items", [])

        for item in order["items"]:
            if "product_id" in item:
                item["product_id"] = str(item["product_id"])

    return jsonify(orders_list), 200

from bson.errors import InvalidId

@cart_bp.route("/configurations", methods=["POST"])
@jwt_required()
def save_configuration():
    login = get_jwt_identity()
    data = request.json or {}

    items = data.get("items")
    if not isinstance(items, list) or not items:
        return jsonify({"error": "items must be a non-empty list"}), 400

    validated_items = []

    for item in items:
        if "product_id" not in item:
            return jsonify({"error": "product_id missing in items"}), 400

        try:
            product_oid = ObjectId(item["product_id"])
        except (InvalidId, TypeError):
            return jsonify({"error": "Invalid product_id in items"}), 400

        try:
            quantity = int(item.get("quantity", 1))
            if quantity <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid quantity in items"}), 400

        validated_items.append({
            "product_id": product_oid,
            "quantity": quantity
        })

    configurations.insert_one({
        "login": login,
        "name": data.get("name", "My PC Build").strip(),
        "items": validated_items,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    return jsonify({"message": "Configuration saved"}), 201



@cart_bp.route("/configurations", methods=["GET"])
@jwt_required()
def get_configurations():
    login = get_jwt_identity()

    configs = list(configurations.find({"login": login}))
    if not configs:
        return jsonify([]), 200

    for c in configs:
        c["_id"] = str(c["_id"])
        c["items"] = c.get("items", [])

        for i in c["items"]:
            if "product_id" in i:
                i["product_id"] = str(i["product_id"])

    return jsonify(configs), 200



@cart_bp.route("/configurations/<config_id>/restore", methods=["POST"])
@jwt_required()
def restore_configuration(config_id):
    login = get_jwt_identity()

    try:
        config_oid = ObjectId(config_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid configuration id"}), 400

    config = configurations.find_one({
        "_id": config_oid,
        "login": login
    })

    if not config:
        return jsonify({"error": "Configuration not found"}), 404

    items = config.get("items")
    if not isinstance(items, list) or not items:
        return jsonify({"error": "Configuration is empty"}), 400

    validated_items = []

    for item in items:
        try:
            product_oid = ObjectId(item.get("product_id"))
        except (InvalidId, TypeError):
            return jsonify({"error": "Invalid product_id in configuration"}), 400

        try:
            quantity = int(item.get("quantity", 1))
            if quantity <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid quantity in configuration"}), 400

        if not products.find_one({"_id": product_oid}):
            return jsonify({"error": "Product in configuration no longer exists"}), 400

        validated_items.append({
            "product_id": product_oid,
            "quantity": quantity
        })

    carts.update_one(
        {"login": login},
        {
            "$set": {
                "items": validated_items,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return jsonify({"message": "Configuration restored to cart"}), 200


@cart_bp.route("/configurations/<config_id>", methods=["PUT"])
@jwt_required()
def update_configuration(config_id):
    login = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        config_oid = ObjectId(config_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid configuration id"}), 400

    name = data.get("name")
    items = data.get("items")

    if not name or not isinstance(name, str):
        return jsonify({"error": "Invalid configuration name"}), 400

    if not isinstance(items, list) or not items:
        return jsonify({"error": "Items must be a non-empty list"}), 400

    validated_items = []

    for item in items:
        try:
            product_oid = ObjectId(item.get("product_id"))
            quantity = int(item.get("quantity", 1))
            if quantity <= 0:
                raise ValueError
        except (InvalidId, ValueError, TypeError):
            return jsonify({"error": "Invalid item structure"}), 400

        validated_items.append({
            "product_id": product_oid,
            "quantity": quantity
        })

    result = configurations.update_one(
        {"_id": config_oid, "login": login},
        {
            "$set": {
                "name": name,
                "items": validated_items,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": "Configuration not found"}), 404

    return jsonify({"message": "Configuration updated"}), 200


@cart_bp.route("/configurations/<config_id>/add-to-cart", methods=["POST"])
@jwt_required()
def add_configuration_to_cart(config_id):
    login = get_jwt_identity()

    try:
        config_oid = ObjectId(config_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid configuration id"}), 400

    config = configurations.find_one({
        "_id": config_oid,
        "login": login
    })

    if not config:
        return jsonify({"error": "Configuration not found"}), 404

    items = config.get("items")
    if not isinstance(items, list) or not items:
        return jsonify({"error": "Configuration is empty"}), 400

    carts.update_one(
        {"login": login},
        {
            "$setOnInsert": {
                "login": login,
                "items": [],
                "created_at": datetime.utcnow()
            },
            "$set": {"updated_at": datetime.utcnow()}
        },
        upsert=True
    )

    for item in items:
        try:
            product_oid = ObjectId(item.get("product_id"))
            quantity = int(item.get("quantity", 1))
            if quantity <= 0:
                raise ValueError
        except (InvalidId, ValueError, TypeError):
            return jsonify({"error": "Invalid item in configuration"}), 400

        result = carts.update_one(
            {
                "login": login,
                "items.product_id": product_oid
            },
            {
                "$inc": {"items.$.quantity": quantity},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        if result.matched_count == 0:
            carts.update_one(
                {"login": login},
                {
                    "$push": {
                        "items": {
                            "product_id": product_oid,
                            "quantity": quantity
                        }
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )

    return jsonify({"message": "Configuration added to cart"}), 200
