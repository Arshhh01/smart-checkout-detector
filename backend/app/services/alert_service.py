"""
Alert service - fetching, reviewing, and managing alerts.
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.alert import Alert
from app.models.schemas import AlertReview


async def get_alerts(
    db: AsyncSession,
    camera_id: str | None = None,
    reviewed: bool | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Alert]:
    q = select(Alert).order_by(desc(Alert.created_at))
    if camera_id:
        q = q.where(Alert.camera_id == camera_id)
    if reviewed is not None:
        q = q.where(Alert.reviewed == reviewed)
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


async def get_alert_by_id(db: AsyncSession, alert_id: int) -> Alert | None:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    return result.scalar_one_or_none()


async def review_alert(
    db: AsyncSession,
    alert_id: int,
    review: AlertReview,
) -> Alert | None:
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        return None

    valid_outcomes = {"confirmed_theft", "false_positive", "unclear"}
    if review.outcome not in valid_outcomes:
        raise ValueError(f"outcome must be one of {valid_outcomes}")

    alert.reviewed = True
    alert.review_outcome = review.outcome
    alert.reviewed_at = datetime.now(timezone.utc)
    alert.reviewed_by = review.reviewed_by
    return alert


async def delete_alert(db: AsyncSession, alert_id: int) -> bool:
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        return False
    await db.delete(alert)
    return True
