"""
Soul Snap - Main FastAPI Application
A personal emotional diary and AI companion
"""
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from routes.auth import router as auth_router
from routes.journal import router as journal_router
from routes.chat import router as chat_router
from routes.memories import router as memories_router
from routes.dashboard import router as dashboard_router
from routes.media import router as media_router
from services.cloudinary_service import init_cloudinary
from services.auth_service import hash_password, verify_password

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create FastAPI app
app = FastAPI(
    title="Soul Snap API",
    description="A personal emotional diary and AI companion",
    version="1.0.0"
)

# Store db in app state
app.state.db = db

# CORS configuration
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api/auth")
app.include_router(journal_router, prefix="/api/v1/journal")
app.include_router(chat_router, prefix="/api/v1/chat")
app.include_router(memories_router, prefix="/api/v1/memories")
app.include_router(dashboard_router, prefix="/api/v1/dashboard")
app.include_router(media_router, prefix="/api/v1/media")

@app.get("/api")
async def root():
    return {"message": "Welcome to Soul Snap API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.on_event("startup")
async def startup():
    client = AsyncIOMotorClient(mongo_url)
    app.state.db = client[os.environ.get("DB_NAME")]

    # Initialize Cloudinary
    init_cloudinary()
    
    # Create MongoDB indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.journal_entries.create_index([("user_id", 1), ("created_at", -1)])
    await db.memories.create_index([("user_id", 1), ("created_at", -1)])
    await db.memories.create_index([("user_id", 1), ("emotion", 1)])
    await db.chat_messages.create_index([("user_id", 1), ("created_at", -1)])
    
    # Seed admin user
    await seed_admin()
    
    logger.info("Soul Snap API started successfully")

async def seed_admin():
    """Seed admin user from environment variables"""
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@soulsnap.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")
    
    # Write credentials to test file
    memory_dir = Path(__file__).parent / "memory"
    memory_dir.mkdir(exist_ok=True)
    
    with open(memory_dir / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write("- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/register\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/me\n")
        f.write("- POST /api/auth/refresh\n")
        f.write("- POST /api/auth/google\n")
        f.write("- POST /api/auth/forgot-password\n")
        f.write("- POST /api/auth/reset-password\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Soul Snap API shut down")
