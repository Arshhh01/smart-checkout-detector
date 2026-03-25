# Smart Checkout Detector - Backend

## Project Structure

```
backend/
├── main.py                     # FastAPI app entry point
├── local_detector.py           # Runs on laptop with webcam
├── requirements.txt            # Server (Render/Railway)
├── requirements_local.txt      # Local detector (laptop)
├── .env.example                # Copy to .env
└── app/
    ├── core/
    │   ├── config.py           # Settings from env vars
    │   ├── database.py         # Async SQLAlchemy setup
    │   ├── security.py         # API key auth
    │   └── websocket_manager.py # WS broadcast manager
    ├── models/
    │   ├── detection.py        # Detection DB model
    │   ├── alert.py            # Alert DB model
    │   └── schemas.py          # Pydantic request/response schemas
    ├── routes/
    │   ├── detections.py       # POST (from detector), GET (history)
    │   ├── alerts.py           # List, review, delete alerts
    │   ├── stats.py            # Aggregated metrics
    │   ├── websocket.py        # Dashboard live feed
    │   └── health.py           # Health check
    └── services/
        ├── detection_service.py # Save detections, create alerts, broadcast
        └── alert_service.py    # Alert CRUD + review logic
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | — | Health check |
| POST | /detections/ | API Key | Push detection frame from laptop |
| GET | /detections/ | — | List detection history |
| GET | /detections/{id} | — | Single detection |
| GET | /alerts/ | — | List alerts (filter by reviewed/camera) |
| GET | /alerts/{id} | — | Single alert |
| PATCH | /alerts/{id}/review | — | Staff review outcome |
| DELETE | /alerts/{id} | API Key | Delete alert |
| GET | /stats/ | — | Aggregated metrics |
| WS | /ws/ | — | Live detection stream for dashboard |

## Setup

### 1. Server (Render/Railway)

```bash
cp .env.example .env
# Edit .env - set API_KEY and ALLOWED_ORIGINS

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Deploy to Render:
1. Push to GitHub
2. New Web Service → connect repo
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env vars from .env in Render dashboard

### 2. Local Detector (your laptop)

```bash
pip install -r requirements_local.txt

# Edit local_detector.py - set CLOUD_API_URL and API_KEY
python local_detector.py
```

YOLOv8n model (~6MB) downloads automatically on first run.

### 3. Adjust Zone Coordinates

Run with `SHOW_PREVIEW=True`, hover over the frame to get pixel coordinates,
then update `SCAN_ZONE` and `BAG_ZONE` in `local_detector.py`.

## How Theft Detection Works

1. **YOLO** detects objects + assigns confidence scores each frame
2. **ByteTrack** gives each object a persistent `track_id` across frames
3. **Zone logic** checks if object centroid is inside SCAN_ZONE or BAG_ZONE
   - Uses ray-casting point-in-polygon algorithm
4. **Theft logic**: if an item appears in BAG_ZONE but was never seen in SCAN_ZONE → alert
5. **Cooldown**: 5-second window prevents duplicate alerts for the same event
6. **Alert** is saved to DB and broadcast via WebSocket to all dashboard browsers
