"""
Memory Routes - Emotional memories and memory capsules
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import List, Optional
import logging

from models.schemas import MemoryCreate, MemoryResponse, MemoryCapsuleResponse
from services.auth_service import get_current_user
from services.ai_service import chat_with_ai

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Memories"])

def get_db(request: Request):
    return request.app.state.db

@router.post("", response_model=MemoryResponse)
async def create_memory(memory: MemoryCreate, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    memory_doc = {
        "user_id": user["_id"],
        "content": memory.content,
        "source": memory.source,
        "emotion": memory.emotion.value,
        "intensity": memory.intensity,
        "event_tag": memory.event_tag,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.memories.insert_one(memory_doc)
    
    return {
        "id": str(result.inserted_id),
        "user_id": user["_id"],
        "content": memory_doc["content"],
        "source": memory_doc["source"],
        "emotion": memory_doc["emotion"],
        "intensity": memory_doc["intensity"],
        "event_tag": memory_doc["event_tag"],
        "created_at": memory_doc["created_at"]
    }

@router.get("", response_model=List[MemoryResponse])
async def get_memories(
    request: Request,
    limit: int = 50,
    skip: int = 0,
    emotion: Optional[str] = None,
    event_tag: Optional[str] = None
):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    query = {"user_id": user["_id"]}
    if emotion:
        query["emotion"] = emotion
    if event_tag:
        query["event_tag"] = event_tag
    
    memories = await db.memories.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [
        {
            "id": str(m["_id"]),
            "user_id": m["user_id"],
            "content": m["content"],
            "source": m["source"],
            "emotion": m["emotion"],
            "intensity": m["intensity"],
            "event_tag": m.get("event_tag"),
            "created_at": m["created_at"]
        }
        for m in memories
    ]

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    result = await db.memories.delete_one({
        "_id": ObjectId(memory_id),
        "user_id": user["_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    return {"message": "Memory deleted"}

@router.post("/capsule")
async def generate_memory_capsule(request: Request, days: int = 7):
    """Generate an AI-powered memory capsule for the past N days"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    period_end = datetime.now(timezone.utc)
    period_start = period_end - timedelta(days=days)
    
    # Get memories from the period
    memories = await db.memories.find({
        "user_id": user["_id"],
        "created_at": {"$gte": period_start, "$lte": period_end}
    }).sort("created_at", 1).to_list(100)
    
    if len(memories) < 2:
        raise HTTPException(status_code=400, detail="Not enough memories to create a capsule")
    
    # Prepare content for AI
    memory_texts = [f"- {m['emotion'].upper()}: {m['content'][:200]}" for m in memories]
    memories_summary = "\n".join(memory_texts[:20])  # Limit to 20 for context
    
    # Count emotions
    emotion_counts = {}
    for m in memories:
        emotion = m["emotion"]
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    dominant_emotion = max(emotion_counts, key=emotion_counts.get)
    
    # Generate capsule with AI
    prompt = f"""Create a warm, personal "Memory Capsule" summary for someone's past {days} days.

Their emotional memories from this period:
{memories_summary}

Dominant emotion: {dominant_emotion}

Write a short, heartfelt summary (2-3 paragraphs) that:
1. Acknowledges the emotional journey they've been on
2. Highlights key themes or patterns
3. Ends with an encouraging note

Keep it personal and warm, like a letter from a friend reflecting on their experiences together."""

    try:
        summary = await chat_with_ai([{"role": "user", "content": prompt}])
    except Exception as e:
        logger.error(f"AI capsule generation error: {e}")
        summary = "Your memories from this period show a rich emotional journey. Take a moment to appreciate all that you've experienced and felt."
    
    # Create capsule
    capsule_doc = {
        "user_id": user["_id"],
        "title": f"Memory Capsule: {period_start.strftime('%b %d')} - {period_end.strftime('%b %d, %Y')}",
        "summary": summary,
        "key_memories": [str(m["_id"]) for m in memories[:5]],
        "dominant_emotion": dominant_emotion,
        "emotion_breakdown": emotion_counts,
        "period_start": period_start,
        "period_end": period_end,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.memory_capsules.insert_one(capsule_doc)
    
    return {
        "id": str(result.inserted_id),
        "user_id": user["_id"],
        "title": capsule_doc["title"],
        "summary": capsule_doc["summary"],
        "key_memories": capsule_doc["key_memories"],
        "dominant_emotion": capsule_doc["dominant_emotion"],
        "period_start": capsule_doc["period_start"],
        "period_end": capsule_doc["period_end"],
        "created_at": capsule_doc["created_at"]
    }

@router.get("/capsules", response_model=List[MemoryCapsuleResponse])
async def get_memory_capsules(request: Request, limit: int = 10):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    capsules = await db.memory_capsules.find(
        {"user_id": user["_id"]}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [
        {
            "id": str(c["_id"]),
            "user_id": c["user_id"],
            "title": c["title"],
            "summary": c["summary"],
            "key_memories": c["key_memories"],
            "dominant_emotion": c["dominant_emotion"],
            "period_start": c["period_start"],
            "period_end": c["period_end"],
            "created_at": c["created_at"]
        }
        for c in capsules
    ]
