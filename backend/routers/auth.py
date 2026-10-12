# ============================================================
# FILE: routers/auth.py
# PURPOSE:
# Admin login API.
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from backend.auth import (
        verify_password,
        get_password_hash,
        create_access_token
    )
except ImportError:
    from auth import (
        verify_password,
        get_password_hash,
        create_access_token
    )


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# LOGIN REQUEST SCHEMA
# ============================================================

class LoginRequest(BaseModel):
    email: str
    password: str


# ============================================================
# DEVELOPMENT ADMIN ACCOUNT
# ============================================================

ADMIN_EMAIL = "admin@company.com"
ADMIN_PASSWORD = "admin123"
ADMIN_PASSWORD_HASH = get_password_hash(ADMIN_PASSWORD)


# ============================================================
# LOGIN API
# ============================================================

@router.post("/login")
def login(credentials: LoginRequest):
    if credentials.email.strip().lower() != ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(credentials.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {
            "sub": credentials.email,
            "role": "admin"
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": credentials.email,
            "role": "admin",
            "name": "Support Administrator"
        }
    }