"""
Journal Routes - Daily journal entries with sentiment analysis
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
import logging

from models.schemas import JournalEntryCreate, JournalEntryResponse
from services.auth_service import get_current_user
from services.ai_service import analyze_sentiment

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Journal"])

def get_db(request: Request):
    return request.app.state.db

@router.post("", response_model=JournalEntryResponse)
async def create_journal_entry(entry: JournalEntryCreate, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    # Analyze sentiment
    sentiment = await analyze_sentiment(entry.content)
    
    entry_doc = {
        "user_id": user["_id"],
        "title": entry.title or f"Entry - {datetime.now(timezone.utc).strftime('%B %d, %Y')}",
        "content": entry.content,
        "media_urls": entry.media_urls or [],
        "tags": entry.tags or [],
        "event_tag": entry.event_tag,
        "sentiment": sentiment,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.journal_entries.insert_one(entry_doc)
    
    # Also create a memory from this entry
    memory_doc = {
        "user_id": user["_id"],
        "content": entry.content[:500],  # Store first 500 chars
        "source": "journal",
        "source_id": str(result.inserted_id),
        "emotion": sentiment.get("primary_emotion", "neutral"),
        "intensity": sentiment.get("intensity", 0.5),
        "event_tag": entry.event_tag,
        "created_at": datetime.now(timezone.utc)
    }
    await db.memories.insert_one(memory_doc)
    
    return {
        "id": str(result.inserted_id),
        "user_id": user["_id"],
        "title": entry_doc["title"],
        "content": entry_doc["content"],
        "media_urls": entry_doc["media_urls"],
        "tags": entry_doc["tags"],
        "event_tag": entry_doc["event_tag"],
        "sentiment": entry_doc["sentiment"],
        "created_at": entry_doc["created_at"],
        "updated_at": entry_doc["updated_at"]
    }

@router.get("", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    request: Request,
    limit: int = 20,
    skip: int = 0,
    emotion: Optional[str] = None
):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    query = {"user_id": user["_id"]}
    if emotion:
        query["sentiment.primary_emotion"] = emotion
    
    entries = await db.journal_entries.find(
        query,
        {"_id": 1, "user_id": 1, "title": 1, "content": 1, "media_urls": 1, 
         "tags": 1, "event_tag": 1, "sentiment": 1, "created_at": 1, "updated_at": 1}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [
        {
            "id": str(e["_id"]),
            "user_id": e["user_id"],
            "title": e.get("title"),
            "content": e["content"],
            "media_urls": e.get("media_urls", []),
            "tags": e.get("tags", []),
            "event_tag": e.get("event_tag"),
            "sentiment": e.get("sentiment", {}),
            "created_at": e["created_at"],
            "updated_at": e["updated_at"]
        }
        for e in entries
    ]

@router.get("/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(entry_id: str, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    entry = await db.journal_entries.find_one({
        "_id": ObjectId(entry_id),
        "user_id": user["_id"]
    })
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return {
        "id": str(entry["_id"]),
        "user_id": entry["user_id"],
        "title": entry.get("title"),
        "content": entry["content"],
        "media_urls": entry.get("media_urls", []),
        "tags": entry.get("tags", []),
        "event_tag": entry.get("event_tag"),
        "sentiment": entry.get("sentiment", {}),
        "created_at": entry["created_at"],
        "updated_at": entry["updated_at"]
    }

@router.put("/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(entry_id: str, entry: JournalEntryCreate, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    existing = await db.journal_entries.find_one({
        "_id": ObjectId(entry_id),
        "user_id": user["_id"]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Re-analyze sentiment if content changed
    sentiment = existing.get("sentiment", {})
    if entry.content != existing["content"]:
        sentiment = await analyze_sentiment(entry.content)
    
    update_doc = {
        "title": entry.title or existing.get("title"),
        "content": entry.content,
        "media_urls": entry.media_urls or [],
        "tags": entry.tags or [],
        "event_tag": entry.event_tag,
        "sentiment": sentiment,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.journal_entries.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": update_doc}
    )
    
    return {
        "id": entry_id,
        "user_id": user["_id"],
        "title": update_doc["title"],
        "content": update_doc["content"],
        "media_urls": update_doc["media_urls"],
        "tags": update_doc["tags"],
        "event_tag": update_doc["event_tag"],
        "sentiment": update_doc["sentiment"],
        "created_at": existing["created_at"],
        "updated_at": update_doc["updated_at"]
    }

@router.delete("/{entry_id}")
async def delete_journal_entry(entry_id: str, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    result = await db.journal_entries.delete_one({
        "_id": ObjectId(entry_id),
        "user_id": user["_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Also delete associated memory
    await db.memories.delete_one({
        "source": "journal",
        "source_id": entry_id
    })
    
    return {"message": "Entry deleted successfully"}
