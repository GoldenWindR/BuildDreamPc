import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI_ADMIN = os.getenv("MONGO_URI_ADMIN")
    MONGO_URI_USER = os.getenv("MONGO_URI_USER")
    DB_NAME = os.getenv("DB_NAME")
    JWT_SECRET = os.getenv("JWT_SECRET")
