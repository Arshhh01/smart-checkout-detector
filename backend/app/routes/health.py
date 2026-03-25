"""
Health check - Render/Railway ping this to confirm the service is up.
"""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health", summary="Health check")
async def health():
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
    }
