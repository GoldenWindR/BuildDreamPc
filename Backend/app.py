from flask import Flask
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from config.settings import Config

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET

jwt = JWTManager(app)

client = MongoClient(Config.MONGO_URI_USER)

db = client["shop_db"]

from routes.auth import users_bp, init_users_routes

init_users_routes(db)

app.register_blueprint(users_bp, url_prefix="/users")


if __name__ == "__main__":
   app.run(
    debug=True, passthrough_errors=True,
    use_debugger=False, use_reloader=False
)