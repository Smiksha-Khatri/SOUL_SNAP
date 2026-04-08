"""
Auth Routes - Registration, Login, OAuth, Password Reset
"""
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from datetime import datetime, timezone
from bson import ObjectId
import os
import logging
import httpx

from models.schemas import (
    UserCreate, UserLogin, UserResponse, 
    GoogleAuthRequest, PasswordResetRequest, PasswordResetConfirm
)
from services.auth_service import (
    hash_password, verify_password, 
    create_access_token, create_refresh_token,
    get_current_user, generate_reset_token,
    check_brute_force, record_failed_attempt, clear_failed_attempts
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/register")
async def register(user_data: UserCreate, response: Response, request: Request):
    db = get_db(request)
    email = user_data.email.lower()
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc),
        "role": "user"
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create tokens
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "_id": user_id,
        "email": email,
        "name": user_data.name,
        "avatar_url": None,
        "created_at": user_doc["created_at"].isoformat()
    }

@router.post("/login")
async def login(credentials: UserLogin, response: Response, request: Request):
    db = get_db(request)
    email = credentials.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    if await check_brute_force(db, identifier):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user:
        await record_failed_attempt(db, identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        await record_failed_attempt(db, identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts
    await clear_failed_attempts(db, identifier)
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "_id": user_id,
        "email": user["email"],
        "name": user["name"],
        "avatar_url": user.get("avatar_url"),
        "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    return {
        "_id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "avatar_url": user.get("avatar_url"),
        "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
    }

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    import jwt
    from services.auth_service import get_jwt_secret, JWT_ALGORITHM
    
    db = get_db(request)
    token = request.cookies.get("refresh_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=new_access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/google")
async def google_auth(auth_data: GoogleAuthRequest, response: Response, request: Request):
    """Handle Google OAuth callback"""
    db = get_db(request)
    
    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": auth_data.code,
        "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
        "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": auth_data.redirect_uri,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
        
        tokens = token_response.json()
        
        # Get user info
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        google_user = userinfo_response.json()
    
    email = google_user["email"].lower()
    
    # Find or create user
    user = await db.users.find_one({"email": email})
    
    if not user:
        user_doc = {
            "email": email,
            "password_hash": None,  # OAuth users don't have passwords
            "name": google_user.get("name", email.split("@")[0]),
            "avatar_url": google_user.get("picture"),
            "google_id": google_user["id"],
            "created_at": datetime.now(timezone.utc),
            "role": "user"
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        user = user_doc
        user["_id"] = user_id
    else:
        user_id = str(user["_id"])
        # Update Google info if needed
        if not user.get("google_id"):
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"google_id": google_user["id"], "avatar_url": google_user.get("picture")}}
            )
    
    # Create tokens
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "_id": user_id,
        "email": email,
        "name": user.get("name"),
        "avatar_url": user.get("avatar_url"),
        "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
    }

@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, request: Request):
    db = get_db(request)
    email = data.email.lower()
    
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal if user exists
        return {"message": "If the email exists, a reset link has been sent"}
    
    token = generate_reset_token()
    await db.password_reset_tokens.insert_one({
        "user_id": user["_id"],
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timezone.timedelta(hours=1),
        "used": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Log reset link (in production, send email)
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    logger.info(f"Password reset link for {email}: {reset_link}")
    
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, request: Request):
    db = get_db(request)
    
    token_doc = await db.password_reset_tokens.find_one({
        "token": data.token,
        "used": False
    })
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if datetime.now(timezone.utc) > token_doc["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": token_doc["user_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}
