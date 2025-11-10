from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Optional

from constants import ROLE_PRIORITIES, ADMIN_ROLE
from models.floorplan import FloorPlan, Room, FloorPlanVersion
from models.user import User
from sqlalchemy.orm import Session, joinedload


@dataclass
class ConflictResolutionResult:
    allow_override: bool
    reason: str
    overridden_role: Optional[str] = None


def _determine_previous_role(db: Session, floor_plan: FloorPlan) -> Optional[str]:
    """
    Look at the most recent committed version to infer who last modified the floor plan.
    """
    if not floor_plan.current_version_id:
        return None

    version = (
        db.query(FloorPlanVersion)
        .options(joinedload(FloorPlanVersion.committer))
        .filter(FloorPlanVersion.id == floor_plan.current_version_id)
        .first()
    )
    if version and version.committer:
        return getattr(version.committer, "role", None)
    return None


def should_override(
    db: Session,
    floor_plan: FloorPlan,
    current_user: User,
    conflicting_timestamp_utc,
) -> ConflictResolutionResult:
    """
    Decide whether the incoming update should override an existing, more recent change.
    Priority is decided by role weight; administrators automatically win conflicts.
    """
    previous_role = _determine_previous_role(db, floor_plan)
    incoming_priority = ROLE_PRIORITIES.get(current_user.role, 0)
    previous_priority = ROLE_PRIORITIES.get(previous_role, 0)

    if incoming_priority >= previous_priority:
        reason = (
            "Incoming change applied because the author has equal or higher priority."
        )
        return ConflictResolutionResult(
            allow_override=True,
            reason=reason,
            overridden_role=previous_role,
        )

    reason = (
        "Conflict detected with a higher-priority update. "
        f"Last update role: {previous_role or 'unknown'}, "
        f"incoming role: {current_user.role}."
    )
    return ConflictResolutionResult(
        allow_override=False,
        reason=reason,
        overridden_role=previous_role,
    )


def apply_room_updates(room: Room, update_data: Dict) -> None:
    """
    Mutate the room instance with the provided update data,
    skipping the primary key.
    """
    for key, value in update_data.items():
        if key == "room_id":
            continue
        setattr(room, key, value)

