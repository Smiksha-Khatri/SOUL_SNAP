"""
Media Routes - Cloudinary upload signatures
"""
from fastapi import APIRouter, HTTPException, Request, Query
import logging

from services.auth_service import get_current_user
from services.cloudinary_service import generate_upload_signature, delete_media

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Media"])

def get_db(request: Request):
    return request.app.state.db

@router.get("/signature")
async def get_upload_signature(
    request: Request,
    resource_type: str = Query("image", enum=["image", "video", "raw"]),
    folder: str = "uploads"
):
    """Get signed upload parameters for Cloudinary direct upload"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    # Prefix folder with user ID for organization
    user_folder = f"users/{user['_id']}/{folder}"
    
    return generate_upload_signature(user_folder, resource_type)

@router.delete("/{public_id:path}")
async def delete_uploaded_media(
    public_id: str,
    request: Request,
    resource_type: str = Query("image", enum=["image", "video", "raw"])
):
    """Delete media from Cloudinary"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    # Verify the public_id belongs to this user
    if f"users/{user['_id']}" not in public_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this media")
    
    success = delete_media(public_id, resource_type)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete media")
    
    return {"message": "Media deleted successfully"}
