# FILE: ./backend/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from constants import PROJECT_NAME, API_V1_STR
from utils.monitoring import metrics, now, to_dict
import uvicorn

# --- Import all models so Base can discover them and create the tables ---
from models import user, floorplan, booking, company 
# --- Import Routers ---
from routes import auth_routes, admin_routes
from routes import sync_routes
from routes import meeting_routes 
from routes import live_routes 

# Note: These imports are essential for SQLAlchemy's declarative base to work.

origins = [
        "http://localhost:3000",
        "http://localhost:5173", # --- ENSURE THIS LINE IS PRESENT ---
        "*" # Using "*" is a fallback, but 5173 should be enough
    ]

# --- Create Database Tables ---
def create_db_tables():
    print("Attempting to create database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully (or already exist).")

# --- Application Initialization ---
app = FastAPI(
    title=PROJECT_NAME,
    version="0.1.0",
    description="Backend for Intelligent Floor Plan Management System (IFPMS) using FastAPI.",
)


@app.middleware("http")
async def monitoring_middleware(request, call_next):
    start_time = now()
    try:
        response = await call_next(request)
        metrics.record(now() - start_time, response.status_code < 500)
        return response
    except Exception:
        metrics.record(now() - start_time, False)
        raise

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  
    allow_methods=["*"],     
    allow_headers=["*"],     
)

# --- Include Routers ---
app.include_router(auth_routes.router, prefix=API_V1_STR + "/auth", tags=["Authentication"]) 
app.include_router(admin_routes.router, prefix=API_V1_STR + "/admin", tags=["Admin Management"])
app.include_router(sync_routes.router, prefix=API_V1_STR + "/sync", tags=["Offline Sync"])
app.include_router(meeting_routes.router, prefix=API_V1_STR + "/meetings", tags=["Meeting Optimization"]) 
app.include_router(live_routes.router, tags=["Live Updates (WebSocket)"]) 

@app.on_event("startup")
async def startup_event():
    """Run database table creation on application startup."""
    create_db_tables()

@app.get("/")
def health_check():
    return {"message": "IFPMS Backend is running successfully!"}


@app.get(f"{API_V1_STR}/system/metrics")
def system_metrics():
    return {"metrics": to_dict()}

if __name__ == "__main__":
    create_db_tables() 
    uvicorn.run(app, host="0.0.0.0", port=8000)