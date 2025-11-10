# FILE: ./backend/models/base.py
# File: /home/shashank/Desktop/workspace/moveinsync-prod/backend/models/base.py
from db.database import Base

# This file is used to provide a single, consistent import point for the Base object.
# All other ORM models (floorplan.py, user.py, etc.) will import Base from here.
# This prevents circular dependencies and keeps the structure clean.

# We will export the Base object so all models can inherit from it.
# Example: class User(Base): ...

__all__ = ["Base"]