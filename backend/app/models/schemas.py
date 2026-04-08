"""
Pydantic schemas for request/response validation.
These are what the API accepts and returns - separate from DB models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────
# Detection schemas
# ─────────────────────────────────────────────

class DetectedObject(BaseModel):
    """Single YOLO detection result."""
    class_name: str = Field(alias="class")
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(min_length=4, max_length=4)
    # [x1, y1, x2, y2] in pixel coords
    track_id: Optional[int] = None  # from ByteTrack/SORT

    model_config = {"populate_by_name": True}


class DetectionCreate(BaseModel):
    """Payload sent by the local detector every ~100ms."""
    timestamp: float                     # unix timestamp from local machine
    camera_id: str = "cam_0"
    objects: List[DetectedObject]
    scan_zone_items: List[int] = []      # track_ids currently in scan zone
    bag_zone_items: List[int] = []       # track_ids currently in bag zone
    is_alert: bool = False
    alert_reason: Optional[str] = None
    scanned_items: List[dict] = []       # items that were scanned before bagging (cleared)
    inference_ms: Optional[float] = None
    fps: Optional[float] = None


class DetectionResponse(BaseModel):
    id: int
    timestamp: datetime
    camera_id: str
    objects_detected: list
    scan_zone_items: list
    bag_zone_items: list
    is_alert: bool
    alert_reason: Optional[str]
    inference_ms: Optional[float]
    fps: Optional[float]

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Alert schemas
# ─────────────────────────────────────────────

class AlertCreate(BaseModel):
    camera_id: str = "cam_0"
    reason: str
    objects: List[dict] = []
    bbox: Optional[List[float]] = None
    confidence: float = 1.0


class AlertReview(BaseModel):
    """Staff reviews an alert from the dashboard."""
    outcome: str  # "confirmed_theft" | "false_positive" | "unclear"
    reviewed_by: str


class AlertResponse(BaseModel):
    id: int
    created_at: datetime
    camera_id: str
    reason: str
    objects: list
    bbox: Optional[list]
    confidence: float
    reviewed: bool
    review_outcome: Optional[str]
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Stats schema
# ─────────────────────────────────────────────

class StatsResponse(BaseModel):
    total_detections: int
    total_alerts: int
    unreviewed_alerts: int
    confirmed_thefts: int
    false_positives: int
    avg_fps: Optional[float]
    avg_inference_ms: Optional[float]
    active_ws_connections: int


# ─────────────────────────────────────────────
# WebSocket message schema
# ─────────────────────────────────────────────

class WSMessage(BaseModel):
    """Shape of every message pushed to dashboard browsers."""
    type: str   # "detection" | "alert" | "stats" | "ping"
    data: dict