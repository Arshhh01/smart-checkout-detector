"""
Pytest configuration and shared fixtures.
Run tests with: pytest tests/ -v
"""

import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("API_KEY", "test-api-key-12345")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:5173"]')

from main import app
from app.core.database import init_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    await init_db()
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"X-API-Key": os.environ["API_KEY"]}
    ) as ac:
        yield ac


@pytest.fixture
def sample_detection_payload():
    return {
        "frame_id": 1,
        "timestamp": 1700000000.0,
        "fps": 28.5,
        "objects": [
            {
                "track_id": 1,
                "class_name": "bottle",
                "confidence": 0.92,
                "bbox": [100, 150, 200, 300],
                "zone": "scan_zone"
            }
        ],
        "is_alert": False,
        "alert_reason": None
    }


@pytest.fixture
def sample_alert_payload():
    return {
        "frame_id": 42,
        "timestamp": 1700000010.0,
        "fps": 27.1,
        "objects": [
            {
                "track_id": 5,
                "class_name": "cup",
                "confidence": 0.88,
                "bbox": [350, 200, 450, 350],
                "zone": "bag_zone"
            }
        ],
        "is_alert": True,
        "alert_reason": "Item in bag zone without scan"
    }
