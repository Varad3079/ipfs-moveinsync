# FILE: ./backend/tasks.py
from celery_config import celery_app # --- FIX: Import from celery_config ---
from db.database import SessionLocal
from models.booking import Booking
from models.user import User
from sqlalchemy.orm import joinedload
import uuid
import time

@celery_app.task(name="tasks.send_booking_confirmation")
def send_booking_confirmation(booking_id: str):
    """
    A mock task that simulates sending a confirmation email.
    """
    db = SessionLocal()
    try:
        # Get the booking details from the DB
        booking = db.query(Booking).options(
            joinedload(Booking.user),
            joinedload(Booking.room)
        ).filter(Booking.id == uuid.UUID(booking_id)).first()
        
        if not booking:
            print(f"[TASK FAILED] Booking ID {booking_id} not found.")
            return
        
        user_email = booking.user.email
        room_name = booking.room.name
        
        print(f"[TASK STARTED] Simulating sending email to {user_email} for {room_name}...")
        
        # Simulate a slow network call (e.g., to an email API)
        time.sleep(5) 
        
        print(f"[TASK COMPLETE] Email sent for Booking {booking_id}.")
        return f"Email sent to {user_email}"
        
    except Exception as e:
        print(f"[TASK ERROR] Error processing booking {booking_id}: {e}")
    finally:
        db.close()