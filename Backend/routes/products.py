from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from bson import ObjectId
from marshmallow import ValidationError
from utils.roles import role_required
from models.products import DETAIL_SCHEMAS

products_bp = Blueprint("products", __name__)
products_collection = None


def init_products_routes(db):
    global products_collection
    products_collection = db["products"]
@products_bp.route("", methods=["POST"])
@products_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("employee", "admin")
def create_product():
    data = request.json

    product_type = data.get("type")
    if product_type not in DETAIL_SCHEMAS:
        return jsonify({"error": "Invalid product type"}), 400

    try:
        DETAIL_SCHEMAS[product_type].load(data.get("details", {}))
    except ValidationError as err:
        return jsonify(err.messages), 400

    product = {
        "type": product_type,
        "brand": data["brand"],
        "model": data["model"],
        "details": data["details"],
        "price": data["price"],
        "power_draw": data.get("power_draw"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = products_collection.insert_one(product)
    product["_id"] = str(result.inserted_id)

    return jsonify(product), 201




@products_bp.route("/<product_id>", methods=["GET"])
def get_product(product_id):
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Not found"}), 404

    product["_id"] = str(product["_id"])
    return jsonify(product)

@products_bp.route("/<product_id>", methods=["PUT"])
@products_bp.route("/<product_id>/", methods=["PUT"])
@jwt_required()
@role_required("employee", "admin")
def update_product(product_id):
    data = request.json

    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Not found"}), 404

    if "details" in data:
        try:
            DETAIL_SCHEMAS[product["type"]].load(data["details"])
        except ValidationError as err:
            return jsonify(err.messages), 400

    data["updated_at"] = datetime.utcnow()

    products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": data}
    )

    return jsonify({"message": "Product updated"})

#sortowanie za pomocą prefiksów w url ttroche przykładów byś cie ogarneli (lub chat)
#/products?type=cpu&socket=AM5
#/products?type=ram&ram_type=DDR5
#/products?search=ryzen
#/products?min_price=500&max_price=2000
#/products?sort=price_desc
@products_bp.route("", methods=["GET"])
@products_bp.route("/", methods=["GET"])
def get_products():
    query = {}

    if "type" in request.args:
        query["type"] = request.args["type"]

    if "brand" in request.args:
        query["brand"] = request.args["brand"]

    if "min_price" in request.args or "max_price" in request.args:
        query["price"] = {}
        if "min_price" in request.args:
            query["price"]["$gte"] = int(request.args["min_price"])
        if "max_price" in request.args:
            query["price"]["$lte"] = int(request.args["max_price"])

    if "min_power" in request.args:
        query["power_draw"] = {"$gte": int(request.args["min_power"])}

    DETAILS_FILTERS = {
        "socket": "details.socket",
        "ram_type": "details.ram_type",
        "chipset": "details.chipset",
        "form_factor": "details.form_factor",
        "protocol": "details.protocol"
    }

    for param, field in DETAILS_FILTERS.items():
        if param in request.args:
            query[field] = request.args[param]

    if "search" in request.args:
        query["$or"] = [
            {"model": {"$regex": request.args["search"], "$options": "i"}},
            {"brand": {"$regex": request.args["search"], "$options": "i"}}
        ]

    sort = None
    if request.args.get("sort") == "price_asc":
        sort = [("price", 1)]
    elif request.args.get("sort") == "price_desc":
        sort = [("price", -1)]

    cursor = products_collection.find(query)

    if sort:
        cursor = cursor.sort(sort)

    products = []
    for p in cursor:
        p["_id"] = str(p["_id"])
        products.append(p)

    return jsonify(products)


@products_bp.route("/<product_id>", methods=["DELETE"])
@products_bp.route("/<product_id>/", methods=["DELETE"])
@jwt_required()
@role_required("employee", "admin")
def delete_product(product_id):
    result = products_collection.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404

    return jsonify({"message": "Product deleted"})



