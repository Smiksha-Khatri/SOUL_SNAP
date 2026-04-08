"""
Auth Service - JWT authentication and password hashing
"""
import os
import jwt
import bcrypt
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
from fastapi import Request, HTTPException
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(request: Request, db) -> dict:
    """Extract and validate user from request"""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def check_brute_force(db, identifier: str) -> bool:
    """Check if login attempt is blocked due to brute force protection"""
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("attempts", 0) >= 5:
        lockout_time = attempt.get("lockout_until")
        if lockout_time and datetime.now(timezone.utc) < lockout_time:
            return True
        # Reset if lockout expired
        await db.login_attempts.delete_one({"identifier": identifier})
    return False

async def record_failed_attempt(db, identifier: str):
    """Record a failed login attempt"""
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {
            "$inc": {"attempts": 1},
            "$set": {"lockout_until": datetime.now(timezone.utc) + timedelta(minutes=15)}
        },
        upsert=True
    )

async def clear_failed_attempts(db, identifier: str):
    """Clear failed login attempts on successful login"""
    await db.login_attempts.delete_one({"identifier": identifier})
