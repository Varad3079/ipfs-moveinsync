from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
# --- UPDATED: Import UserCreate and UserResponse ---
from models.schemas import (
    FloorPlanCreate, FloorPlanResponse, AdminUpdatePayload, 
    BookingResponse, UserCreate, UserResponse 
)
from utils.security import get_current_admin_user, get_password_hash # --- UPDATED: Import get_password_hash ---
from controllers import floorplan_service, booking_service 
from typing import List, Dict 
import uuid
from models.floorplan import FloorPlanVersion


router = APIRouter()

# --- Floor Plan Endpoints (Unchanged) ---

@router.post("/floorplans/upload", response_model=FloorPlanResponse, status_code=status.HTTP_201_CREATED)
def upload_floor_plan(
    fp_data: FloorPlanCreate, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Endpoint for administrators to upload a new floor plan (e.g., "Floor 1").
    Admins can upload multiple floor plans.
    """
    try:
        new_fp = floorplan_service.create_floor_plan(db, fp_data, current_admin)
        return new_fp
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create floor plan: {str(e)}"
        )

@router.get("/floorplans", response_model=List[FloorPlanResponse])
def get_all_floor_plans_for_company(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Retrieves a list of all floor plans for the admin's company.
    """
    return floorplan_service.get_all_floor_plans(db, current_admin)

@router.get("/floorplans/{floor_plan_id}", response_model=FloorPlanResponse)
def get_floor_plan_by_id(
    floor_plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Retrieves a specific floor plan, if it belongs to the admin's company.
    """
    fp = floorplan_service.get_floor_plan_by_id(db, floor_plan_id, current_admin)
    if not fp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floor plan not found or you do not have permission.")
    return fp

@router.get("/floorplans/{floor_plan_id}/status", response_model=dict)
def get_floor_plan_live_status(
    floor_plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Retrieves a floor plan and all its rooms, annotated with
    the current booking status ("Available" or "Booked").
    """
    try:
        status_data = floorplan_service.get_floor_plan_with_status(db, floor_plan_id, current_admin)
        return status_data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/floorplans/update", response_model=FloorPlanResponse)
def update_floor_plan(
    payload: AdminUpdatePayload, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Applies a batch of room updates, performs conflict resolution, 
    and commits a new version. Tenancy is enforced.
    """
    try:
        updated_fp = floorplan_service.update_floor_plan_and_resolve_conflict(
            db, payload, current_admin
        )
        return updated_fp
    except ValueError as e:
        error_detail = str(e)
        if "Conflict detected" in error_detail:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error_detail)
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_detail)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update: {e}")

@router.get("/floorplans/{floor_plan_id}/versions", response_model=List[dict])
def list_floor_plan_versions(
    floor_plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Retrieves the historical list of versions for a tenant-owned floor plan.
    """
    fp = floorplan_service.get_floor_plan_by_id(db, floor_plan_id, current_admin)
    if not fp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floor plan not found or you do not have permission.")

    versions = db.query(FloorPlanVersion)\
                 .filter(FloorPlanVersion.floor_plan_id == floor_plan_id)\
                 .order_by(FloorPlanVersion.timestamp.desc())\
                 .all()
                 
    return [
        {
            "version_id": version.id,
            "timestamp": version.timestamp,
            "committer_id": version.committer_id,
        } for version in versions
    ]


@router.post("/floorplans/{floor_plan_id}/restore", response_model=FloorPlanResponse)
def restore_floor_plan(
    floor_plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Restore the latest backup snapshot for a floor plan.
    """
    try:
        restored_plan = floorplan_service.restore_floor_plan_from_backup(
            db, floor_plan_id, current_admin
        )
        return restored_plan
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:  # pragma: no cover - defensive guard
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore floor plan: {exc}",
        )

@router.get("/bookings", response_model=List[BookingResponse])
def get_all_bookings_admin(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin-only endpoint to get all upcoming bookings for their company.
    """
    return booking_service.get_all_upcoming_bookings(db, current_admin)

# --- User Management Endpoints ---

# --- NEW: Get all users for the admin's company ---
@router.get("/users", response_model=List[UserResponse])
def get_company_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin-only endpoint to get a list of all users
    in their own company.
    """
    users = db.query(User).filter(
        User.company_id == current_admin.company_id
    ).order_by(User.email.asc()).all()
    
    return users

@router.post("/invite-user", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def invite_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin-only endpoint to create a new user (admin or standard)
    for the admin's own company.
    """
    # 1. Check if user email already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # 2. Create the new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role, # 'admin' or 'standard' from the payload
        company_id=current_admin.company_id # --- TENANCY ENFORCED ---
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user