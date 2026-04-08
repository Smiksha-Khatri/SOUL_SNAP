"""
Dashboard Routes - Stats, trends, reports, and motivational messages
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import List
import logging

from models.schemas import DashboardStats, WeeklyReportResponse, QuickMoodInput
from services.auth_service import get_current_user
from services.ai_service import chat_with_ai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_db(request: Request):
    return request.app.state.db

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(request: Request):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    # Get counts
    total_entries = await db.journal_entries.count_documents({"user_id": user["_id"]})
    total_memories = await db.memories.count_documents({"user_id": user["_id"]})
    
    # Get recent entries
    recent_entries = await db.journal_entries.find(
        {"user_id": user["_id"]}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get weekly emotion trend
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    weekly_emotions = await db.memories.find({
        "user_id": user["_id"],
        "created_at": {"$gte": week_ago}
    }).sort("created_at", 1).to_list(100)
    
    # Process weekly trend
    daily_emotions = {}
    emotion_counts = {}
    
    for mem in weekly_emotions:
        date_str = mem["created_at"].strftime("%Y-%m-%d")
        emotion = mem["emotion"]
        
        if date_str not in daily_emotions:
            daily_emotions[date_str] = {"date": date_str, "emotions": {}}
        
        daily_emotions[date_str]["emotions"][emotion] = daily_emotions[date_str]["emotions"].get(emotion, 0) + 1
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    # Calculate dominant emotion
    dominant_emotion = "neutral"
    if emotion_counts:
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)
    
    # Format weekly trend
    weekly_trend = []
    for date_str, data in sorted(daily_emotions.items()):
        top_emotion = max(data["emotions"], key=data["emotions"].get) if data["emotions"] else "neutral"
        weekly_trend.append({
            "date": date_str,
            "emotion": top_emotion,
            "intensity": 0.7  # Average intensity
        })
    
    # Format recent entries
    formatted_entries = [
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
        for e in recent_entries
    ]
    
    # Generate motivational message based on dominant emotion
    motivational_message = await generate_motivational_message(dominant_emotion, user["name"])
    
    return DashboardStats(
        total_entries=total_entries,
        total_memories=total_memories,
        dominant_emotion=dominant_emotion,
        weekly_trend=weekly_trend,
        recent_entries=formatted_entries,
        motivational_message=motivational_message
    )

async def generate_motivational_message(emotion: str, user_name: str) -> str:
    """Generate a personalized motivational message"""
    messages = {
        "joy": f"Keep shining, {user_name}! Your positive energy is contagious. Remember to share those good vibes with others today!",
        "calm": f"You've found your center, {user_name}. That inner peace you're cultivating is a superpower. Carry it with you today.",
        "sadness": f"It's okay to feel down sometimes, {user_name}. These feelings are valid, and they will pass. Be gentle with yourself today.",
        "anger": f"Your feelings matter, {user_name}. Channel that energy into something positive today. You have the power to transform frustration into action.",
        "anxiety": f"Take a deep breath, {user_name}. You've handled difficult moments before, and you'll handle this too. One step at a time.",
        "neutral": f"Every day is a new page, {user_name}. What story will you write today? The possibilities are endless."
    }
    
    return messages.get(emotion, messages["neutral"])

@router.post("/quick-mood")
async def log_quick_mood(mood: QuickMoodInput, request: Request):
    """Quick mood check-in"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    memory_doc = {
        "user_id": user["_id"],
        "content": mood.note or f"Quick mood check: feeling {mood.emotion.value}",
        "source": "quick_mood",
        "emotion": mood.emotion.value,
        "intensity": 0.6,
        "event_tag": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.memories.insert_one(memory_doc)
    
    # Return an encouraging message
    message = await generate_motivational_message(mood.emotion.value, user["name"])
    
    return {"message": "Mood logged!", "encouragement": message}

@router.post("/weekly-report")
async def generate_weekly_report(request: Request):
    """Generate weekly emotional report card"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    week_end = datetime.now(timezone.utc)
    week_start = week_end - timedelta(days=7)
    
    # Get all memories from the week
    memories = await db.memories.find({
        "user_id": user["_id"],
        "created_at": {"$gte": week_start, "$lte": week_end}
    }).to_list(500)
    
    if len(memories) < 1:
        raise HTTPException(status_code=400, detail="Not enough data for a weekly report")
    
    # Calculate emotion breakdown
    emotion_counts = {}
    daily_data = {}
    
    for mem in memories:
        emotion = mem["emotion"]
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        date_str = mem["created_at"].strftime("%Y-%m-%d")
        if date_str not in daily_data:
            daily_data[date_str] = {"date": date_str, "emotions": {}, "count": 0}
        daily_data[date_str]["emotions"][emotion] = daily_data[date_str]["emotions"].get(emotion, 0) + 1
        daily_data[date_str]["count"] += 1
    
    total = sum(emotion_counts.values())
    emotion_breakdown = {k: round(v / total, 2) for k, v in emotion_counts.items()}
    
    # Format daily emotions
    daily_emotions = []
    for date_str in sorted(daily_data.keys()):
        data = daily_data[date_str]
        top_emotion = max(data["emotions"], key=data["emotions"].get)
        daily_emotions.append({
            "date": date_str,
            "dominant_emotion": top_emotion,
            "entry_count": data["count"]
        })
    
    # Generate AI summary
    prompt = f"""Create a brief, supportive weekly emotional report card summary.

Emotion breakdown for the week:
{emotion_breakdown}

Number of entries: {len(memories)}
Days tracked: {len(daily_data)}

Write:
1. A 2-3 sentence summary of their emotional week
2. 2-3 personalized recommendations for the coming week

Keep it warm, encouraging, and actionable."""

    try:
        ai_response = await chat_with_ai([{"role": "user", "content": prompt}])
        parts = ai_response.split("\n\n")
        summary = parts[0] if parts else ai_response
        recommendations = [r.strip("- ").strip() for r in parts[1].split("\n") if r.strip()] if len(parts) > 1 else ["Take time for self-care", "Continue journaling"]
    except Exception as e:
        logger.error(f"AI report generation error: {e}")
        summary = "You've been on an emotional journey this week. Keep tracking your feelings to understand yourself better."
        recommendations = ["Continue journaling daily", "Practice mindfulness", "Celebrate small wins"]
    
    # Store report
    report_doc = {
        "user_id": user["_id"],
        "week_start": week_start,
        "week_end": week_end,
        "emotion_breakdown": emotion_breakdown,
        "daily_emotions": daily_emotions,
        "summary": summary,
        "recommendations": recommendations[:5],
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.weekly_reports.insert_one(report_doc)
    
    return {
        "id": str(result.inserted_id),
        "user_id": user["_id"],
        "week_start": week_start,
        "week_end": week_end,
        "emotion_breakdown": emotion_breakdown,
        "daily_emotions": daily_emotions,
        "summary": summary,
        "recommendations": recommendations,
        "created_at": report_doc["created_at"]
    }

@router.get("/weekly-reports", response_model=List[WeeklyReportResponse])
async def get_weekly_reports(request: Request, limit: int = 10):
    db = get_db(request)
    user = await get_current_user(request, db)
    
    reports = await db.weekly_reports.find(
        {"user_id": user["_id"]}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [
        {
            "id": str(r["_id"]),
            "user_id": r["user_id"],
            "week_start": r["week_start"],
            "week_end": r["week_end"],
            "emotion_breakdown": r["emotion_breakdown"],
            "daily_emotions": r["daily_emotions"],
            "summary": r["summary"],
            "recommendations": r["recommendations"],
            "created_at": r["created_at"]
        }
        for r in reports
    ]

@router.get("/timeline")
async def get_emotion_timeline(
    request: Request,
    days: int = 30
):
    """Get emotional timeline for visualization"""
    db = get_db(request)
    user = await get_current_user(request, db)
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    memories = await db.memories.find({
        "user_id": user["_id"],
        "created_at": {"$gte": start_date}
    }).sort("created_at", 1).to_list(500)
    
    # Group by date
    timeline = {}
    for mem in memories:
        date_str = mem["created_at"].strftime("%Y-%m-%d")
        if date_str not in timeline:
            timeline[date_str] = {
                "date": date_str,
                "entries": [],
                "emotions": {}
            }
        
        timeline[date_str]["entries"].append({
            "id": str(mem["_id"]),
            "content": mem["content"][:100],
            "emotion": mem["emotion"],
            "intensity": mem["intensity"],
            "event_tag": mem.get("event_tag"),
            "source": mem["source"]
        })
        
        emotion = mem["emotion"]
        timeline[date_str]["emotions"][emotion] = timeline[date_str]["emotions"].get(emotion, 0) + 1
    
    # Calculate dominant emotion per day
    for date_str in timeline:
        if timeline[date_str]["emotions"]:
            timeline[date_str]["dominant_emotion"] = max(
                timeline[date_str]["emotions"],
                key=timeline[date_str]["emotions"].get
            )
        else:
            timeline[date_str]["dominant_emotion"] = "neutral"
    
    return {"timeline": list(timeline.values())}
