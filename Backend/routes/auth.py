from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import bcrypt
from models.user import register_user_schema,change_password_schema,update_user_schema ,login_user_schema , validate_json

import re
users_bp = Blueprint("users", __name__)
users_collection = None  

def init_users_routes(database):
    global users_collection
    users_collection = database["users"]



EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

def validate_email(email: str):
    if not EMAIL_REGEX.match(email):
        return "Niepoprawne forma emaila"
    return None

def validate_password(password: str):
    if len(password) < 8:
        return "Hasło musi mieć przynajmniej 8 znaków"
    if not re.search(r"[A-Z]", password):
        return "Hasło musi mieć przynajmniej jeden dużą litere"
    if not re.search(r"[a-z]", password):
        return "Hasło musi mieć przynajmniej jeden małą litere"
    if not re.search(r"[0-9]", password):
        return "Hasło musi mieć przynajmniej jeden cyfre"
    return None

def validate_name(value: str, field: str):
    if not value or not value.strip():
        return f"{field} cannot be empty"
    if len(value.strip()) < 2:
        return f"{field} must be at least 2 characters long"
    return None


@users_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    error = validate_json(data, register_user_schema)
    if error:
        return jsonify({"error": f"Invalid data: {error}"}), 400

    login_normalized = data["login"].strip().lower()
    email_normalized = data["email"].strip().lower()

    if err := validate_email(email_normalized):
        return jsonify({"error": err}), 400

    if err := validate_password(data["password"]):
        return jsonify({"error": err}), 400

    if err := validate_name(data["first_name"], "First name"):
        return jsonify({"error": err}), 400

    if err := validate_name(data["last_name"], "Last name"):
        return jsonify({"error": err}), 400

    if users_collection.find_one({"email": email_normalized}):
        return jsonify({"error": "Email exists in database"}), 400

    if users_collection.find_one({"login": login_normalized}):
        return jsonify({"error": "Login exists in database"}), 400

    hashed_pw = bcrypt.hashpw(
        data["password"].encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user = {
        "login": login_normalized,
        "first_name": data["first_name"].strip(),
        "last_name": data["last_name"].strip(),
        "email": email_normalized,
        "password": hashed_pw,
        "date_of_registration": datetime.utcnow().isoformat(),
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

    login_normalized = data["login"].strip().lower()
    user = users_collection.find_one({"login": login_normalized})

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user["login"]),
        additional_claims={"role": user["role"]},
        expires_delta=timedelta(hours=2)
    )

    return jsonify({"access_token": access_token}), 200

@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = users_collection.find_one({"login": current_user}, {"_id": 0, "password": 0})
    return jsonify(user), 200

@users_bp.route("/password", methods=["POST"])
@jwt_required()
def password_reset():
    current_user = get_jwt_identity()

    user_from_db = users_collection.find_one({"login": current_user})
    if not user_from_db:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    error = validate_json(data, change_password_schema)
    if error:
        return jsonify({"error": f"Invalid data: {error}"}), 400

    if not bcrypt.checkpw(
        data["old_password"].encode("utf-8"),
        user_from_db["password"].encode("utf-8")
    ):
        return jsonify({"error": "Stare hasło nie poprawne"}), 401

    if err := validate_password(data["new_password"]):
        return jsonify({"error": err}), 400

    hashed_new_pw = bcrypt.hashpw(
        data["new_password"].encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    users_collection.update_one(
        {"login": current_user},
        {"$set": {"password": hashed_new_pw}}
    )

    return jsonify({"message": "Udało sie zmienić hasło"}), 200


@users_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_users():
    current_user = get_jwt_identity()
    data = request.json

    error = validate_json(data, update_user_schema)
    if error:
        return jsonify({"error": f"Invalid data: {error}"}), 400

    if err := validate_name(data["first_name"], "First name"):
        return jsonify({"error": err}), 400

    if err := validate_name(data["last_name"], "Last name"):
        return jsonify({"error": err}), 400

    result = users_collection.update_one(
        {"login": current_user},
        {"$set": {
            "first_name": data["first_name"].strip(),
            "last_name": data["last_name"].strip()
        }}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    if result.modified_count == 0:
        return jsonify({"message": "No changes made"}), 200

    return jsonify({"message": "User updated successfully"}), 200


