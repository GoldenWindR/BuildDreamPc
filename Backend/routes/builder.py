from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from utils.roles import role_required
from models.products import DETAIL_SCHEMAS

builder_bp = Blueprint("builder", __name__)

builders = None
products = None
configurations = None
carts = None

def init_builder_routes(db):
    global builders, products, configurations, carts
    builders = db["builders"]           # aktywny builder per user
    products = db["products"]
    configurations = db["builder_configs"]  # zapisane konfiguracje
    carts = db["carts"]


# Pobierz aktywny builder
@builder_bp.route("/", methods=["GET"])
@jwt_required()
def get_active_builder():
    login = get_jwt_identity()
    builder = builders.find_one({"login": login})
    if not builder:
        builder = {
            "login": login,
            "components": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        builders.insert_one(builder)
    builder["_id"] = str(builder["_id"])
    return jsonify(builder)


# Dodaj komponent do buildera
@builder_bp.route("/add", methods=["POST"])
@jwt_required()
def add_component():
    login = get_jwt_identity()
    data = request.json
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"error": "product_id required"}), 400

    product = products.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    builder = builders.find_one({"login": login})
    if not builder:
        builder = {"login": login, "components": [], "created_at": datetime.utcnow()}
        builders.insert_one(builder)

    # nie dodajemy więcej niż 1 tego samego typu komponentu
    for comp in builder["components"]:
        if comp["type"] == product["type"]:
            return jsonify({"error": f"{product['type']} already in builder"}), 400

    builders.update_one(
        {"login": login},
        {"$push": {"components": {
            "product_id": product["_id"],
            "type": product["type"],
            "brand": product["brand"],
            "model": product["model"],
            "price": product["price"],
            "details": product.get("details", {}),
            "power_draw": product.get("power_draw", 0)
        }},
         "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return jsonify({"message": "Component added"})


# Usuń komponent z buildera
@builder_bp.route("/remove/<product_id>", methods=["DELETE"])
@jwt_required()
def remove_component(product_id):
    login = get_jwt_identity()
    builders.update_one(
        {"login": login},
        {"$pull": {"components": {"product_id": ObjectId(product_id)}},
         "$set": {"updated_at": datetime.utcnow()}}
    )
    return jsonify({"message": "Component removed"})


# Zapisz builder jako konfigurację
@builder_bp.route("/save", methods=["POST"])
@jwt_required()
def save_configuration():
    login = get_jwt_identity()
    builder = builders.find_one({"login": login})
    if not builder or not builder.get("components"):
        return jsonify({"error": "Builder is empty"}), 400

    config = {
        "login": login,
        "name": request.json.get("name", f"Config {datetime.utcnow()}"),
        "components": builder["components"],
        "total_price": sum([c["price"] for c in builder["components"]]),
        "created_at": datetime.utcnow()
    }
    result = configurations.insert_one(config)
    config["_id"] = str(result.inserted_id)
    return jsonify(config)


# Lista zapisanych konfiguracji
@builder_bp.route("/configs", methods=["GET"])
@jwt_required()
def get_saved_configs():
    login = get_jwt_identity()
    configs = list(configurations.find({"login": login}).sort("created_at", -1))
    for c in configs:
        c["_id"] = str(c["_id"])
    return jsonify(configs)


# Przywróć zapisany builder jako aktywny
@builder_bp.route("/restore/<config_id>", methods=["POST"])
@jwt_required()
def restore_configuration(config_id):
    login = get_jwt_identity()
    config = configurations.find_one({"_id": ObjectId(config_id)})
    if not config:
        return jsonify({"error": "Configuration not found"}), 404

    builders.update_one(
        {"login": login},
        {"$set": {
            "components": config["components"],
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    return jsonify({"message": "Configuration restored"})


# Przenieś builder do koszyka
@builder_bp.route("/checkout", methods=["POST"])
@jwt_required()
def builder_to_cart():
    login = get_jwt_identity()
    builder = builders.find_one({"login": login})
    if not builder or not builder.get("components"):
        return jsonify({"error": "Builder is empty"}), 400

    for comp in builder["components"]:
        cart_item = carts.find_one({"login": login, "items.product_id": comp["product_id"]})
        if cart_item:
            continue
        carts.update_one(
            {"login": login},
            {"$push": {"items": {"product_id": comp["product_id"], "quantity": 1}}},
            upsert=True
        )

    # Możemy też opcjonalnie wyczyścić builder po przerzuceniu
    builders.update_one({"login": login}, {"$set": {"components": [], "updated_at": datetime.utcnow()}})
    return jsonify({"message": "Builder moved to cart"})
