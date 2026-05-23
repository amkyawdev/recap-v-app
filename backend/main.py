# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

from app.api import routes
from app.config import OUTPUT_DIR, UPLOAD_DIR

# Create FastAPI app
app = FastAPI(
    title="Movie Recap API",
    description="API for burning subtitles into videos using FFmpeg",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router, prefix="/api")

# Serve static files for outputs (in production, use a proper CDN)
@app.on_event("startup")
async def startup_event():
    """Create necessary directories on startup."""
    UPLOAD_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Movie Recap API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}