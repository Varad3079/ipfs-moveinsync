# FILE: ./backend/models/company.py
import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.base import Base

class Company(Base):
    """
    The 'Tenant' table. Every user and floor plan belongs to a company.
    """
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    
    # --- Relationships ---
    # A company can have many users and many floor plans
    users = relationship("User", back_populates="company")
    floor_plans = relationship("FloorPlan", back_populates="company")

    def __repr__(self):
        return f"<Company(name='{self.name}')>"