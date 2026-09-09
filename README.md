# SkillSwap

SkillSwap is a peer-to-peer skill exchange platform that connects people who want to learn and teach new skills. Users can create a profile, list the skills they can teach and want to learn, and get matched with others based on their interests and expertise. The platform features real-time chat, intelligent matching, and a friendly, intuitive interface.

## Features
- User registration and authentication
- Profile creation with bio and skill lists
- Intelligent skill-based matching using embeddings
- Real-time chat with WebSocket support
- Feedback and match history
- Modern, responsive frontend (React + Vite)
- FastAPI-based ML backend for advanced matching
- Node.js/Express backend for API and database

## Tech Stack
- Frontend: React, Vite, Material UI
- Backend: Node.js, Express, PostgreSQL
- ML/Matching: FastAPI, Python, Sentence Transformers
- Real-time: WebSocket (ws)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.9+
- PostgreSQL

### Setup

#### 1. Clone the repository
```sh
git clone <your-repo-url>
cd SkillSwap
```

#### 2. Install dependencies
- Backend:
  ```sh
  cd backend
  npm install
  ```
- Frontend:
  ```sh
  cd ../skillswapfe
  npm install
  ```
- ML Backend:
  ```sh
  cd ../skill-matching-fastapi
  pip install -r requirements.txt
  ```

#### 3. Configure environment variables
- Copy `.env.example` to `.env` in each service and fill in the required values (database URL, API keys, etc).

#### 4. Start the services
- Start PostgreSQL and ensure your database is set up (see `backend/db.js` for connection details).
- Start the Node.js backend:
  ```sh
  cd backend
  npm start
  ```
- Start the ML backend:
  ```sh
  cd ../skill-matching-fastapi
  uvicorn app.main:app --reload
  ```
- Start the WebSocket server:
  ```sh
  cd ../backend
  node ws.js
  ```
- Start the frontend:
  ```sh
  cd ../skillswapfe
  npm run dev
  ```

## Usage
- Register or log in.
- Complete your profile with a relevant bio and add skills you can teach and want to learn.
- Get matched with other users.
- Start a chat and exchange knowledge!

## Project Structure
- `backend/` - Node.js/Express API and WebSocket server
- `skillswapfe/` - React frontend
- `skill-matching-fastapi/` - FastAPI ML backend

---

SkillSwap: Learn. Teach. Connect.
