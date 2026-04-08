# Soul Snap - Product Requirements Document

## Overview
Soul Snap is a personal emotional diary and AI companion web application that helps users track, understand, and improve their emotional wellness.

## Original Problem Statement
Create a MERN Stack full-stack web application named "Soul Snap — A Web App That Remembers User Emotions, Not Just Data." Features include emotional diary, AI chatbot companion, sentiment analysis, emotional timeline, memory capsules, and weekly reports.

## User Personas
1. **Self-Aware Individual**: Someone seeking to understand their emotional patterns
2. **Mental Wellness Seeker**: User wanting a supportive AI companion
3. **Journal Enthusiast**: Person who enjoys reflective writing

## Core Requirements (Static)
- Emotional journal with sentiment analysis
- AI chatbot companion with memory-saving capability
- Emotional timeline visualization
- Memory capsules (AI-generated summaries)
- Weekly emotional report cards
- Media upload support (images, audio, documents)
- Event tagging for life events
- Secure authentication (JWT + Google OAuth)

## What's Been Implemented (April 2, 2026)

### Backend (FastAPI + MongoDB)
- ✅ Modular AI service layer (supports Gemini, OpenAI, Anthropic)
- ✅ JWT authentication with httpOnly cookies
- ✅ Google OAuth integration
- ✅ Cloudinary media upload integration
- ✅ Journal CRUD with automatic sentiment analysis
- ✅ AI Chat with conversation history
- ✅ Memory creation and retrieval
- ✅ Memory capsule generation
- ✅ Weekly report generation
- ✅ Emotional timeline API
- ✅ Dashboard stats API
- ✅ Quick mood logging
- ✅ Fallback sentiment analysis (keyword-based)

### Frontend (React + Tailwind + Shadcn)
- ✅ Landing page with hero section
- ✅ Login/Register with Google OAuth
- ✅ Dashboard with greeting, stats, mood widget, chart
- ✅ Journal page with create/edit/delete
- ✅ AI Chat interface
- ✅ Emotional timeline visualization
- ✅ Insights page (capsules + reports tabs)
- ✅ Protected routes
- ✅ Responsive sidebar navigation

### Design
- ✅ Calm/minimal aesthetic (soft colors)
- ✅ Manrope + Figtree typography
- ✅ Emotion-coded color tags
- ✅ Clean card-based layout

## Prioritized Backlog

### P0 (Critical)
- Replace Gemini API key (current one hitting rate limits)

### P1 (High Priority)
- Password reset flow UI
- Profile settings page
- Push notifications for motivational messages
- Mobile-responsive improvements

### P2 (Medium Priority)
- Rich text editor for journal
- Export data feature
- Dark mode toggle
- Search/filter for entries

### P3 (Low Priority)
- Social sharing of memory capsules
- Multi-language support
- Audio transcription for voice notes

## Test Credentials
- Admin: admin@soulsnap.com / admin123

## Architecture
- Backend: FastAPI on port 8001
- Frontend: React on port 3000
- Database: MongoDB (soulsnap_db)
- AI: Gemini (with local fallback)
- Media: Cloudinary
