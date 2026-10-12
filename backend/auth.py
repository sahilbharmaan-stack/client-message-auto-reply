# ============================================================
# FILE: auth.py
# PURPOSE:
# Authentication utilities for Admin Login.
# ============================================================

import os
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
try:
    # pyrefly: ignore [missing-import]
    import jwt
except ImportError:
    jwt = None


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.environ.get("SECRET_KEY", "auto-reply-secret-key-super-secure-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# ============================================================
# PASSWORD HASHING (PBKDF2-HMAC-SHA256 - Secure, built-in)
# ============================================================

def get_password_hash(password: str) -> str:
    """
    Convert plain password into a secure PBKDF2 hash with salt.
    Format: salt:hex_hash
    """
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100000
    ).hex()
    return f"{salt}:{hashed}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check whether the entered password matches the stored hashed password.
    Supports both salt:hash and legacy plain comparison fallback for demo setups.
    """
    if not hashed_password or not plain_password:
        return False

    if ":" in hashed_password:
        try:
            salt, stored_hash = hashed_password.split(":", 1)
            calc_hash = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations=100000
            ).hex()
            return hmac.compare_digest(stored_hash, calc_hash)
        except Exception:
            return False

    # Fallback to plain or constant-time comparison
    return hmac.compare_digest(plain_password, hashed_password)


# ============================================================
# CREATE JWT TOKEN
# ============================================================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})

    if jwt:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Safe fallback if jwt module is somehow unavailable
    token_payload = f"{to_encode.get('sub', 'admin')}:{secrets.token_urlsafe(32)}"
    return token_payload


# ============================================================
# VERIFY JWT TOKEN
# ============================================================

def verify_token(token: str):
    if not token:
        return None

    if jwt:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except Exception:
            return None

    # Fallback
    if ":" in token:
        sub = token.split(":")[0]
        return {"sub": sub, "role": "admin"}
    return None