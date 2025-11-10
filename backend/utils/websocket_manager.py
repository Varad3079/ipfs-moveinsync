import json
from typing import Dict, List
from fastapi import WebSocket
# --- UPDATED: Import async redis and REDIS_URL ---
from db.redis_conn import redis_conn, get_redis
import redis.asyncio as aioredis
from constants import REDIS_URL

# We will use a Redis Pub/Sub channel to broadcast messages
# This allows multiple, separate server processes to communicate
REDIS_CHANNEL = "live_feed_channel"

class ConnectionManager:
    def __init__(self):
        # --- UPDATED: We now manage two separate connection pools ---
        # For floor-plan-specific feeds (e.g., /ws/live-feed/user/{id})
        self.floor_plan_connections: Dict[str, List[WebSocket]] = {}
        # For company-wide feeds (e.g., /ws/admin/live-feed/company)
        self.company_connections: Dict[str, List[WebSocket]] = {}
        # --- END UPDATE ---

    # --- NEW: Connect for a specific floor plan ---
    async def connect_floor_plan(self, websocket: WebSocket, floor_plan_id: str):
        """Accepts a new WebSocket connection for a specific floor plan."""
        await websocket.accept()
        if floor_plan_id not in self.floor_plan_connections:
            self.floor_plan_connections[floor_plan_id] = []
        self.floor_plan_connections[floor_plan_id].append(websocket)
        print(f"New connection for floor plan {floor_plan_id}. Total: {len(self.floor_plan_connections[floor_plan_id])}")

    # --- NEW: Disconnect from a specific floor plan ---
    def disconnect_floor_plan(self, websocket: WebSocket, floor_plan_id: str):
        """Removes a WebSocket connection from a floor plan."""
        if floor_plan_id in self.floor_plan_connections:
            self.floor_plan_connections[floor_plan_id].remove(websocket)
            print(f"Disconnected from floor plan {floor_plan_id}. Remaining: {len(self.floor_plan_connections[floor_plan_id])}")

    # --- NEW: Connect for a whole company ---
    async def connect_company(self, websocket: WebSocket, company_id: str):
        """Accepts a new WebSocket connection for a company-wide feed."""
        await websocket.accept()
        if company_id not in self.company_connections:
            self.company_connections[company_id] = []
        self.company_connections[company_id].append(websocket)
        print(f"New connection for company {company_id}. Total: {len(self.company_connections[company_id])}")

    # --- NEW: Disconnect from a whole company ---
    def disconnect_company(self, websocket: WebSocket, company_id: str):
        """Removes a WebSocket connection from a company-wide feed."""
        if company_id in self.company_connections:
            self.company_connections[company_id].remove(websocket)
            print(f"Disconnected from company {company_id}. Remaining: {len(self.company_connections[company_id])}")

    # --- UNCHANGED: This function is perfect as-is ---
    async def publish_update(self, floor_plan_id: str, company_id: str, event_type: str = "BOOKING_CHANGED"):
        """
        Publishes an update to the Redis channel using an ASYNC client.
        This will be received by ALL server instances.
        """
        r = None
        try:
            r = await aioredis.from_url(REDIS_URL)
            
            message = {
                "floor_plan_id": str(floor_plan_id),
                "company_id": str(company_id),
                "event": event_type
            }
            await r.publish(REDIS_CHANNEL, json.dumps(message))
            
        except Exception as e:
            print(f"CRITICAL: Failed to publish WebSocket update to Redis: {e}")
        finally:
            if r:
                await r.close()

# Create a single global instance
manager = ConnectionManager()