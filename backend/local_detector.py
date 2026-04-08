import cv2
import time
import requests
import numpy as np
from ultralytics import YOLO
import os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("API_KEY", "change-me")
CLOUD_API_URL = "https://smart-checkout-detector.onrender.com/detections/"
CAMERA_ID = "cam_0"
CAMERA_INDEX = 0          # 0 = default webcam
PUSH_EVERY_N_FRAMES = 1   # push every frame for faster cleared item detection
SHOW_PREVIEW = True       # set False for headless server mode
CONFIDENCE_THRESHOLD = 0.35  # lowered to detect more objects

# Only detect product-like objects — ignore people, furniture, background
ALLOWED_CLASSES = {
    "bottle", "cup", "bowl", "book", "cell phone", "laptop",
    "mouse", "keyboard", "scissors", "toothbrush", "hair drier",
    "apple", "orange", "banana", "sandwich", "cake", "donut",
    "wine glass", "fork", "knife", "spoon", "can", "backpack",
    "handbag", "suitcase", "umbrella",
}

# Dwell requirement — object must stay in bag zone for this many frames
# before triggering an alert (prevents single-frame false positives)
BAG_DWELL_REQUIRED = 3

# How many frames an object stays "remembered" as scanned after leaving
# the scan zone — prevents track ID flicker from breaking scan→bag flow
SCAN_MEMORY_TTL = 45  # ~1.5 seconds at 30fps

# Zone polygons - pixel coordinates on your camera frame
# Adjust by running with SHOW_PREVIEW=True and noting coords
# Format: np.array([[x1,y1],[x2,y2],[x3,y3],[x4,y4]])
SCAN_ZONE = np.array([[45, 120], [870, 120], [870, 975], [45, 975]])
BAG_ZONE  = np.array([[930, 120], [1875, 120], [1875, 975], [930, 975]])


def point_in_polygon(point: tuple, polygon: np.ndarray) -> bool: #zone logic starts here
    """
    Ray casting algorithm - O(n) point-in-polygon test.
    Returns True if (x, y) is inside the polygon.
    """
    x, y = point
    n = len(polygon)
    inside = False
    px, py = polygon[0]
    for i in range(1, n + 1):
        cx, cy = polygon[i % n]
        if ((cy > y) != (py > y)) and (x < (px - cx) * (y - cy) / (py - cy) + cx):
            inside = not inside
        px, py = cx, cy
    return inside


def get_centroid(bbox: list) -> tuple:
    """Get center point of bounding box [x1, y1, x2, y2]."""
    return ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)


def classify_zones(tracked_objects: list) -> tuple[list, list]:
    """
    Returns (scan_zone_ids, bag_zone_ids) - lists of track_ids in each zone.
    Only considers objects whose class is in ALLOWED_CLASSES.
    """
    scan_ids, bag_ids = [], []
    for obj in tracked_objects:
        centroid = get_centroid(obj["bbox"])
        if point_in_polygon(centroid, SCAN_ZONE):
            scan_ids.append(obj["track_id"])
        if point_in_polygon(centroid, BAG_ZONE):
            bag_ids.append(obj["track_id"])
    return scan_ids, bag_ids


# Track which IDs have been seen in the scan zone (memory across frames)
# Now uses a dict: track_id → last_frame_seen_in_scan for TTL expiry
seen_in_scan: dict = {}  # {track_id: frame_number}

# Track how many consecutive frames each suspicious ID has been in the bag zone
bag_zone_dwell: dict = {}

# Global frame counter for TTL tracking
_frame_counter = 0


def check_for_theft(
    scan_ids: list,
    bag_ids: list,
    tracked_objects: list,
) -> tuple[bool, str | None, list]:
    """
    Core theft logic:
    An item is suspicious if it appears in the bag zone
    but was NEVER seen in the scan zone first,
    AND has dwelled in the bag zone for BAG_DWELL_REQUIRED frames.

    Returns (is_alert, reason_string, scanned_items_list)
    scanned_items_list = objects that were properly scanned before bagging
    """
    global seen_in_scan, bag_zone_dwell, _frame_counter
    _frame_counter += 1

    # Update scan zone memory with TTL timestamp
    for tid in scan_ids:
        seen_in_scan[tid] = _frame_counter

    # Expire old scan memories beyond TTL
    expired = [tid for tid, frame in seen_in_scan.items()
               if _frame_counter - frame > SCAN_MEMORY_TTL]
    for tid in expired:
        del seen_in_scan[tid]

    # Helper to check if a track ID was scanned (exists in TTL dict)
    def was_scanned(tid):
        return tid in seen_in_scan

    # Update dwell counts for objects in bag zone that were never scanned
    for tid in bag_ids:
        if not was_scanned(tid):
            bag_zone_dwell[tid] = bag_zone_dwell.get(tid, 0) + 1
        else:
            # Was scanned — remove from dwell tracking
            bag_zone_dwell.pop(tid, None)

    # Clean up dwell counts for objects no longer in bag zone
    current_bag_set = set(bag_ids)
    stale_ids = [tid for tid in bag_zone_dwell if tid not in current_bag_set]
    for tid in stale_ids:
        bag_zone_dwell.pop(tid, None)

    # Only alert if object has dwelled long enough (avoids single-frame false positives)
    suspicious_ids = [
        tid for tid in bag_ids
        if not was_scanned(tid) and bag_zone_dwell.get(tid, 0) >= BAG_DWELL_REQUIRED
    ]

    # Build list of properly scanned items — in bag zone OR still in scan zone
    cleared_ids_in_bag = [tid for tid in bag_ids if was_scanned(tid)]
    scanned_items = [
        {"class": obj["class"], "track_id": obj["track_id"],
         "confidence": obj["confidence"]}
        for obj in tracked_objects
        if obj.get("track_id") in cleared_ids_in_bag
        or obj.get("track_id") in scan_ids
    ]

    if suspicious_ids:
        suspicious_classes = [
            obj["class"] for obj in tracked_objects
            if obj.get("track_id") in suspicious_ids
        ]
        reason = f"item_in_bag_without_scan: {', '.join(set(suspicious_classes))}"
        return True, reason, scanned_items

    return False, None, scanned_items


def draw_frame(frame, tracked_objects, scan_ids, bag_ids, is_alert, fps): #visuals
    """Draw zones, bounding boxes, and stats onto the preview frame."""
    out = frame.copy()

    # Draw zones
    cv2.polylines(out, [SCAN_ZONE], True, (0, 255, 0), 2)   # green = scan
    cv2.polylines(out, [BAG_ZONE],  True, (0, 0, 255), 2)   # blue  = bag
    cv2.putText(out, "SCAN", tuple(SCAN_ZONE[0]), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
    cv2.putText(out, "BAG",  tuple(BAG_ZONE[0]),  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)

    # Draw detections
    for obj in tracked_objects:
        x1, y1, x2, y2 = [int(v) for v in obj["bbox"]]
        tid = obj.get("track_id", "?")
        dwell = bag_zone_dwell.get(tid, 0)
        label = f"{obj['class']} #{tid} {obj['confidence']:.0%}"
        if dwell > 0:
            label += f" [{dwell}/{BAG_DWELL_REQUIRED}]"
        color = (0, 255, 255) if tid in bag_ids else (255, 255, 255)
        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
        cv2.putText(out, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    # Alert banner
    if is_alert:
        cv2.rectangle(out, (0, 0), (out.shape[1], 40), (0, 0, 200), -1)
        cv2.putText(out, "THEFT ALERT", (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255,255,255), 2)

    cv2.putText(out, f"FPS: {fps:.1f}", (10, out.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    return out


def push_to_cloud(payload: dict): #cloud push logic
    """Non-blocking HTTP POST - failures are logged but don't crash the detector."""
    try:
        resp = requests.post(
            CLOUD_API_URL,
            json=payload,
            headers={"X-API-Key": API_KEY},
            timeout=2,
        )
        if resp.status_code not in (200, 201):
            print(f"[WARN] API returned {resp.status_code}: {resp.text[:100]}")
    except requests.exceptions.Timeout:
        print("[WARN] Cloud push timed out - check your internet or API URL")
    except requests.exceptions.ConnectionError:
        print("[WARN] Could not connect to cloud API")


# ─────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────

def main():
    print("Loading YOLOv8-Nano model...")
    model = YOLO("yolov8n.pt")  # downloads automatically on first run (~6MB)

    print(f"Opening camera {CAMERA_INDEX}...")
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open camera {CAMERA_INDEX}")

    frame_count = 0
    fps = 0.0
    t_fps = time.time()

    print("Running. Press Q in preview window to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Failed to read frame - camera disconnected?")
            break

        t_start = time.time()

        # ── YOLO inference + ByteTrack ──────────────────────────
        # persist=True enables ByteTrack across frames
        results = model.track(frame, persist=True, conf=CONFIDENCE_THRESHOLD, verbose=False)
        result = results[0]
        inference_ms = result.speed.get("inference", 0)

        # Parse detections — filter to allowed classes only
        tracked_objects = []
        if result.boxes is not None:
            for box in result.boxes:
                class_name = model.names[int(box.cls[0])]
                if class_name not in ALLOWED_CLASSES:
                    continue  # skip background/irrelevant objects
                track_id = int(box.id[0]) if box.id is not None else None
                tracked_objects.append({
                    "class": class_name,
                    "confidence": float(box.conf[0]),
                    "bbox": box.xyxy[0].tolist(),
                    "track_id": track_id,
                })

        # ── Zone classification ──────────────────────────────────
        scan_ids, bag_ids = classify_zones(tracked_objects)

        # ── Theft detection ──────────────────────────────────────
        is_alert, alert_reason, scanned_items = check_for_theft(scan_ids, bag_ids, tracked_objects)

        # ── FPS calculation ──────────────────────────────────────
        frame_count += 1
        if frame_count % 30 == 0:
            fps = 30 / (time.time() - t_fps)
            t_fps = time.time()

        # ── Push to cloud every N frames ─────────────────────────
        if frame_count % PUSH_EVERY_N_FRAMES == 0:
            payload = {
                "timestamp": time.time(),
                "camera_id": CAMERA_ID,
                "objects": [
                    {"class": o["class"], "confidence": o["confidence"],
                     "bbox": o["bbox"], "track_id": o["track_id"]}
                    for o in tracked_objects
                ],
                "scan_zone_items": scan_ids,
                "bag_zone_items": bag_ids,
                "is_alert": is_alert,
                "alert_reason": alert_reason,
                "scanned_items": scanned_items,
                "inference_ms": inference_ms,
                "fps": fps,
            }
            push_to_cloud(payload)

        # ── Preview window ───────────────────────────────────────
        if SHOW_PREVIEW:
            preview = draw_frame(frame, tracked_objects, scan_ids, bag_ids, is_alert, fps)
            cv2.imshow("Smart Checkout Detector", preview)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    if SHOW_PREVIEW:
        cv2.destroyAllWindows()
    print("Detector stopped.")


if __name__ == "__main__":
    main()