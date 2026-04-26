

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Float
from sqlalchemy.sql import func
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    camera_id = Column(String, default="cam_0", index=True)

    # What triggered the alert
    reason = Column(String, nullable=False)
    # e.g. "item_in_bag_without_scan", "confidence_threshold_exceeded"

    # Object(s) involved
    objects = Column(JSON, default=list)
    # [{"class": "bottle", "track_id": 7, "confidence": 0.85}]

    # Bounding box of the suspicious area at alert time
    bbox = Column(JSON, nullable=True)  # [x1, y1, x2, y2]

    # Confidence of the alert (0-1)
    confidence = Column(Float, nullable=False, default=1.0)

    # Reviewed by staff?
    reviewed = Column(Boolean, default=False, index=True)
    review_outcome = Column(String, nullable=True)
    # "confirmed_theft" | "false_positive" | "unclear"

    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String, nullable=True)  # staff name
