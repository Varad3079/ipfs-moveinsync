from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt, JWTError
from constants import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, ADMIN_ROLE, STANDARD_ROLE
from models.schemas import TokenData
# --- FIX: Import WebSocketDisconnect and SessionLocal ---
from fastapi import Depends, HTTPException, status, WebSocket, Query, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from db.database import get_db, SessionLocal # --- Import SessionLocal ---
from models.user import User
import uuid

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- JWT Token Generation & Validation ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token") 

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # ... (this function is unchanged) ...
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[TokenData]:
    # ... (this function is unchanged) ...
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        role: str = payload.get("role")
        company_id: str = payload.get("company_id")
        
        if user_id is None or role is None or company_id is None:
            raise credentials_exception
        
        return TokenData(
            user_id=uuid.UUID(user_id), 
            role=role, 
            company_id=uuid.UUID(company_id)
        )
    except JWTError:
        raise credentials_exception

# --- FastAPI Dependency Functions ---

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dependency for HTTP requests.
    """
    token_data = decode_access_token(token)
    user = db.query(User).options(
        joinedload(User.company) 
    ).filter(
        User.id == token_data.user_id
    ).first()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.company_id != token_data.company_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User does not belong to this company.")
        
    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the user is an Admin (for HTTP requests)."""
    if current_user.role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires administrator privileges",
        )
    return current_user

# --- UPDATED: WebSocket Authentication Dependency ---
async def get_websocket_user(
    token: str = Query(...), # Get token from query param: ?token=...
) -> User:
    """
    A dependency to authenticate users for WebSocket connections.
    Manages its own database session to prevent leaks.
    """
    try:
        token_data = decode_access_token(token)
    except HTTPException as e:
        # This catches token decode errors (expired, invalid)
        raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason=e.detail)

    db = SessionLocal() # Create a new, independent session
    try:
        user = db.query(User).options(
            joinedload(User.company) 
        ).filter(
            User.id == token_data.user_id
        ).first()
        
        if user is None:
            raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
        if user.company_id != token_data.company_id:
            raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="User does not belong to this company.")
            
        return user
    except Exception as e:
        # Catch any other unexpected errors
        reason = "Authentication failed"
        if hasattr(e, 'detail'):
            reason = e.detail
        raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason=reason)
    finally:
        db.close() # --- CRITICAL: Always close the session ---

# --- NEW: WebSocket Admin Authentication Dependency ---
async def get_websocket_admin_user(
    current_user: User = Depends(get_websocket_user)
) -> User:
    """Dependency that ensures the WebSocket user is an Admin."""
    if current_user.role != ADMIN_ROLE:
        raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="Administrator privileges required")
    return current_user