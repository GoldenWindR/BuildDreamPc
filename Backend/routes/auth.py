from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import bcrypt
from Backend.models.user import register_user_schema,change_password_schema,update_user_schema ,login_user_schema , validate_json

users_bp = Blueprint("users", __name__)
users_collection = None  

def init_users_routes(database):
    global users_collection
    users_collection = database["users"]


@users_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    print(data)
    error = validate_json(data, register_user_schema)
    if error:
        return jsonify({"error": f"Invalid data: {error}"}), 400

    existing_email = users_collection.find_one({"email": data["email"]})
    if existing_email:
        return jsonify({"error": "Email exist in database"}), 400
    
    existing_login = users_collection.find_one({"login": data["login"]})
    if existing_login:
        return jsonify({"error": "Login exist in database"}), 400
    
    hashed_pw = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    user = {
        "login" : data["login"],
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "email": data["email"],
        "password": hashed_pw,
        "date_of_registration": str(datetime.utcnow().isoformat()),
        "role": data.get("role", "user")
    }

    users_collection.insert_one(user)
    return jsonify({"message": "User registered successfully"}), 201

@users_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    error = validate_json(data, login_user_schema)
    if error:
        return jsonify({"error": f"Invalid data: {error}"}), 400

    user = users_collection.find_one({"login": data["login"]})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user["login"]),
        expires_delta=timedelta(hours=2)
    )

    return jsonify({
        "access_token": access_token
    }), 200

@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = users_collection.find_one({"email": current_user}, {"_id": 0, "password": 0})
    return jsonify(user), 200

@users_bp.route("/password", methods=["POST"])
@jwt_required()
def password_reset():
    current_user = get_jwt_identity()

    user_from_db = users_collection.find_one({"email": current_user})
    if not user_from_db:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    error = validate_json(data, change_password_schema)
    if error:
        return jsonify({"error": f"Invalid data: {error}"}), 400

    if not bcrypt.checkpw(data["old_password"].encode("utf-8"), user_from_db["password"]):
        return jsonify({"error": "Incorrect old password"}), 401

    hashed_new_pw = bcrypt.hashpw(data["new_password"].encode("utf-8"), bcrypt.gensalt())

    users_collection.update_one(
        {"email": current_user},
        {"$set": {"password": hashed_new_pw}}
    )

    return jsonify({"message": "Password updated successfully"}), 200

@users_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_users():
    current_user = get_jwt_identity()
    data = request.json
    
    error = validate_json(data, update_user_schema)
    if error: 
        return jsonify({"error": f"Invalid data: {error}"}), 400
    
    user = {
        "first_name": data["first_name"],
        "last_name": data["last_name"],
    }
    print(current_user)
    result = users_collection.update_one(
        {"email": current_user},
        {"$set": user}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    if result.modified_count == 0:
        return jsonify({"message": "No changes made"}), 200

    return jsonify({"message": "User updated successfully"}), 200

