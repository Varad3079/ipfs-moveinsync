# FILE: ./backend/db/database.py
# File: /home/shashank/Desktop/workspace/moveinsync-prod/backend/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from constants import DATABASE_URL

# The Engine is the starting point for SQLAlchemy applications. 
# It serves as a central source of connections to a particular database.
# `echo=True` is great for debugging to see all SQL queries being generated.
engine = create_engine(DATABASE_URL, echo=False)

# SessionLocal is a configured Session class. Each instance of SessionLocal 
# will be a database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the declarative base class for all of our models. 
# It provides methods for describing database tables and their relationships.
Base = declarative_base()

# Dependency function to get a database session (used in FastAPI endpoints)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()