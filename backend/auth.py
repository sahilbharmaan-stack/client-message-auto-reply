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
    import jwt
except ImportError as error:
    raise RuntimeError("PyJWT is required for secure admin authentication.") from error


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY and not (os.environ.get("RENDER") or os.environ.get("VERCEL")):
    SECRET_KEY = "local-development-secret-key"
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
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY must be configured for the deployed API.")

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================
# VERIFY JWT TOKEN
# ============================================================

def verify_token(token: str):
    if not token or not SECRET_KEY:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None