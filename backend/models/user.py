# FILE: ./backend/models/user.py
import uuid
from sqlalchemy import Column, String, TIMESTAMP, Enum, ForeignKey # Add ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship # Add relationship
from models.base import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    standard = "standard"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name='user_role_enum'), default=UserRole.standard, nullable=False) 
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)

    # --- NEW: Link to Company ---
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False)

    # --- Relationships ---
    company = relationship("Company", back_populates="users")
    # Add back-populates for bookings and preferences
    bookings = relationship("Booking", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user")

    def __repr__(self):
        return f"<User(email='{self.email}', role='{self.role}')>"