# FILE: ./backend/routes/meeting_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from models.schemas import (
    BookingCreate, BookingResponse, RoomAvailabilityRequest, 
    RoomRecommendationRequest, RoomResponse, RecommendedRoomResponse,
    FloorPlanResponse # --- NEW: Import FloorPlanResponse ---
)
from utils.security import get_current_user # Note: Not admin!
from controllers import booking_service
from typing import List
import uuid # --- NEW: Import uuid ---

router = APIRouter()

# --- NEW: User endpoint to get all floor plans ---
@router.get("/floorplans", response_model=List[FloorPlanResponse])
def get_all_floor_plans_for_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Gets a list of all floor plans for the user's company.
    """
    return booking_service.get_all_floor_plans_for_user(db, current_user)

# --- NEW: User endpoint for live status ---
@router.get("/floorplans/{floor_plan_id}/status", response_model=dict)
def get_floor_plan_live_status_for_user(
    floor_plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a floor plan and all its rooms, annotated with
    the current booking status ("Available" or "Booked").
    """
    try:
        status_data = booking_service.get_floor_plan_status_for_user(db, floor_plan_id, current_user)
        return status_data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# --- UPDATED: Pass current_user ---
@router.post("/rooms/available", response_model=List[RoomResponse])
def get_available_rooms(
    request: RoomAvailabilityRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Finds all rooms *in the user's company* that are available.
    """
    rooms = booking_service.get_available_rooms(db, request, current_user)
    return rooms

# --- UPDATED: Pass current_user ---
@router.post("/rooms/recommend", response_model=List[RecommendedRoomResponse])
def get_recommended_rooms(
    request: RoomRecommendationRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Gets a smart list of available, tenant-owned rooms, ranked by preference.
    """
    rooms = booking_service.get_recommended_rooms(db, request, current_user)
    if not rooms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No available rooms found matching your criteria."
        )
    return rooms

# --- UPDATED: Pass current_user ---
@router.post("/book", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_meeting_room(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Books a room for the user. Tenancy is enforced.
    """
    try:
        new_booking = booking_service.create_new_booking(db, booking_data, current_user)
        return new_booking
    except ValueError as e:
        # Catch conflicts or tenancy violations
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while booking: {e}"
        )

# --- NEW: "My Bookings" Endpoint ---
@router.get("/my-bookings", response_model=List[BookingResponse])
def get_my_upcoming_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Gets a list of the current user's upcoming bookings.
    """
    return booking_service.get_my_bookings(db, current_user)