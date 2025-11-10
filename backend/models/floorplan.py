# FILE: ./backend/models/floorplan.py
import uuid
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Float # Add Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import datetime

class FloorPlanVersion(Base):
    """Audit/Version Control Table."""
    __tablename__ = "fp_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # We now link this to the FloorPlan, which links to the Company
    floor_plan_id = Column(UUID(as_uuid=True), ForeignKey('floor_plans.id'), nullable=False)
    data_snapshot = Column(JSONB, nullable=False) # This will now store the new geometry
    timestamp = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    committer_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True) 

    # We can add a simple relationship to the committer
    committer = relationship("User") 

    def __repr__(self):
        return f"<FloorPlanVersion(id='{self.id}', fp_id='{self.floor_plan_id}', timestamp='{self.timestamp}')>"


class FloorPlan(Base):
    """Table for the current active floor plan metadata."""
    __tablename__ = "floor_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)

    # --- NEW: Link to Company ---
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False)

    # --- NEW: Floor Geometry (Feature #2) ---
    width = Column(Float, default=1000.0) # Default width (e.g., pixels)
    height = Column(Float, default=800.0) # Default height
    
    map_data = Column(JSONB) # Store SVG paths, etc.
    last_modified_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    current_version_id = Column(UUID(as_uuid=True), ForeignKey('fp_versions.id', ondelete='SET NULL'), nullable=True)
    
    # --- Relationships ---
    company = relationship("Company", back_populates="floor_plans")
    rooms = relationship("Room", back_populates="floor_plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FloorPlan(name='{self.name}', modified_at='{self.last_modified_at}')>"


class Room(Base):
    """Details about physical rooms/resources within a floor plan."""
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    floor_plan_id = Column(UUID(as_uuid=True), ForeignKey('floor_plans.id'), nullable=False)
    name = Column(String(100), nullable=False)
    capacity = Column(String(100), nullable=False)
    features = Column(JSONB) # e.g., ["Projector", "Whiteboard"]
    
    # --- UPDATED: Room Geometry (Feature #2) ---
    x_coord = Column(Float, nullable=False) # Top-left position X
    y_coord = Column(Float, nullable=False) # Top-left position Y
    width = Column(Float, nullable=False, default=100.0)   # Width of the room rectangle
    height = Column(Float, nullable=False, default=50.0)  # Height of the room rectangle

    # --- Relationships ---
    floor_plan = relationship("FloorPlan", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="room", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Room(name='{self.name}', capacity='{self.capacity}')>"