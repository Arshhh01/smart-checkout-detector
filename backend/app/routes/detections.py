"""
/detections routes

POST /detections       - local detector pushes frame data (requires API key)
GET  /detections       - dashboard fetches detection history
GET  /detections/{id}  - single detection detail
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_api_key
from app.models.schemas import DetectionCreate, DetectionResponse
from app.services.detection_service import save_detection, get_detections

router = APIRouter()


@router.post(
    "/",
    response_model=DetectionResponse,
    status_code=201,
    dependencies=[Depends(require_api_key)],
    summary="Push detection frame from local detector",
)
async def push_detection(
    payload: DetectionCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by the local detector script every ~100ms.
    Saves the frame, optionally creates an alert, and broadcasts via WebSocket.
    Requires X-API-Key header.
    """
    detection = await save_detection(db, payload)
    return detection


@router.get(
    "/",
    response_model=list[DetectionResponse],
    summary="Get detection history",
)
async def list_detections(
    camera_id: str | None = Query(None, description="Filter by camera"),
    alerts_only: bool = Query(False, description="Only return frames that triggered alerts"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await get_detections(db, camera_id, alerts_only, limit, offset)


@router.get(
    "/{detection_id}",
    response_model=DetectionResponse,
    summary="Get single detection by ID",
)
async def get_detection(
    detection_id: int,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.detection import Detection

    result = await db.execute(
        select(Detection).where(Detection.id == detection_id)
    )
    detection = result.scalar_one_or_none()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection
