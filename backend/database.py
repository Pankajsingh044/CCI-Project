import os

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

load_dotenv()

MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb://127.0.0.1:27017"
)

DATABASE_NAME = os.getenv(
    "MONGODB_DATABASE",
    "CCI_Database"
)

client = AsyncMongoClient(MONGODB_URL)

db = client[DATABASE_NAME]

users_collection = db["users"]
reviews_collection = db["reviews"]
analysis_history_collection = db["analysis_history"]


async def connect_to_mongodb():
    try:
        await client.admin.command("ping")

        print("===================================")
        print("MongoDB connected successfully")
        print(f"Database: {DATABASE_NAME}")
        print("===================================")

    except Exception as error:
        print("===================================")
        print("MongoDB connection failed")
        print(f"Error: {error}")
        print("===================================")
        raise


async def close_mongodb_connection():
    await client.close()

    print("MongoDB connection closed")