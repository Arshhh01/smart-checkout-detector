"""
/ws WebSocket route

Dashboard browsers connect here to receive live detection and alert events.
The local detector does NOT connect here - it POSTs to /detections instead,
and this server then pushes those events to all connected dashboard clients.
"""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket_manager import manager
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    """
    Dashboard browser connects here.
    Receives:
      - {"type": "detection", "data": {...}}  every ~100ms
      - {"type": "alert",     "data": {...}}  when theft event fires
      - {"type": "ping",      "data": {}}     every 30s keep-alive
    """
    await manager.connect(websocket)

    # Send a welcome message with current connection count
    await manager.send_to(websocket, {
        "type": "connected",
        "data": {"active_connections": manager.connection_count}
    })

    try:
        # Run heartbeat ping alongside receiving (to keep connection alive)
        await _handle_connection(websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Dashboard client disconnected cleanly")
    except Exception as e:
        manager.disconnect(websocket)
        logger.warning(f"WebSocket error: {e}")


async def _handle_connection(websocket: WebSocket):
    """Keep connection alive with pings; receive any client messages."""
    ping_task = asyncio.create_task(_heartbeat(websocket))
    try:
        while True:
            # Receive any messages from dashboard (e.g. acknowledge an alert)
            data = await websocket.receive_text()
            logger.debug(f"Received from dashboard: {data}")
            # Future: handle dashboard → server commands here
    finally:
        ping_task.cancel()


async def _heartbeat(websocket: WebSocket):
    """Send ping every N seconds to prevent Render/Railway from closing idle connections."""
    while True:
        await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL)
        try:
            await websocket.send_json({"type": "ping", "data": {}})
        except Exception:
            break
