from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from config.settings import Config

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET

CORS(app)  

jwt = JWTManager(app)

client = MongoClient(Config.MONGO_URI_USER)
clientAdmin = MongoClient(Config.MONGO_URI_ADMIN)
db = client[Config.DB_NAME]
dbAdmin = clientAdmin[Config.DB_NAME]
from routes.auth import users_bp, init_users_routes
from routes.products import products_bp, init_products_routes
from routes.cart import cart_bp, init_cart_routes
from routes.compatibility import compat_bp, init_compat_routes
init_users_routes(db)
init_products_routes(db)
init_cart_routes(db)
init_compat_routes(db)
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(products_bp, url_prefix="/products")
app.register_blueprint(cart_bp, url_prefix="/cart")
app.register_blueprint(compat_bp, url_prefix="/compatibility")


if __name__ == "__main__":
    app.run(
        debug=True,
        passthrough_errors=True,
        use_debugger=False,
        use_reloader=False
    )
