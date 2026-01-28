from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId

compat_bp = Blueprint("compatibility", __name__)

products = None

def init_compat_routes(db):
    global products
    products = db["products"]
#spoko do opisania
@compat_bp.route("/recommend", methods=["POST"])
def recommend_parts():
    data = request.json or {}

    def get(pid):
        if not pid:
            return None
        try:
            return products.find_one({"_id": ObjectId(pid)})
        except (InvalidId, TypeError):
            return None

    cpu = get(data.get("cpu"))
    mobo = get(data.get("motherboard"))
    ram = get(data.get("ram"))
    gpu = get(data.get("gpu"))
    psu = get(data.get("psu"))
    case = get(data.get("case"))

    recommendations = {}

    if not cpu and mobo:
        socket = mobo.get("details", {}).get("socket")
        if socket:
            recommendations["cpu"] = list(products.find({
                "type": "cpu",
                "details.socket": socket
            }).sort("price", 1).limit(5))

    if not mobo and cpu:
        socket = cpu.get("details", {}).get("socket")
        if socket:
            recommendations["motherboard"] = list(products.find({
                "type": "motherboard",
                "details.socket": socket
            }).sort("price", 1).limit(5))

    if not ram and mobo:
        ram_type = mobo.get("details", {}).get("ram_type")
        if ram_type:
            recommendations["ram"] = list(products.find({
                "type": "ram",
                "details.ram_type": ram_type
            }).sort("details.speed", -1).limit(5))

    if not gpu:
        recommendations["gpu"] = list(products.find({
            "type": "gpu"
        }).sort("price", 1).limit(5))

    if not case and mobo:
        form_factor = mobo.get("details", {}).get("form_factor")
        if form_factor:
            query = {
                "type": "case",
                "details.supported_form_factors": form_factor
            }
            if gpu and gpu.get("details", {}).get("length_mm"):
                query["details.gpu_max_length_mm"] = {"$gte": gpu["details"]["length_mm"]}
            recommendations["case"] = list(products.find(query).limit(5))

    power_ids = [p["_id"] for p in [cpu, gpu] if p and p.get("power_draw")]

    total_power = 0
    if power_ids:
        result = list(products.aggregate([
            {"$match": {"_id": {"$in": power_ids}}},
            {"$group": {"_id": None, "total": {"$sum": "$power_draw"}}}
        ]))
        total_power = result[0]["total"] if result else 0

    recommended_wattage = int(total_power * 1.3) if total_power else 0

    if not psu and recommended_wattage > 0:
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
    }), 200
