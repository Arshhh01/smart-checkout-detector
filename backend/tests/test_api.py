"""
Basic API tests - run with: pytest tests/
"""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_push_detection_requires_api_key():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/detections/", json={
            "timestamp": 1234567890.0,
            "objects": [],
        })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_push_detection_with_key():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/detections/",
            json={
                "timestamp": 1234567890.0,
                "camera_id": "cam_0",
                "objects": [
                    {"class": "person", "confidence": 0.91, "bbox": [10, 20, 100, 200]}
                ],
                "scan_zone_items": [],
                "bag_zone_items": [],
                "is_alert": False,
            },
            headers={"X-API-Key": "test-api-key-12345"},
        )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_list_alerts_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/alerts/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
