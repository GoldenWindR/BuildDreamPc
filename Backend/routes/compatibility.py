from flask import Blueprint, request, jsonify
from bson import ObjectId

compat_bp = Blueprint("compatibility", __name__)

products = None


def init_compat_routes(db):
    global products
    products = db["products"]
    
@compat_bp.route("/recommend", methods=["POST"])
def recommend_parts():
    data = request.json or {}

    def get(pid):
        return products.find_one({"_id": ObjectId(pid)}) if pid else None

    cpu = get(data.get("cpu"))
    mobo = get(data.get("motherboard"))
    ram = get(data.get("ram"))
    gpu = get(data.get("gpu"))
    psu = get(data.get("psu"))
    case = get(data.get("case"))

    recommendations = {}

    if not cpu and mobo:
        recommendations["cpu"] = list(products.find({
            "type": "cpu",
            "details.socket": mobo["details"]["socket"]
        }).sort("price", 1).limit(5))

    if not mobo and cpu:
        recommendations["motherboard"] = list(products.find({
            "type": "motherboard",
            "details.socket": cpu["details"]["socket"]
        }).sort("price", 1).limit(5))

    if not ram and mobo:
        recommendations["ram"] = list(products.find({
            "type": "ram",
            "details.ram_type": mobo["details"]["ram_type"]
        }).sort("details.speed", -1).limit(5))

    if not gpu:
        recommendations["gpu"] = list(products.find({
            "type": "gpu"
        }).sort("price", 1).limit(5))

    if not case and mobo:
        query = {
            "type": "case",
            "details.supported_form_factors": mobo["details"]["form_factor"]
        }

        if gpu:
            query["details.gpu_max_length_mm"] = {
                "$gte": gpu["details"]["length_mm"]
            }

        recommendations["case"] = list(products.find(query).limit(5))

    power_ids = [
        p["_id"] for p in [cpu, gpu] if p and p.get("power_draw")
    ]

    total_power = 0
    if power_ids:
        result = list(products.aggregate([
            {"$match": {"_id": {"$in": power_ids}}},
            {"$group": {"_id": None, "total": {"$sum": "$power_draw"}}}
        ]))
        total_power = result[0]["total"] if result else 0

    recommended_wattage = int(total_power * 1.3)

    if not psu:
        recommendations["psu"] = list(products.find({
            "type": "psu",
            "details.wattage": {"$gte": recommended_wattage}
        }).sort("details.wattage", 1).limit(5))

    for key in recommendations:
        for p in recommendations[key]:
            p["_id"] = str(p["_id"])

    return jsonify({
        "current_power_draw": total_power,
        "recommended_psu_wattage": recommended_wattage,
        "recommendations": recommendations
    })
