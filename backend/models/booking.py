# FILE: ./backend/models/booking.py
import uuid
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Integer, Float, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import datetime

class Booking(Base):
    """Reservations for a specific room."""
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey('rooms.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    start_time = Column(TIMESTAMP, nullable=False)
    end_time = Column(TIMESTAMP, nullable=False)
    participants = Column(Integer, nullable=False)

    # Relationships (pointing back to new models)
    room = relationship("Room", back_populates="bookings")
    user = relationship("User", back_populates="bookings")

    def __repr__(self):
        return f"<Booking(room_id='{self.room_id}', user_id='{self.user_id}', start='{self.start_time}')>"


class UserPreference(Base):
    """Simple engine for weighted recommendations based on past bookings."""
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey('rooms.id'), nullable=False)
    weightage = Column(Float, default=1.0, nullable=False) 
    last_booked_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (UniqueConstraint('user_id', 'room_id', name='uq_user_room_preference'),)

    # Relationships (pointing back to new models)
    room = relationship("Room", back_populates="preferences")
    user = relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<UserPreference(user_id='{self.user_id}', room_id='{self.room_id}', weight='{self.weightage}')>"