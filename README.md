Gift Desires Web App

This project contains a simple gift wish-list application with:
- Frontend: React (Vite) — runs independently on its own dev server
- Backend: FastAPI (Python) — runs independently with Uvicorn
- Database: SQLite (via SQLAlchemy)

Features
- User registration and login (JWT-based auth)
- Create events
- For each event, create and manage a list of gifts
- Share an event with a list of viewer emails (only invited users can view)

Quick start
1) Backend
   - Create a Python virtual environment and install dependencies:
     ```
     cd backend
     python -m venv .venv
     .venv\Scripts\activate
     pip install -r requirements.txt
     ```
   - Run the server:
     ```
     uvicorn app.main:app --reload --port 8000
     ```
   - API docs available at http://localhost:8000/docs

2) Frontend
   - Install deps and run the dev server:
     ```
     cd frontend
     npm install
     npm run dev
     ```
   - App available at http://localhost:5173

Configuration
- The frontend expects the backend at http://localhost:8000. You can change this by setting Vite env var `VITE_API_BASE` in `frontend/.env`.

Notes
- This is a minimal full-stack starter intended for local development and learning.
