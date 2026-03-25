"""
/stats route - aggregated metrics for the dashboard header cards.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import StatsResponse
from app.services.detection_service import get_stats

router = APIRouter()


@router.get(
    "/",
    response_model=StatsResponse,
    summary="Aggregated system statistics",
)
async def system_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns totals used by the dashboard stat cards:
    - Total detections, alerts, unreviewed alerts
    - Confirmed thefts, false positives
    - Avg FPS and inference time
    - Active WebSocket connections
    """
    return await get_stats(db)
