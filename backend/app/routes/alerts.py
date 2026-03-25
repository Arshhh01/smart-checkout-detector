"""
/alerts routes

GET    /alerts          - list alerts (with filter options)
GET    /alerts/{id}     - single alert
PATCH  /alerts/{id}     - staff reviews an alert
DELETE /alerts/{id}     - delete alert (requires API key)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_api_key
from app.models.schemas import AlertResponse, AlertReview
from app.services.alert_service import (
    get_alerts, get_alert_by_id, review_alert, delete_alert
)

router = APIRouter()


@router.get(
    "/",
    response_model=list[AlertResponse],
    summary="List alerts",
)
async def list_alerts(
    camera_id: str | None = Query(None),
    reviewed: bool | None = Query(None, description="Filter by review status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await get_alerts(db, camera_id, reviewed, limit, offset)


@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
    summary="Get single alert",
)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch(
    "/{alert_id}/review",
    response_model=AlertResponse,
    summary="Staff reviews an alert outcome",
)
async def submit_review(
    alert_id: int,
    review: AlertReview,
    db: AsyncSession = Depends(get_db),
):
    """
    Staff marks an alert as confirmed_theft, false_positive, or unclear.
    No API key required - dashboard staff do this from the UI.
    """
    try:
        alert = await review_alert(db, alert_id, review)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.delete(
    "/{alert_id}",
    status_code=204,
    dependencies=[Depends(require_api_key)],
    summary="Delete an alert (admin only)",
)
async def remove_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await delete_alert(db, alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
