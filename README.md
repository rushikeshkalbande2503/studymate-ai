
# StudyMate AI

AI-powered Student Learning Assistant.

## Project Overview

StudyMate AI is a web application designed to help students
understand and prepare study materials using Artificial Intelligence.

## Features

1. PDF Upload and Text Extraction
2. AI PDF Summary
3. Chat with PDF
4. Automatic MCQ Quiz Generation
5. AI Study Notes
6. Document History

## Technology Stack

### Frontend
- React.js
- Vite
- CSS3
- Axios
- Lucide React

### Backend
- Python
- FastAPI
- SQLAlchemy
- PyMuPDF
- Google Gemini API

### Database
- SQLite

## Project Structure

studymate-ai/
- backend/
- frontend/
- .gitignore
- README.md

## Run Backend

Open PowerShell:

    cd backend
    .\.venv\Scripts\Activate.ps1
    python -m uvicorn app.main:app --reload

Backend URL:
http://127.0.0.1:8000

API Documentation:
http://127.0.0.1:8000/docs

## Run Frontend

Open another PowerShell terminal:

    cd frontend
    npm install
    npm run dev

Frontend URL:
http://localhost:5173

## Development Status

Day 1: Project setup and dashboard completed.

Further features will be implemented progressively.

## Author

Marathi Coder
