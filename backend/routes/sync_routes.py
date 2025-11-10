# FILE: ./backend/routes/sync_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from models.schemas import FloorPlanResponse, AdminUpdatePayload
from utils.security import get_current_admin_user
from controllers import floorplan_service

router = APIRouter()

@router.post("/commit-changes", response_model=FloorPlanResponse)
def commit_offline_changes(
    payload: AdminUpdatePayload, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin_user) # --- Pass current_admin ---
):
    """
    Handles synchronization of changes made by an admin while offline.
    Tenancy is now enforced by the underlying controller.
    """
    try:
        updated_fp = floorplan_service.update_floor_plan_and_resolve_conflict(
            db, payload, current_admin # --- Pass current_admin ---
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to sync: {e}")