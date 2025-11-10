# FILE: ./backend/constants.py
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# --- Database Configuration (Updated for your local PostgreSQL) ---
DB_USER = os.environ.get("DB_USER", "myuser") 
DB_PASSWORD = os.environ.get("DB_PASSWORD", "mypassword") 
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "postgres") 

DATABASE_URL = os.environ.get("DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# --- NEW: Redis Configuration ---
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = os.environ.get("REDIS_PORT", 6379)
REDIS_URL = os.environ.get("REDIS_URL", "redis://default:6379" )

# --- Application Configuration ---
PROJECT_NAME = "Intelligent Floor Plan Management System"
API_V1_STR = "/api/v1"

# --- Security Configuration ---
SECRET_KEY = os.environ.get("SECRET_KEY", "super_secret_key_change_me") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

# --- System Constants ---
ADMIN_ROLE = "admin"
STANDARD_ROLE = "standard"

ROLE_PRIORITIES = {
    ADMIN_ROLE: 10,
    STANDARD_ROLE: 1,
}