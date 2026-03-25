"""
WebSocket connection manager.
Maintains a list of connected dashboard browsers and broadcasts
detection/alert events to all of them in real time.
"""

import asyncio
import json
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send a message to all connected dashboard clients."""
        if not self.active_connections:
            return
        data = json.dumps(message)
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        # Clean up broken connections
        for ws in dead:
            self.disconnect(ws)

    async def send_to(self, websocket: WebSocket, message: dict):
        """Send to a single client (e.g. on connect, send current stats)."""
        await websocket.send_text(json.dumps(message))

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Singleton - imported by routes
manager = ConnectionManager()
