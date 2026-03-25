from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.routes import detections, alerts, stats, health, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await init_db()
    yield


app = FastAPI(
    title="Smart Checkout Detector API",
    description="AI-powered self-checkout theft detection backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow React dashboard (Vercel) and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(detections.router, prefix="/detections", tags=["Detections"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
