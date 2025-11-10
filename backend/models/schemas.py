from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid

# --- 1. User/Auth Schemas ---

class Token(BaseModel):
    """Schema for the returned JWT token."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for the JWT payload data."""
    user_id: Optional[uuid.UUID] = None
    role: Optional[str] = None
    company_id: Optional[uuid.UUID] = None # --- NEW: Added company_id ---

class UserBase(BaseModel):
    """Base schema for user creation."""
    email: EmailStr

class UserCreate(UserBase):
    """Schema for user registration (includes password)."""
    password: str
    role: str # Must be 'admin' or 'standard'

class UserResponse(UserBase):
    """Schema for returning safe user data (excludes password)."""
    id: uuid.UUID
    role: str
    company_id: uuid.UUID # --- NEW: Added company_id ---
    created_at: datetime

    class Config:
        from_attributes = True

# --- NEW: Schema for creating a new company and its first admin ---
class CompanyRegister(BaseModel):
    company_name: str
    email: EmailStr
    password: str

# --- 2. Admin/Floor Plan Schemas ---

class RoomBase(BaseModel):
    """Base schema for room data."""
    name: str
    capacity: str
    features: Optional[List[str]] = None
    # --- NEW: Added geometry ---
    x_coord: float
    y_coord: float
    width: float
    height: float

class RoomCreate(RoomBase):
    """Schema for creating a new room."""
    pass

class RoomUpdate(BaseModel):
    """Schema for updating an existing room. All fields are optional."""
    room_id: uuid.UUID
    name: Optional[str] = None
    capacity: Optional[str] = None
    features: Optional[List[str]] = None
    x_coord: Optional[float] = None
    y_coord: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    

class RoomResponse(RoomBase):
    """Schema for returning room data with its ID."""
    id: uuid.UUID
    floor_plan_id: uuid.UUID
    
    class Config:
        from_attributes = True

class FloorPlanBase(BaseModel):
    """Base schema for floor plan data."""
    name: str
    map_data: Optional[Dict[str, Any]] = None
    # --- NEW: Added geometry ---
    width: float
    height: float

class FloorPlanCreate(FloorPlanBase):
    """Schema for initial floor plan upload."""
    rooms: List[RoomCreate]

class FloorPlanResponse(FloorPlanBase):
    """Schema for retrieving floor plan data with relational rooms."""
    id: uuid.UUID
    company_id: uuid.UUID # --- NEW: Added company_id ---
    last_modified_at: datetime
    rooms: List[RoomResponse] 

    # --- THIS IS THE FIX ---
    # This was missing, causing the 500 Error on all
    # endpoints that returned a FloorPlanResponse.
    class Config:
        from_attributes = True
    # --- END OF FIX ---


class AdminUpdatePayload(BaseModel):
    """The batch payload for Admin /update or /sync endpoint."""
    floor_plan_id: uuid.UUID
    client_last_modified_at: datetime 
    # Use the new RoomUpdate schema
    room_updates: List[RoomUpdate] 


# --- 3. Booking & Recommendation Schemas ---

class RoomAvailabilityRequest(BaseModel):
    """Schema for checking room availability."""
    start_time: datetime
    end_time: datetime
    min_capacity: int

class RoomRecommendationRequest(BaseModel):
    """Schema for getting smart recommendations."""
    start_time: datetime
    end_time: datetime
    participants: int

class BookingCreate(BaseModel):
    """Schema for creating a new booking."""
    room_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    participants: int

class BookingResponse(BookingCreate):
    """Schema for returning a created booking."""
    id: uuid.UUID
    user_id: uuid.UUID
    # --- NEW: Eager load room and user details ---
    room: RoomResponse
    user: UserResponse
    
    class Config:
        from_attributes = True

class RecommendedRoomResponse(RoomResponse):
    """Extends RoomResponse to include the recommendation score."""
    recommendation_score: float = 0.0
    proximity_score: float = 0.0