"""
AI Service - Modular, provider-agnostic AI integration layer
Supports: OpenAI, Gemini, Anthropic (Claude)
"""
import os
import httpx
import asyncio
import random
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)

# Keyword-based sentiment analysis as fallback when AI is unavailable
EMOTION_KEYWORDS = {
    "joy": ["happy", "joy", "excited", "great", "wonderful", "amazing", "love", "fantastic", "blessed", "grateful", "thankful", "awesome", "celebrate", "delighted"],
    "calm": ["peaceful", "calm", "relaxed", "serene", "content", "comfortable", "quiet", "zen", "tranquil", "at ease", "gentle"],
    "sadness": ["sad", "depressed", "down", "unhappy", "miserable", "crying", "tears", "lonely", "heartbroken", "grief", "loss", "miss", "hurt"],
    "anger": ["angry", "mad", "frustrated", "annoyed", "furious", "rage", "hate", "irritated", "upset", "pissed"],
    "anxiety": ["anxious", "worried", "nervous", "stressed", "panic", "fear", "scared", "overwhelmed", "uncertain", "afraid", "tense"]
}

def fallback_sentiment_analysis(text: str) -> Dict:
    """Local keyword-based sentiment analysis when AI is unavailable"""
    text_lower = text.lower()
    emotion_scores = {}
    
    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            emotion_scores[emotion] = score
    
    if emotion_scores:
        primary_emotion = max(emotion_scores, key=emotion_scores.get)
        total = sum(emotion_scores.values())
        intensity = min(0.9, 0.4 + (emotion_scores[primary_emotion] / total) * 0.5)
        secondary = [e for e in emotion_scores if e != primary_emotion][:2]
    else:
        primary_emotion = "neutral"
        intensity = 0.5
        secondary = []
    
    return {
        "primary_emotion": primary_emotion,
        "intensity": round(intensity, 2),
        "secondary_emotions": secondary,
        "summary": f"Detected {primary_emotion} emotion in the text"
    }

# Fallback responses for chat when AI is unavailable
FALLBACK_CHAT_RESPONSES = [
    "I'm here with you. Sometimes it helps just to write things down, even if I can't respond fully right now.",
    "Thank you for sharing that with me. I'm listening, even if my thoughts are a bit limited at the moment.",
    "I appreciate you opening up. Take your time - there's no rush to figure everything out.",
    "That sounds like a lot to process. Remember, it's okay to feel whatever you're feeling.",
    "I hear you. Even when I can't offer much, know that expressing your thoughts matters.",
]

class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def chat(self, messages: List[Dict], system_prompt: str = None) -> str:
        pass
    
    @abstractmethod
    async def analyze_sentiment(self, text: str) -> Dict:
        pass

class GeminiProvider(AIProvider):
    """Google Gemini AI provider"""
    
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
    
    async def chat(self, messages: List[Dict], system_prompt: str = None) -> str:
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        
        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        payload = {"contents": contents}
        
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}
        
        # Retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(url, json=payload)
                    
                    if response.status_code == 429:
                        # Rate limited - wait and retry
                        wait_time = (2 ** attempt) + random.uniform(0, 1)
                        logger.warning(f"Gemini rate limited, waiting {wait_time:.1f}s before retry {attempt + 1}/{max_retries}")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    response.raise_for_status()
                    data = response.json()
                    
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Gemini rate limited, waiting {wait_time:.1f}s")
                    await asyncio.sleep(wait_time)
                    continue
                raise
            except Exception as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                raise
        
        raise Exception("Max retries exceeded for Gemini API")
    
    async def analyze_sentiment(self, text: str) -> Dict:
        prompt = f"""Analyze the emotional sentiment of this text and return a JSON object with:
- primary_emotion: The main emotion (joy, calm, sadness, anger, anxiety, neutral)
- intensity: A score from 0 to 1 indicating intensity
- secondary_emotions: List of other emotions detected
- summary: A brief 1-sentence summary of the emotional state

Text to analyze: "{text}"

Return ONLY valid JSON, no markdown or explanation."""

        response = await self.chat([{"role": "user", "content": prompt}])
        
        try:
            # Clean response and parse JSON
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "primary_emotion": "neutral",
                "intensity": 0.5,
                "secondary_emotions": [],
                "summary": "Unable to analyze sentiment"
            }

class OpenAIProvider(AIProvider):
    """OpenAI GPT provider"""
    
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.openai.com/v1"
    
    async def chat(self, messages: List[Dict], system_prompt: str = None) -> str:
        url = f"{self.base_url}/chat/completions"
        
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            formatted_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": formatted_messages
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            return data["choices"][0]["message"]["content"]
    
    async def analyze_sentiment(self, text: str) -> Dict:
        prompt = f"""Analyze the emotional sentiment of this text and return a JSON object with:
- primary_emotion: The main emotion (joy, calm, sadness, anger, anxiety, neutral)
- intensity: A score from 0 to 1 indicating intensity
- secondary_emotions: List of other emotions detected
- summary: A brief 1-sentence summary of the emotional state

Text to analyze: "{text}"

Return ONLY valid JSON, no markdown or explanation."""

        response = await self.chat([{"role": "user", "content": prompt}])
        
        try:
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "primary_emotion": "neutral",
                "intensity": 0.5,
                "secondary_emotions": [],
                "summary": "Unable to analyze sentiment"
            }

class AnthropicProvider(AIProvider):
    """Anthropic Claude provider"""
    
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1"
    
    async def chat(self, messages: List[Dict], system_prompt: str = None) -> str:
        url = f"{self.base_url}/messages"
        
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        payload = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": formatted_messages
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            return data["content"][0]["text"]
    
    async def analyze_sentiment(self, text: str) -> Dict:
        prompt = f"""Analyze the emotional sentiment of this text and return a JSON object with:
- primary_emotion: The main emotion (joy, calm, sadness, anger, anxiety, neutral)
- intensity: A score from 0 to 1 indicating intensity
- secondary_emotions: List of other emotions detected
- summary: A brief 1-sentence summary of the emotional state

Text to analyze: "{text}"

Return ONLY valid JSON, no markdown or explanation."""

        response = await self.chat([{"role": "user", "content": prompt}])
        
        try:
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "primary_emotion": "neutral",
                "intensity": 0.5,
                "secondary_emotions": [],
                "summary": "Unable to analyze sentiment"
            }

class AIService:
    """
    AI Service Factory - Manages AI provider instances
    Configure via environment variables:
    - AI_PROVIDER: gemini, openai, or anthropic
    - GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY
    """
    
    _instance: Optional[AIProvider] = None
    
    @classmethod
    def get_provider(cls) -> AIProvider:
        if cls._instance is None:
            provider = os.environ.get("AI_PROVIDER", "gemini").lower()
            
            if provider == "gemini":
                api_key = os.environ.get("GEMINI_API_KEY")
                model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
                cls._instance = GeminiProvider(api_key, model)
            elif provider == "openai":
                api_key = os.environ.get("OPENAI_API_KEY")
                model = os.environ.get("OPENAI_MODEL", "gpt-4o")
                cls._instance = OpenAIProvider(api_key, model)
            elif provider == "anthropic":
                api_key = os.environ.get("ANTHROPIC_API_KEY")
                model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
                cls._instance = AnthropicProvider(api_key, model)
            else:
                raise ValueError(f"Unknown AI provider: {provider}")
            
            logger.info(f"AI Service initialized with provider: {provider}")
        
        return cls._instance
    
    @classmethod
    def reset(cls):
        """Reset the provider instance (useful for testing or config changes)"""
        cls._instance = None

# Convenience functions with fallback handling
async def chat_with_ai(messages: List[Dict], system_prompt: str = None) -> str:
    try:
        provider = AIService.get_provider()
        return await provider.chat(messages, system_prompt)
    except Exception as e:
        logger.error(f"AI chat failed, using fallback: {e}")
        return random.choice(FALLBACK_CHAT_RESPONSES)

async def analyze_sentiment(text: str) -> Dict:
    try:
        provider = AIService.get_provider()
        return await provider.analyze_sentiment(text)
    except Exception as e:
        logger.warning(f"AI sentiment analysis failed, using fallback: {e}")
        return fallback_sentiment_analysis(text)
