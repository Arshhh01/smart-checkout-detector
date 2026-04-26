# Smart Checkout Detector (SCD)

Real-time AI-powered theft detection system for retail self-checkout stations.

-> Overview

SCD uses YOLOv8 object detection with ByteTrack multi-object tracking to monitor self-checkout lanes via a standard webcam. The system detects skip-scanning — when items are placed in the bagging area without being scanned first — and surfaces severity-tiered alerts on a live web dashboard.

**Live Dashboard:** [smart-checkout-detector.vercel.app](https://smart-checkout-detector.vercel.app)  
**API Docs:** [smart-checkout-detector.onrender.com](https://smart-checkout-detector.onrender.com)

Architecture
┌─────────────────┐     HTTPS POST      ┌──────────────────┐     WebSocket      ┌─────────────────┐
│  Edge Detector   │ ──────────────────> │  FastAPI Backend  │ ────────────────> │ React Dashboard  │
│  (local_detector │     /detections/    │  (Render)         │     /ws/          │ (Vercel)         │
│   .py + YOLOv8)  │                    │  SQLite + WS      │                   │ Live monitoring  │
└─────────────────┘                     └──────────────────┘                    └─────────────────┘

-> Features

- **Real-time object detection** — YOLOv8-Nano at 14+ FPS on consumer hardware
- **Zone-based classification** — Configurable scan zone and bag zone polygons
- **Severity-tiered alerts** — Low / Medium / High based on dwell time and confidence
- **Cleared items tracking** — Items properly scanned before bagging
- **POS receipt simulation** — Pricing with tax and loss prevention metrics
- **Session summary report** — Revenue, loss prevented, and accuracy stats
- **Alert deduplication** — One escalating alert per tracked object
- **Cloud deployed** — Backend on Render, frontend on Vercel, detector on edge

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Detection | YOLOv8-Nano, ByteTrack, OpenCV |
| Backend | Python 3.12, FastAPI, SQLAlchemy, aiosqlite, WebSocket |
| Frontend | React 18, Vite, Tailwind CSS |
| Deployment | Render (backend), Vercel (frontend) |

## Quick Start

### Run the detector

```bash
pip install ultralytics opencv-python requests numpy python-dotenv
python backend/local_detector.py
```

Open the [dashboard](https://smart-checkout-detector.vercel.app) to view live detections.

### Run locally

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install && npm run dev

# Detector (separate terminal)
cd backend && source venv/bin/activate
python local_detector.py
```

## Project Structure

```
smart-checkout-detector/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database, security, WebSocket manager
│   │   ├── models/         # SQLAlchemy models, Pydantic schemas
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic
│   ├── local_detector.py   # Edge detector
│   ├── requirements.txt
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── components/     # Dashboard UI components
│   │   ├── hooks/          # useWebSocket hook
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## How It Works

1. Items pass through the **scan zone** (left) before the **bag zone** (right) → marked as **cleared**
2. Items that enter the bag zone without scanning → **theft alert** fires after dwell threshold
3. Alerts escalate from low → medium → high as dwell time and confidence increase

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /detections/ | Push detection frame (API key required) |
| GET | /alerts/ | List alerts |
| PATCH | /alerts/{id}/review | Review alert |
| GET | /stats/ | System statistics |
| GET | /health | Health check |
| WS | /ws/ | Live dashboard WebSocket |
