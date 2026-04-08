"""
Chat Routes - AI chatbot with memory saving capability
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
import logging

from models.schemas import ChatRequest, ChatResponse
from services.auth_service import get_current_user
from services.ai_service import chat_with_ai, analyze_sentiment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

def get_db(request: Request):
    return request.app.state.db

SOUL_SNAP_SYSTEM_PROMPT = """You are Soul, a warm and supportive AI companion in the Soul Snap app. Your role is to:

1. Be a caring, empathetic friend who listens without judgment
2. Help users process their emotions and experiences
3. Offer gentle encouragement and perspective when appropriate
4. Remember that you're talking to someone who trusts you with their feelings

Guidelines:
- Keep responses conversational and warm, like talking to a close friend
- Don't be overly clinical or robotic
- Ask thoughtful follow-up questions to show you care
- Offer support without being preachy or giving unsolicited advice
- Celebrate wins, no matter how small
- Validate difficult emotions without trying to immediately "fix" them
- Be genuine - it's okay to express that certain situations are hard

If a conversation seems particularly meaningful or emotional, you may gently ask if the user would like to save it as a memory.

Remember: You're not a therapist, you're a supportive friend who happens to be very good at listening."""

@router.post("", response_model=ChatResponse)
async def send_message(chat_req: ChatRequest, request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    # Get recent chat history for context
    recent_messages = await db.chat_messages.find(
        {"user_id": user["_id"]},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Reverse to get chronological order
    recent_messages.reverse()
    
    # Add current message
    messages = recent_messages + [{"role": "user", "content": chat_req.message}]
    
    # Get AI response
    try:
        ai_response = await chat_with_ai(messages, SOUL_SNAP_SYSTEM_PROMPT)
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        ai_response = "I'm having a moment - could you try again? I want to be fully present for you."
    
    # Analyze sentiment of user's message
    sentiment = await analyze_sentiment(chat_req.message)
    
    # Store messages
    now = datetime.now(timezone.utc)
    await db.chat_messages.insert_many([
        {
            "user_id": user["_id"],
            "role": "user",
            "content": chat_req.message,
            "sentiment": sentiment,
            "created_at": now
        },
        {
            "user_id": user["_id"],
            "role": "assistant",
            "content": ai_response,
            "created_at": now
        }
    ])
    
    # Determine if we should suggest saving as memory
    should_save = False
    if chat_req.save_as_memory is True:
        # User explicitly wants to save
        memory_doc = {
            "user_id": user["_id"],
            "content": f"Conversation: {chat_req.message}\n\nSoul's response: {ai_response}",
            "source": "chat",
            "emotion": sentiment.get("primary_emotion", "neutral"),
            "intensity": sentiment.get("intensity", 0.5),
            "event_tag": None,
            "created_at": now
        }
        await db.memories.insert_one(memory_doc)
        should_save = True
    elif chat_req.save_as_memory is None and sentiment.get("intensity", 0) > 0.7:
        # High emotional intensity - AI might suggest saving
        should_save = True  # This signals frontend to ask user
    
    return ChatResponse(
        response=ai_response,
        sentiment=sentiment,
        should_save=should_save
    )

@router.get("/history")
async def get_chat_history(
    request: Request,
    limit: int = 50,
    skip: int = 0
):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    messages = await db.chat_messages.find(
        {"user_id": user["_id"]},
        {"_id": 0, "role": 1, "content": 1, "sentiment": 1, "created_at": 1}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Return in chronological order
    messages.reverse()
    
    return {"messages": messages}

@router.delete("/history")
async def clear_chat_history(request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    await db.chat_messages.delete_many({"user_id": user["_id"]})
    
    return {"message": "Chat history cleared"}

@router.post("/save-memory")
async def save_conversation_as_memory(request: Request):
    """Save the last conversation exchange as a memory"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    # Get last user message and AI response
    last_messages = await db.chat_messages.find(
        {"user_id": user["_id"]}
    ).sort("created_at", -1).limit(2).to_list(2)
    
    if len(last_messages) < 2:
        raise HTTPException(status_code=400, detail="No conversation to save")
    
    # Find user message and AI response
    user_msg = None
    ai_msg = None
    for msg in last_messages:
        if msg["role"] == "user":
            user_msg = msg
        else:
            ai_msg = msg
    
    if not user_msg or not ai_msg:
        raise HTTPException(status_code=400, detail="Incomplete conversation")
    
    memory_doc = {
        "user_id": user["_id"],
        "content": f"Conversation: {user_msg['content']}\n\nSoul's response: {ai_msg['content']}",
        "source": "chat",
        "emotion": user_msg.get("sentiment", {}).get("primary_emotion", "neutral"),
        "intensity": user_msg.get("sentiment", {}).get("intensity", 0.5),
        "event_tag": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.memories.insert_one(memory_doc)
    
    return {"message": "Conversation saved as memory", "memory_id": str(result.inserted_id)}
