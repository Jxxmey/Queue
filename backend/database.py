import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "queue_system")

# เชื่อมต่อกับ MongoDB
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

def get_collection(collection_name: str):
    return db[collection_name]