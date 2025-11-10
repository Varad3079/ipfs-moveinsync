# FILE: ./backend/routes/auth_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from models.company import Company # --- NEW: Import Company ---
from models.schemas import UserCreate, UserResponse, Token, CompanyRegister # --- NEW: Import CompanyRegister ---
from utils.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta
from constants import ACCESS_TOKEN_EXPIRE_MINUTES, ADMIN_ROLE, STANDARD_ROLE

router = APIRouter()

# --- OLD /register ENDPOINT IS REMOVED ---

# --- NEW: Company Registration Endpoint ---
@router.post("/register-company", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_company(company_data: CompanyRegister, db: Session = Depends(get_db)):
    """
    Handles registration of a new company and its first Admin user.
    """
    # 1. Check if company or user email already exists
    db_company = db.query(Company).filter(Company.name == company_data.company_name).first()
    if db_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name already registered."
        )
    
    db_user = db.query(User).filter(User.email == company_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # 2. Create the new Company
    new_company = Company(name=company_data.company_name)
    db.add(new_company)
    db.flush() # Flush to get the new_company.id

    # 3. Create the new User (as Admin for this company)
    hashed_password = get_password_hash(company_data.password)
    new_user = User(
        email=company_data.email,
        hashed_password=hashed_password,
        role=ADMIN_ROLE, # First user is always an Admin
        company_id=new_company.id # Link to the new company
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Handles user login and returns a JWT access token
    containing user_id, role, and company_id.
    """
    # 1. Find user by email (username)
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Create access token with new, richer payload
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": str(user.id), 
            "role": user.role.value, # Use .value for the enum
            "company_id": str(user.company_id) # --- NEW: Add company_id ---
        },
        expires_delta=access_token_expires,
    )
    
    return {"access_token": access_token, "token_type": "bearer"}