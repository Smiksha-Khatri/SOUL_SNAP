"""
Cloudinary Service - Media upload and management
"""
import os
import time
import cloudinary
import cloudinary.utils
import cloudinary.uploader
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def init_cloudinary():
    """Initialize Cloudinary configuration"""
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
        secure=True
    )
    logger.info("Cloudinary initialized")

def generate_upload_signature(folder: str = "uploads", resource_type: str = "image") -> dict:
    """Generate signed upload parameters for frontend direct upload"""
    ALLOWED_FOLDERS = ("users/", "journals/", "uploads/", "audio/", "documents/")
    
    # Validate folder
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        folder = "uploads"
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder,
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder,
        "resource_type": resource_type
    }

def delete_media(public_id: str, resource_type: str = "image") -> bool:
    """Delete media from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
        return result.get("result") == "ok"
    except Exception as e:
        logger.error(f"Failed to delete media {public_id}: {e}")
        return False

def get_transformation_url(public_id: str, transformations: dict = None) -> str:
    """Generate transformed media URL"""
    if transformations is None:
        transformations = {"quality": "auto", "fetch_format": "auto"}
    
    return cloudinary.CloudinaryImage(public_id).build_url(**transformations)
