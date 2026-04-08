"""
Detection service - handles saving detections and creating alerts.
Separates business logic from route handlers.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.models.detection import Detection
from app.models.alert import Alert
from app.models.schemas import DetectionCreate, AlertCreate
from app.core.config import settings
from app.core.websocket_manager import manager

logger = logging.getLogger(__name__)


async def save_detection(db: AsyncSession, payload: DetectionCreate) -> Detection:
    """
    Persist detection frame to DB.
    If is_alert=True, also create an Alert row and broadcast to dashboard.
    """
    # Filter out low-confidence detections before saving
    filtered_objects = [
        obj.model_dump(by_alias=True)
        for obj in payload.objects
        if obj.confidence >= settings.CONFIDENCE_THRESHOLD
    ]

    detection = Detection(
        camera_id=payload.camera_id,
        objects_detected=filtered_objects,
        scan_zone_items=payload.scan_zone_items,
        bag_zone_items=payload.bag_zone_items,
        is_alert=payload.is_alert,
        alert_reason=payload.alert_reason,
        inference_ms=payload.inference_ms,
        fps=payload.fps,
    )
    db.add(detection)
    await db.flush()  # get the ID without committing yet

    # If this frame flagged an alert, create the Alert record too
    if payload.is_alert and payload.alert_reason:
        # Cooldown check: don't create duplicate alert if one was just fired
        recent_alert = await _get_recent_alert(db, payload.camera_id)
        if not recent_alert:
            alert = await _create_alert_from_detection(db, payload, filtered_objects)
            # Broadcast alert event to all dashboard browsers
            await manager.broadcast({
                "type": "alert",
                "data": {
                    "id": alert.id,
                    "camera_id": alert.camera_id,
                    "reason": alert.reason,
                    "alert_reason": alert.reason,       # ← frontend reads this key
                    "objects": alert.objects,
                    "confidence": alert.confidence,
                    "bbox": alert.bbox,
                    "is_alert": True,
                    "created_at": alert.created_at.isoformat(),
                }
            })

    # Broadcast the detection frame (for live video overlay on dashboard)
    await manager.broadcast({
        "type": "detection",
        "data": {
            "camera_id": payload.camera_id,
            "objects": filtered_objects,
            "scan_zone_items": payload.scan_zone_items,
            "bag_zone_items": payload.bag_zone_items,
            "is_alert": payload.is_alert,
            "alert_reason": payload.alert_reason,
            "scanned_items": payload.scanned_items,
            "fps": payload.fps,
            "timestamp": payload.timestamp,
        }
    })

    return detection


async def _get_recent_alert(db: AsyncSession, camera_id: str) -> Alert | None:
    """Check if an alert was fired recently (cooldown window)."""
    from sqlalchemy import text
    cutoff = f"datetime('now', '-{settings.ALERT_COOLDOWN_SECONDS} seconds')"
    result = await db.execute(
        select(Alert)
        .where(Alert.camera_id == camera_id)
        .where(Alert.created_at >= text(cutoff))
        .order_by(desc(Alert.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _create_alert_from_detection(
    db: AsyncSession,
    payload: DetectionCreate,
    filtered_objects: list,
) -> Alert:
    """Create and persist an Alert from a flagged detection."""
    # Suspicious objects = those in bag zone without having been scanned
    suspicious = [
        obj for obj in filtered_objects
        if obj.get("track_id") in payload.bag_zone_items
        and obj.get("track_id") not in payload.scan_zone_items
    ]
    avg_confidence = (
        sum(o["confidence"] for o in suspicious) / len(suspicious)
        if suspicious else 1.0
    )

    # Get the bounding box of the first suspicious object for the alert record
    alert_bbox = None
    if suspicious:
        alert_bbox = suspicious[0].get("bbox")

    alert = Alert(
        camera_id=payload.camera_id,
        reason=payload.alert_reason,
        objects=suspicious or filtered_objects,
        bbox=alert_bbox,
        confidence=round(avg_confidence, 3),
    )
    db.add(alert)
    await db.flush()
    return alert


async def get_detections(
    db: AsyncSession,
    camera_id: str | None = None,
    alerts_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[Detection]:
    q = select(Detection).order_by(desc(Detection.timestamp))
    if camera_id:
        q = q.where(Detection.camera_id == camera_id)
    if alerts_only:
        q = q.where(Detection.is_alert == True)  # noqa
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


async def get_stats(db: AsyncSession) -> dict:
    total_detections = (await db.execute(select(func.count(Detection.id)))).scalar()
    total_alerts = (await db.execute(select(func.count(Alert.id)))).scalar()
    unreviewed = (await db.execute(
        select(func.count(Alert.id)).where(Alert.reviewed == False)  # noqa
    )).scalar()
    confirmed = (await db.execute(
        select(func.count(Alert.id)).where(Alert.review_outcome == "confirmed_theft")
    )).scalar()
    false_pos = (await db.execute(
        select(func.count(Alert.id)).where(Alert.review_outcome == "false_positive")
    )).scalar()
    avg_fps = (await db.execute(select(func.avg(Detection.fps)))).scalar()
    avg_ms = (await db.execute(select(func.avg(Detection.inference_ms)))).scalar()

    return {
        "total_detections": total_detections or 0,
        "total_alerts": total_alerts or 0,
        "unreviewed_alerts": unreviewed or 0,
        "confirmed_thefts": confirmed or 0,
        "false_positives": false_pos or 0,
        "avg_fps": round(avg_fps, 1) if avg_fps else None,
        "avg_inference_ms": round(avg_ms, 1) if avg_ms else None,
        "active_ws_connections": manager.connection_count,
    }