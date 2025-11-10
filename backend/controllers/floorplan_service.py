import uuid
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta # Import timedelta
from typing import List, Optional, Any, Dict
import asyncio
from utils.websocket_manager import manager
from utils.backup import write_snapshot, load_latest_snapshot
from utils import conflict_resolver
from utils.fault_tolerance import with_retry

from db.redis_conn import get_cache, set_cache, delete_cache
from models.floorplan import FloorPlan, Room, FloorPlanVersion
from models.booking import Booking 
from models.user import User
from models.schemas import FloorPlanCreate, AdminUpdatePayload, RoomUpdate, BookingResponse, UserResponse, FloorPlanResponse


def _capture_floor_plan_snapshot(fp: FloorPlan, db: Session) -> dict:
    # ... (this function is unchanged) ...
    rooms = db.query(Room).filter(Room.floor_plan_id == fp.id).all()
    return {
        "floor_plan": { "id": str(fp.id), "name": fp.name, "width": fp.width, "height": fp.height, "map_data": fp.map_data, },
        "rooms": [{ "id": str(r.id), "name": r.name, "capacity": r.capacity, "features": r.features, "x_coord": r.x_coord, "y_coord": r.y_coord, "width": r.width, "height": r.height } for r in rooms]
    }

def get_floor_plan_by_id(db: Session, floor_plan_id: uuid.UUID, current_user: User) -> Optional[FloorPlan]:
    # ... (this function is unchanged) ...
    cache_key = f"cache:floor_plan:{floor_plan_id}"
    cached_plan = get_cache(cache_key)
    if cached_plan:
        return FloorPlanResponse.model_validate(cached_plan) 

    db_plan = db.query(FloorPlan).options(
        joinedload(FloorPlan.rooms)
    ).filter(
        FloorPlan.id == floor_plan_id,
        FloorPlan.company_id == current_user.company_id
    ).first()

    if db_plan:
        plan_data = FloorPlanResponse.model_validate(db_plan) 
        set_cache(cache_key, plan_data.model_dump(mode='json'), ex=3600) 

    return db_plan

def get_all_floor_plans(db: Session, current_user: User) -> List[FloorPlan]:
    # ... (this function is unchanged) ...
    cache_key = f"cache:all_floor_plans:{current_user.company_id}"
    cached_plans = get_cache(cache_key)
    if cached_plans:
        return [FloorPlanResponse.model_validate(plan) for plan in cached_plans]

    db_plans = db.query(FloorPlan).filter(
        FloorPlan.company_id == current_user.company_id
    ).order_by(FloorPlan.name.asc()).all()

    if db_plans:
        plan_data_list = [FloorPlanResponse.model_validate(plan).model_dump(mode='json') for plan in db_plans]
        set_cache(cache_key, plan_data_list, ex=3600)

    return db_plans

def create_floor_plan(db: Session, fp_data: FloorPlanCreate, current_user: User) -> FloorPlan:
    # ... (this function is unchanged) ...
    new_fp = FloorPlan(name=fp_data.name, map_data=fp_data.map_data, width=fp_data.width, height=fp_data.height, last_modified_at=datetime.utcnow(), company_id=current_user.company_id )
    db.add(new_fp)
    db.flush() 
    for room_data in fp_data.rooms:
        room = Room(floor_plan_id=new_fp.id, **room_data.model_dump())
        db.add(room)
    db.flush()
    snapshot_data = _capture_floor_plan_snapshot(new_fp, db)
    initial_version = FloorPlanVersion(floor_plan_id=new_fp.id, data_snapshot=snapshot_data, committer_id=current_user.id, timestamp=new_fp.last_modified_at)
    db.add(initial_version)
    new_fp.current_version_id = initial_version.id
    with_retry(db.commit)
    db.refresh(new_fp)
    
    # Persist initial snapshot for recovery
    write_snapshot(str(new_fp.id), snapshot_data)
    delete_cache(f"cache:all_floor_plans:{current_user.company_id}")

    # --- NEW: Publish WebSocket update for plan creation ---
    try:
        asyncio.run(manager.publish_update(
            floor_plan_id=str(new_fp.id),
            company_id=str(current_user.company_id),
            event_type="FLOOR_PLAN_CHANGED"
        ))
        print(f"Published WebSocket update for new floor plan {new_fp.id}")
    except Exception as e:
        print(f"CRITICAL: Failed to publish WebSocket update: {e}")
    # --- END NEW ---

    return new_fp

def update_floor_plan_and_resolve_conflict(db: Session, payload: AdminUpdatePayload, current_user: User) -> FloorPlan:
    # ... (previous logic for this function is unchanged) ...
    fp_to_update = db.query(FloorPlan).options(
        joinedload(FloorPlan.rooms) 
    ).filter(
        FloorPlan.id == payload.floor_plan_id, 
        FloorPlan.company_id == current_user.company_id
    ).first()
    
    if not fp_to_update:
        raise ValueError(f"Floor Plan not found or you do not have permission to edit it.")
    
    client_ts_utc = payload.client_last_modified_at.replace(tzinfo=None)
    db_ts_utc = fp_to_update.last_modified_at.replace(tzinfo=None)
    
    conflict_note = None
    if db_ts_utc > client_ts_utc:
        resolution = conflict_resolver.should_override(
            db=db,
            floor_plan=fp_to_update,
            current_user=current_user,
            conflicting_timestamp_utc=db_ts_utc,
        )
        if not resolution.allow_override:
            raise ValueError(resolution.reason)
        conflict_note = resolution.reason
        print(f"[CONFLICT] {resolution.reason}")

    existing_room_ids = {str(room.id) for room in fp_to_update.rooms}
    updated_room_ids = set()

    for update in payload.room_updates:
        room_id_str = str(update.room_id)
        updated_room_ids.add(room_id_str)
        
        room = db.query(Room).filter(
            Room.id == update.room_id, 
            Room.floor_plan_id == fp_to_update.id
        ).first()

        update_data = update.model_dump(exclude_unset=True) 
        
        if room:
            print(f"Updating room: {update_data.get('name', room.name)}")
            conflict_resolver.apply_room_updates(room, update_data)
        else:
            print(f"Creating new room: {update_data.get('name', 'N/A')}")
            client_room_id = update_data.pop('room_id', None)
            if not client_room_id:
                raise ValueError("New room data is missing 'room_id'")

            new_room = Room(
                id=client_room_id, 
                floor_plan_id=fp_to_update.id,
                **update_data 
            )
            db.add(new_room)

    rooms_to_delete = existing_room_ids - updated_room_ids
    if rooms_to_delete:
        print(f"Deleting rooms: {rooms_to_delete}")
        db.query(Room).filter(
            Room.id.in_([uuid.UUID(rid) for rid in rooms_to_delete]),
            Room.floor_plan_id == fp_to_update.id
        ).delete(synchronize_session=False)

    new_modified_at = datetime.utcnow()
    fp_to_update.last_modified_at = new_modified_at
    db.flush() 
    
    snapshot_data = _capture_floor_plan_snapshot(fp_to_update, db)
    if conflict_note:
        snapshot_data.setdefault("meta", {})["conflict_resolution"] = conflict_note
    new_version = FloorPlanVersion(
        floor_plan_id=fp_to_update.id, 
        data_snapshot=snapshot_data, 
        committer_id=current_user.id, 
        timestamp=new_modified_at
    )
    db.add(new_version)
    fp_to_update.current_version_id = new_version.id
    
    with_retry(db.commit)
    db.refresh(fp_to_update) 
    
    # Persist snapshot to disk for disaster recovery
    write_snapshot(str(fp_to_update.id), snapshot_data)
    
    delete_cache(f"cache:all_floor_plans:{current_user.company_id}")
    delete_cache(f"cache:floor_plan:{payload.floor_plan_id}")
    delete_cache(f"cache:floor_plan_status:{payload.floor_plan_id}")
    
    # --- NEW: Publish WebSocket update for plan edits ---
    try:
        asyncio.run(manager.publish_update(
            floor_plan_id=str(fp_to_update.id),
            company_id=str(current_user.company_id),
            event_type="FLOOR_PLAN_CHANGED" # New event type
        ))
        print(f"Published WebSocket update for floor plan {fp_to_update.id}")
    except Exception as e:
        print(f"CRITICAL: Failed to publish WebSocket update: {e}")
    # --- END NEW ---
    
    return fp_to_update


def restore_floor_plan_from_backup(
    db: Session,
    floor_plan_id: uuid.UUID,
    current_user: User,
) -> FloorPlan:
    """
    Rehydrate the most recent floor plan snapshot from disk.
    """
    fp = db.query(FloorPlan).options(joinedload(FloorPlan.rooms)).filter(
        FloorPlan.id == floor_plan_id,
        FloorPlan.company_id == current_user.company_id,
    ).first()

    if not fp:
        raise ValueError("Floor Plan not found or you do not have permission to restore it.")

    snapshot = load_latest_snapshot(str(floor_plan_id))
    if not snapshot:
        raise ValueError("No backup snapshots available for this floor plan.")

    plan_data = snapshot.get("floor_plan", {})
    rooms_data = snapshot.get("rooms", [])

    fp.name = plan_data.get("name", fp.name)
    fp.width = plan_data.get("width", fp.width)
    fp.height = plan_data.get("height", fp.height)
    fp.map_data = plan_data.get("map_data", fp.map_data)

    # Replace rooms with snapshot state
    db.query(Room).filter(Room.floor_plan_id == fp.id).delete(synchronize_session=False)
    for room_info in rooms_data:
        room = Room(
            id=uuid.UUID(room_info["id"]),
            floor_plan_id=fp.id,
            name=room_info["name"],
            capacity=room_info["capacity"],
            features=room_info.get("features"),
            x_coord=room_info["x_coord"],
            y_coord=room_info["y_coord"],
            width=room_info["width"],
            height=room_info["height"],
        )
        db.add(room)

    new_snapshot = _capture_floor_plan_snapshot(fp, db)
    new_snapshot.setdefault("meta", {})["restored_from_backup"] = True

    fp.last_modified_at = datetime.utcnow()
    new_version = FloorPlanVersion(
        floor_plan_id=fp.id,
        data_snapshot=new_snapshot,
        committer_id=current_user.id,
        timestamp=fp.last_modified_at,
    )
    db.add(new_version)
    fp.current_version_id = new_version.id

    with_retry(db.commit)
    db.refresh(fp)

    write_snapshot(str(fp.id), new_snapshot)
    delete_cache(f"cache:all_floor_plans:{current_user.company_id}")
    delete_cache(f"cache:floor_plan:{floor_plan_id}")
    delete_cache(f"cache:floor_plan_status:{floor_plan_id}")

    try:
        asyncio.run(
            manager.publish_update(
                floor_plan_id=str(fp.id),
                company_id=str(current_user.company_id),
                event_type="FLOOR_PLAN_RESTORED",
            )
        )
    except Exception as exc:  # pragma: no cover - defensive guard
        print(f"CRITICAL: Failed to publish restore update: {exc}")

    return fp

def get_floor_plan_with_status(db: Session, floor_plan_id: uuid.UUID, current_user: User) -> dict:
    """
    Gets a floor plan with live booking status.
    Uses caching.
    """
    cache_key = f"cache:floor_plan_status:{floor_plan_id}"
    
    cached_status = get_cache(cache_key)
    if cached_status:
        return cached_status

    db_plan = db.query(FloorPlan).options(
        joinedload(FloorPlan.rooms)
    ).filter(
        FloorPlan.id == floor_plan_id,
        FloorPlan.company_id == current_user.company_id
    ).first()
    
    if not db_plan:
        raise ValueError("Floor Plan not found or you do not have permission to view it.")
    
    # --- P1 FIX: Use timezone-naive UTC now for comparison ---
    # Database typically stores timestamps without explicit timezone, so we must match.
    now = datetime.utcnow().replace(tzinfo=None)
    # --- END P1 FIX ---
    
    room_ids = [room.id for room in db_plan.rooms]
    
    # Query for actively booked rooms
    active_bookings = db.query(Booking).options(
        joinedload(Booking.user)
    ).filter(
        Booking.room_id.in_(room_ids),
        # A booking is active if its end time is in the future
        # AND its start time is in the past (or now).
        Booking.start_time <= now,
        Booking.end_time > now 
    ).all()
    
    booking_map = {str(booking.room_id): booking for booking in active_bookings}
    
    floor_plan_response = FloorPlanResponse.model_validate(db_plan).model_dump(mode='json')
    
    annotated_rooms = []
    for room in floor_plan_response['rooms']:
        # P4 REQUIREMENT: We need the User object for the Admin hover card.
        # This booking object already has the user eager loaded (joinedload(Booking.user)).
        booking = booking_map.get(room['id']) 
        
        if booking:
            room['current_status'] = "Booked"
            # --- P1/P4 ENHANCEMENT: Include committer name/email for Admin hover ---
            room['current_booking_details'] = {
                "user_email": booking.user.email,
                "user_id": str(booking.user.id),
                "end_time": booking.end_time.isoformat()
            }
        else:
            room['current_status'] = "Available"
            room['current_booking_details'] = None
        
        annotated_rooms.append(room)
        
    floor_plan_response['rooms'] = annotated_rooms
    
    floor_plan_response['current_version_id'] = str(db_plan.current_version_id) if db_plan.current_version_id else None
    
    set_cache(cache_key, floor_plan_response, ex=10) 
    
    return floor_plan_response