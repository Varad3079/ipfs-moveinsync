# FILE: ./backend/utils/encoders.py
import json
import uuid
from datetime import datetime

class CustomJSONEncoder(json.JSONEncoder):
    """
    A custom JSON encoder to handle complex types that
    the default json.dumps cannot serialize.
    """
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            # Convert UUID to string
            return str(obj)
        if isinstance(obj, datetime):
            # Convert datetime to ISO 8601 string
            return obj.isoformat()
        
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)