# FILE: ./backend/db/redis_conn.py
import redis
from constants import REDIS_URL
import json
from typing import Any
from utils.encoders import CustomJSONEncoder # --- NEW: Import the encoder ---

# Create a Redis connection pool
try:
    redis_conn = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    redis_conn.ping()
    print("Successfully connected to Redis.")
except redis.exceptions.ConnectionError as e:
    print(f"Failed to connect to Redis: {e}")
    redis_conn = None

def get_redis():
    """Dependency to get the redis connection"""
    if not redis_conn:
        raise Exception("Redis connection not available.")
    return redis_conn

# --- Helper Functions for Caching ---

def set_cache(key: str, data: Any, ex: int = 3600):
    """Sets data in Redis cache with an expiration time."""
    if redis_conn:
        try:
            # --- FIX: Use the custom encoder ---
            redis_conn.set(key, json.dumps(data, cls=CustomJSONEncoder), ex=ex)
        except Exception as e:
            print(f"Error setting cache for key {key}: {e}")

def get_cache(key: str) -> Any:
    """Gets data from Redis cache."""
    if redis_conn:
        try:
            cached_data = redis_conn.get(key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error getting cache for key {key}: {e}")
    return None

def delete_cache(key: str):
    """Deletes a key from Redis cache."""
    if redis_conn:
        try:
            redis_conn.delete(key)
        except Exception as e:
            print(f"Error deleting cache for key {key}: {e}")