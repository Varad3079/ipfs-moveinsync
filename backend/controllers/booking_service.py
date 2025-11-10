# FILE: ./backend/controllers/booking_service.py
import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, not_, func, Integer
from datetime import datetime
import math
from typing import List, Optional, Dict, Any # --- Add Dict, Any ---

# --- Import floorplan_service to reuse its logic ---
from controllers import floorplan_service 

# Import ORM Models
from models.floorplan import Room, FloorPlan
from models.booking import Booking, UserPreference
from models.user import User
# Import Pydantic Schemas
from models.schemas import BookingCreate, RoomAvailabilityRequest, RoomRecommendationRequest, RecommendedRoomResponse

from tasks import send_booking_confirmation
from utils.websocket_manager import manager
from db.redis_conn import delete_cache
import asyncio

# --- UPDATED: Now tenant-aware ---
def get_available_rooms(db: Session, request: RoomAvailabilityRequest, current_user: User) -> List[Room]:
    """
    Finds rooms *within the user's company* that are available and meet capacity.
    """
    
    # 1. Find all Room IDs that are *booked* (conflicting) in the desired slot.
    conflicting_bookings = db.query(Booking.room_id).filter(
        and_(
            Booking.start_time < request.end_time,
            Booking.end_time > request.start_time
        )
    ).distinct()
    
    # 2. Find all rooms that:
    #    a) Meet the minimum capacity
    #    b) Are NOT in the conflicting list
    #    c) Belong to a FloorPlan owned by the user's company
    available_rooms = db.query(Room).join(
        FloorPlan, Room.floor_plan_id == FloorPlan.id
    ).filter(
        and_(
            Room.capacity.cast(Integer) >= request.min_capacity,
            not_(Room.id.in_(conflicting_bookings)),
            FloorPlan.company_id == current_user.company_id  # --- TENANCY ENFORCED ---
        )
    ).all()
    
    return available_rooms

# --- UPDATED: Now tenant-aware ---
def get_recommended_rooms(
    db: Session, request: RoomRecommendationRequest, current_user: User
) -> List[RecommendedRoomResponse]:
    """
    Finds available, tenant-owned rooms and ranks them based on user's weightage.
    """
    
    # 1. Find all available rooms (this function is now tenant-aware)
    availability_request = RoomAvailabilityRequest(
        start_time=request.start_time,
        end_time=request.end_time,
        min_capacity=request.participants
    )
    available_rooms = get_available_rooms(db, availability_request, current_user)
    
    if not available_rooms:
        return []

    # 2. Get user's preferences for these specific rooms
    available_room_ids = [room.id for room in available_rooms]
    
    preferences = db.query(UserPreference).filter(
        and_(
            UserPreference.user_id == current_user.id,
            UserPreference.room_id.in_(available_room_ids)
        )
    ).all()
    
    preference_map = {pref.room_id: pref.weightage for pref in preferences}
    latest_preference = (
        max(preferences, key=lambda pref: pref.last_booked_at)
        if preferences
        else None
    )

    anchor_coords = None
    if latest_preference:
        anchor_room = next(
            (room for room in available_rooms if room.id == latest_preference.room_id),
            None,
        )
        if not anchor_room:
            anchor_room = db.query(Room).filter(Room.id == latest_preference.room_id).first()
        if anchor_room:
            anchor_coords = (anchor_room.x_coord, anchor_room.y_coord)

    # 3. Build and sort the recommendation list
    recommended_rooms = []
    for room in available_rooms:
        score = preference_map.get(room.id, 1.0)
        proximity_score = 0.0
        if anchor_coords:
            distance = math.dist(anchor_coords, (room.x_coord, room.y_coord))
            proximity_score = round(1 / (1 + distance), 4)
            score += proximity_score
        
        # Use .model_validate() for safer Pydantic conversion
        rec_room = RecommendedRoomResponse.model_validate(room)
        rec_room.recommendation_score = score
        rec_room.proximity_score = proximity_score
        recommended_rooms.append(rec_room)
        
    recommended_rooms.sort(key=lambda r: (r.recommendation_score, -int(r.capacity)), reverse=True)
    
    return recommended_rooms

# --- UPDATED: create_new_booking (to dispatch async task) ---
def create_new_booking(
    db: Session, booking_data: BookingCreate, current_user: User
) -> Booking:
    """
    Creates a new booking, dispatches an async task, AND
    publishes a real-time update.
    """
    
    # 1. --- TENANCY CHECK ---
    room_to_book = db.query(Room).join(
        FloorPlan, Room.floor_plan_id == FloorPlan.id
    ).filter(
        and_(
            Room.id == booking_data.room_id,
            FloorPlan.company_id == current_user.company_id
        )
    ).first()

    if not room_to_book:
        raise ValueError("Room not found or you do not have permission to book it.")

    # 2. Check for conflicts
    conflict = db.query(Booking).filter(
        and_(
            Booking.room_id == booking_data.room_id,
            Booking.start_time < booking_data.end_time,
            Booking.end_time > booking_data.start_time
        )
    ).first()
    
    if conflict:
        raise ValueError("This room is no longer available for the selected time slot.")

    # 3. Create the booking
    new_booking = Booking(
        room_id=booking_data.room_id,
        user_id=current_user.id,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        participants=booking_data.participants
    )
    db.add(new_booking)
    
    # 4. Update UserPreference weightage
    preference = db.query(UserPreference).filter(
        and_(
            UserPreference.user_id == current_user.id,
            UserPreference.room_id == booking_data.room_id
        )
    ).first()
    
    current_time = datetime.utcnow()
    
    if preference:
        preference.weightage += 0.1
        preference.last_booked_at = current_time
    else:
        preference = UserPreference(
            user_id=current_user.id,
            room_id=booking_data.room_id,
            weightage=1.1, 
            last_booked_at=current_time
        )
        db.add(preference)
        
    db.commit()
    db.refresh(new_booking)
    
    # --- Dispatch Asynchronous Task ---
    try:
        send_booking_confirmation.delay(str(new_booking.id))
        print(f"Dispatched task for booking {new_booking.id}")
    except Exception as e:
        print(f"CRITICAL: Failed to dispatch Celery task: {e}")
    
    # --- Invalidate Admin's "Live View" Cache ---
    delete_cache(f"cache:floor_plan_status:{room_to_book.floor_plan_id}")

    # --- Publish WebSocket Update ---
    try:
        asyncio.run(manager.publish_update(
            floor_plan_id=str(room_to_book.floor_plan_id),
            company_id=str(current_user.company_id),
            event_type="BOOKING_CHANGED"
        ))
        print(f"Published WebSocket update for floor plan {room_to_book.floor_plan_id}")
    except Exception as e:
        print(f"CRITICAL: Failed to publish WebSocket update: {e}")

    return new_booking

# --- NEW: Implemented for Admin ---
def get_all_upcoming_bookings(db: Session, current_user: User) -> List[Booking]:
    """
    Finds all current and future bookings for all users *within the admin's company*.
    """
    all_bookings = db.query(Booking).join(
        Room, Booking.room_id == Room.id
    ).join(
        FloorPlan, Room.floor_plan_id == FloorPlan.id
    ).options(
        joinedload(Booking.room),
        joinedload(Booking.user)
    ).filter(
        and_(
            FloorPlan.company_id == current_user.company_id, # --- TENANCY ENFORCED ---
            Booking.end_time > datetime.utcnow()
        )
    ).order_by(
        Booking.start_time.asc()
    ).all()
    
    return all_bookings

# --- NEW: Implemented for User ---
def get_my_bookings(db: Session, current_user: User) -> List[Booking]:
    """
    Finds all current and future bookings for the *current user*.
    """
    my_bookings = db.query(Booking).options(
        joinedload(Booking.room) # Eagerly load the room details
    ).filter(
        and_(
            Booking.user_id == current_user.id,
            Booking.end_time > datetime.utcnow()
        )
    ).order_by(
        Booking.start_time.asc()
    ).all()
    
    return my_bookings

# --- NEW: User-facing function to get all floor plans ---
def get_all_floor_plans_for_user(db: Session, current_user: User) -> List[FloorPlan]:
    """
    Gets all floor plans for the user's company.
    This re-uses the logic from floorplan_service.
    """
    return floorplan_service.get_all_floor_plans(db, current_user)

# --- NEW: User-facing function to get live plan status ---
def get_floor_plan_status_for_user(db: Session, floor_plan_id: uuid.UUID, current_user: User) -> Dict[str, Any]:
    """
    Gets the live status of a floor plan for a user.
    This re-uses the logic from floorplan_service.
    """
    return floorplan_service.get_floor_plan_with_status(db, floor_plan_id, current_user)