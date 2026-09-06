from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_root():
    """
    Test GET /health returns expected status and service name.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "BharatStandards AI"


def test_health_check_api_prefix():
    """
    Test GET /api/health also returns expected status and service name.
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "BharatStandards AI"
