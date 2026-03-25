"""
Configuration - reads from environment variables.
Copy .env.example to .env and fill in values.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Checkout Detector"
    DEBUG: bool = False

    # Database (SQLite for local/free tier, swap to Postgres URL for production)
    DATABASE_URL: str = "sqlite+aiosqlite:///./checkout.db"

    # Security
    API_KEY: str = "change-me-in-production"  # local detector must send this

    # CORS - add your Vercel URL here
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",       # local Vite dev
        "http://localhost:3000",
        "https://your-app.vercel.app", # replace with actual Vercel URL
    ]

    # Detection thresholds
    CONFIDENCE_THRESHOLD: float = 0.5   # YOLO min confidence to accept
    ALERT_COOLDOWN_SECONDS: int = 5     # don't spam alerts for same event
    MAX_ALERTS_STORED: int = 1000       # cap DB rows

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30     # seconds between pings

    class Config:
        env_file = ".env"


settings = Settings()
