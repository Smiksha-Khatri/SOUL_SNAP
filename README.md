# 🧠 Soul Snap — AI Emotional Journal & Companion

> *"Understand your emotions. Reflect deeply. Grow with AI."*

Soul Snap is a **full-stack AI-powered emotional journaling platform** that helps users track their thoughts, analyze emotions, and interact with an intelligent AI companion for meaningful self-reflection.

---

## 🚀 Live Demo

🔗 *Coming Soon* (Add deployed link here)

---

## 📸 Screenshots

> *(Add screenshots here after deployment for maximum impact)*

* Dashboard View
* Journal Writing Interface
* AI Chat Companion
* Mood Analytics Graph

---

## ✨ Key Features

### 📝 Emotional Journaling

* Write, edit, and store personal thoughts
* Attach images/videos to entries
* Organized and secure storage

### 🤖 AI Companion (Powered by Groq)

* Real-time intelligent conversations
* Emotion-aware responses
* Context-based memory for personalized interaction

### 📊 Mood Analytics Dashboard

* Visual representation of emotional patterns
* Track mood trends over time
* Data-driven self-awareness

### 🧠 Smart Memory System

* Stores important emotional context
* Improves AI responses over time
* Personalized user experience

### 🔐 Secure Authentication

* JWT-based login & signup
* Protected routes
* Secure user data handling

---

## 🏗️ Tech Stack

### 🖥️ Frontend

* React.js (CRA)
* Tailwind CSS
* Radix UI / shadcn UI
* Framer Motion
* Recharts
* Axios

### ⚙️ Backend

* FastAPI (Python)
* MongoDB (Motor - async)
* JWT Authentication
* Pydantic Validation

### 🤖 AI

* Groq API (LLM for chat + emotional understanding)

### ☁️ Cloud

* Cloudinary (Media Storage)

---

## 🧩 System Architecture

```id="5q8u2l"
Frontend (React)
        ↓
Backend (FastAPI API Layer)
        ↓
MongoDB (Database)
        ↓
Groq API (AI Processing)
        ↓
Cloudinary (Media Storage)
```

---

## 📂 Project Structure

```id="q1w3j7"
SOUL_SNAP/
│
├── backend/
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic & AI integration
│   ├── models/        # Data models
│   ├── memory/        # AI memory system
│   └── server.py      # Entry point
│
├── frontend/
│   ├── src/
│   ├── components/
│   └── public/
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 Clone the Repository

```bash id="m3k9q1"
git clone https://github.com/your-username/SOUL_SNAP.git
cd SOUL_SNAP
```

---

### 🔹 Backend Setup

```bash id="b2k7n0"
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```id="z8f2l3"
MONGO_URL=your_mongodb_connection
DB_NAME=your_database_name
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:3000
CLOUDINARY_URL=your_cloudinary_config
```

Run server:

```bash id="x7n4k2"
uvicorn server:app --reload
```

---

### 🔹 Frontend Setup

```bash id="l5p8r9"
cd frontend
npm install
npm start
```

Create `frontend/.env`:

```id="c4v6m1"
REACT_APP_API_URL=http://localhost:8000
```

---

## 🔐 Environment Variables

### Backend

| Variable       | Description               |
| -------------- | ------------------------- |
| MONGO_URL      | MongoDB connection string |
| DB_NAME        | Database name             |
| GROQ_API_KEY   | Groq API key              |
| FRONTEND_URL   | Frontend URL              |
| CLOUDINARY_URL | Cloudinary config         |

### Frontend

| Variable          | Description     |
| ----------------- | --------------- |
| REACT_APP_API_URL | Backend API URL |

---

## 📡 API Endpoints

| Category  | Endpoint                                |
| --------- | --------------------------------------- |
| Auth      | `/api/auth/register`, `/api/auth/login` |
| Journal   | `/api/v1/journal`                       |
| Chat      | `/api/v1/chat`                          |
| Dashboard | `/api/v1/dashboard`                     |

---

## 💡 What Makes This Project Special

* 🔥 Combines **AI + Full Stack Development**
* 🧠 Focuses on **mental wellness + emotional intelligence**
* ⚡ Uses **real-time AI interaction**
* 📊 Includes **data visualization + analytics**
* 🏗️ Built with **scalable architecture**

---

## 🌱 Future Enhancements

* 🎤 Voice-based journaling
* 📱 Mobile app (React Native)
* 🧠 Emotion prediction using ML
* 🌙 Dark mode UI
* 🚀 Live deployment & CI/CD

---

## ⚠️ Security Note

* `.env` files are not included for security reasons
* Never expose API keys publicly
* Rotate keys if accidentally exposed

---

## 👩‍💻 Author

**Smiksha Khatri**

---

## 🌟 Vision

To build a safe, intelligent space where people can explore their emotions, gain clarity, and grow with the support of AI.

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!

---
