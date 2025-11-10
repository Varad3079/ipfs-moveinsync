import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from models.user import User
from utils.security import get_websocket_admin_user, get_websocket_user
from utils.websocket_manager import manager, REDIS_CHANNEL
from db.redis_conn import get_redis
import redis.asyncio as aioredis 
from typing import Optional # --- NEW: Import Optional ---

router = APIRouter()

# --- UPDATED: The redis_listener is now more powerful ---
async def redis_listener(websocket: WebSocket, company_id: str, floor_plan_id: Optional[str] = None):
    """
    Listens to the Redis Pub/Sub channel and forwards messages.
    - If floor_plan_id is provided, it only sends messages for that floor.
    - If floor_plan_id is None, it sends ALL messages for the company.
    """
    r = None # --- FIX: Define r outside try block ---
    try:
        r = await aioredis.from_url("redis://localhost:6379")
        async with r.pubsub() as pubsub:
            await pubsub.subscribe(REDIS_CHANNEL)
            
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None)
                if message:
                    data = json.loads(message['data'])
                    
                    # --- UPDATED: New filtering logic ---
                    if data.get("company_id") == str(company_id):
                        
                        if floor_plan_id: 
                            # This is a floor-specific feed
                            if data.get("floor_plan_id") == str(floor_plan_id):
                                await websocket.send_text(json.dumps(data))
                        else:
                            # This is a company-wide feed, send all company messages
                            await websocket.send_text(json.dumps(data))
                    # --- END UPDATED LOGIC ---

    except asyncio.CancelledError:
        print("Redis listener cancelled.")
    except Exception as e:
        print(f"Redis listener error: {e}")
    finally:
        # --- FIX: Check if r was successfully initialized ---
        if r:
            await r.close()

# --- UPDATED: To use new manager methods ---
@router.websocket("/ws/admin/live-feed/{floor_plan_id}")
async def admin_websocket_endpoint(
    websocket: WebSocket,
    floor_plan_id: str,
    current_admin: User = Depends(get_websocket_admin_user)
):
    """
    Handles the *admin* live-feed WebSocket connection for a *specific floor*.
    """
    await manager.connect_floor_plan(websocket, floor_plan_id) # --- UPDATED ---
    
    listener_task = None
    try:
        listener_task = asyncio.create_task(
            redis_listener(websocket, str(current_admin.company_id), floor_plan_id) # --- UPDATED ---
        )
        while True:
            await websocket.receive_text() 
            
    except WebSocketDisconnect:
        print(f"Admin client disconnected from floor plan {floor_plan_id}")
    finally:
        if listener_task:
            listener_task.cancel() 
        manager.disconnect_floor_plan(websocket, floor_plan_id) # --- UPDATED ---

# --- NEW: The company-wide endpoint for admins ---
@router.websocket("/ws/admin/live-feed/company")
async def admin_company_websocket_endpoint(
    websocket: WebSocket,
    current_admin: User = Depends(get_websocket_admin_user)
):
    """
    Handles the *admin* live-feed WebSocket connection for the *entire company*.
    """
    company_id_str = str(current_admin.company_id)
    await manager.connect_company(websocket, company_id_str) # --- NEW ---
    
    listener_task = None
    try:
        listener_task = asyncio.create_task(
            redis_listener(websocket, company_id_str, floor_plan_id=None) # --- Pass None for floor_plan_id ---
        )
        while True:
            await websocket.receive_text() 
            
    except WebSocketDisconnect:
        print(f"Admin client disconnected from company feed {company_id_str}")
    finally:
        if listener_task:
            listener_task.cancel() 
        manager.disconnect_company(websocket, company_id_str) # --- NEW ---

# --- UPDATED: To use new manager methods ---
@router.websocket("/ws/live-feed/user/{floor_plan_id}")
async def user_websocket_endpoint(
    websocket: WebSocket,
    floor_plan_id: str,
    current_user: User = Depends(get_websocket_user)
):
    """
    Handles the *user* live-feed WebSocket connection.
    """
    await manager.connect_floor_plan(websocket, floor_plan_id) # --- UPDATED ---
    
    listener_task = None
    try:
        listener_task = asyncio.create_task(
            redis_listener(websocket, str(current_user.company_id), floor_plan_id) # --- UPDATED ---
        )
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        print(f"User client disconnected from floor plan {floor_plan_id}")
    finally:
        if listener_task:
            listener_task.cancel() 
        manager.disconnect_floor_plan(websocket, floor_plan_id) # --- UPDATED ---