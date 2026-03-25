"""
Detection - one row per YOLO inference frame pushed from local detector.
"""

from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Raw YOLO output
    objects_detected = Column(JSON, nullable=False)
    """
    Example shape:
    [
      {"class": "person", "confidence": 0.92, "bbox": [x1, y1, x2, y2], "track_id": 1},
      {"class": "bottle", "confidence": 0.85, "bbox": [x1, y1, x2, y2], "track_id": 7}
    ]
    """

    # Zone classification result
    scan_zone_items = Column(JSON, default=list)   # track_ids in scan zone
    bag_zone_items = Column(JSON, default=list)    # track_ids in bag zone

    # Did this frame trigger a theft alert?
    is_alert = Column(Boolean, default=False, index=True)
    alert_reason = Column(String, nullable=True)   # e.g. "item in bag zone without scan"

    # Performance metrics from local detector
    inference_ms = Column(Float, nullable=True)    # YOLO inference time
    fps = Column(Float, nullable=True)             # frames per second at time of push

    # Camera / station ID (for multi-camera production)
    camera_id = Column(String, default="cam_0", index=True)
