"""
Pydantic Models for Soul Snap
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class EmotionType(str, Enum):
    JOY = "joy"
    CALM = "calm"
    SADNESS = "sadness"
    ANGER = "anger"
    ANXIETY = "anxiety"
    NEUTRAL = "neutral"

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(alias="_id")
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime

class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Journal Models
class JournalEntryCreate(BaseModel):
    content: str
    title: Optional[str] = None
    media_urls: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    event_tag: Optional[str] = None

class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: Optional[str]
    content: str
    media_urls: List[str] = []
    tags: List[str] = []
    event_tag: Optional[str] = None
    sentiment: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

# Chat Models
class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str

class ChatRequest(BaseModel):
    message: str
    save_as_memory: Optional[bool] = None

class ChatResponse(BaseModel):
    response: str
    sentiment: Optional[Dict[str, Any]] = None
    should_save: bool = False

# Memory Models
class MemoryCreate(BaseModel):
    content: str
    source: str  # journal, chat, manual
    emotion: EmotionType
    intensity: float = 0.5
    event_tag: Optional[str] = None

class MemoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    content: str
    source: str
    emotion: str
    intensity: float
    event_tag: Optional[str]
    created_at: datetime

# Memory Capsule Models
class MemoryCapsuleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    summary: str
    key_memories: List[str]
    dominant_emotion: str
    period_start: datetime
    period_end: datetime
    created_at: datetime

# Report Card Models
class WeeklyReportResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    week_start: datetime
    week_end: datetime
    emotion_breakdown: Dict[str, float]
    daily_emotions: List[Dict[str, Any]]
    summary: str
    recommendations: List[str]
    created_at: datetime

# Dashboard Models
class EmotionTrend(BaseModel):
    date: str
    emotion: str
    intensity: float

class DashboardStats(BaseModel):
    total_entries: int
    total_memories: int
    dominant_emotion: str
    weekly_trend: List[EmotionTrend]
    recent_entries: List[JournalEntryResponse]
    motivational_message: Optional[str] = None

# Quick Mood Check
class QuickMoodInput(BaseModel):
    emotion: EmotionType
    note: Optional[str] = None
