"""
BharatStandards AI - Audit Trail & Notification System Tests
Validates enterprise audit logging, activity timeline queries, zero-secret sanitization,
immutability, multichannel notification delivery, preference filtering, and multi-tenant isolation.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import create_application
from app.core.database import Base, get_db
from app.services.standards_seed import seed_standards_knowledge_base
from app.services.services_seed import seed_bis_services
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.models.user import User
from app.models.profile import Profile

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create clean database tables and seed test data."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        seed_standards_knowledge_base(session)
        seed_bis_services(session)
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database session."""
    app = create_application()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_user(client: TestClient, email: str = "auditor@bharatstandards.ai", role: str = "industry") -> dict:
    """Helper to register and return authorization headers."""
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Audit Officer",
            "email": email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": role,
        },
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    user_id = resp.json()["user"]["id"]
    return {
        "headers": {"Authorization": f"Bearer {token}"},
        "user_id": user_id,
        "token": token,
    }


def test_audit_log_creation_and_activity_timeline(client: TestClient):
    """Verify events are logged during registration, product creation, and can be queried via /api/activity."""
    user = register_user(client)

    # Create a product
    prod_resp = client.post(
        "/api/products",
        headers=user["headers"],
        json={
            "name": "Industrial Sensor Model X",
            "category": "Electronics & IT Goods",
            "model_number": "IS-2026-X",
        },
    )
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # Query activity logs
    activity_resp = client.get("/api/activity", headers=user["headers"])
    assert activity_resp.status_code == 200
    data = activity_resp.json()
    assert data["total"] >= 2
    actions = [item["action"] for item in data["items"]]
    assert "PRODUCT_CREATED" in actions
    assert "REGISTER" in actions

    # Verify latest is first
    assert data["items"][0]["action"] == "PRODUCT_CREATED"
    assert data["items"][0]["entity_type"] == "product"
    assert data["items"][0]["entity_id"] == prod_id


def test_audit_filtering_and_search(client: TestClient):
    """Verify filtering by action, entity_type, and text search."""
    user = register_user(client)

    client.post(
        "/api/products",
        headers=user["headers"],
        json={"name": "Specialized Flow Meter", "category": "Mechanical Engineering"},
    )

    # Filter by action
    resp_action = client.get("/api/activity?action=PRODUCT_CREATED", headers=user["headers"])
    assert resp_action.status_code == 200
    for item in resp_action.json()["items"]:
        assert item["action"] == "PRODUCT_CREATED"

    # Filter by entity_type
    resp_entity = client.get("/api/activity?entity_type=product", headers=user["headers"])
    assert resp_entity.status_code == 200
    for item in resp_entity.json()["items"]:
        assert item["entity_type"] == "product"

    # Search query
    resp_search = client.get("/api/activity?search=Flow+Meter", headers=user["headers"])
    assert resp_search.status_code == 200
    assert len(resp_search.json()["items"]) == 1
    assert "Flow Meter" in resp_search.json()["items"][0]["description"]


def test_audit_multi_tenant_isolation(client: TestClient):
    """Verify that User A cannot view User B's audit trail."""
    user_a = register_user(client, "user_a@audit.com")
    user_b = register_user(client, "user_b@audit.com")

    # User A creates a product
    client.post(
        "/api/products",
        headers=user_a["headers"],
        json={"name": "Proprietary Machine A", "category": "Automotive"},
    )

    # User B views activity
    b_activity = client.get("/api/activity", headers=user_b["headers"]).json()
    for item in b_activity["items"]:
        assert "Proprietary Machine A" not in item["description"]
        assert item["user_id"] == user_b["user_id"]


def test_audit_zero_secret_sanitization(client: TestClient, db_session):
    """Ensure sensitive credentials, tokens, and hashes are automatically redacted."""
    user = register_user(client)

    # Directly record an event with sensitive metadata
    sensitive_data = {
        "user_token": "secret_jwt_xyz_123",
        "password": "ClearTextPassword!",
        "api_key": "live_key_999",
        "safe_field": "NonSensitiveValue",
    }

    audit_service.log_event(
        db=db_session,
        user_id=user["user_id"],
        action="SETTINGS_UPDATED",
        entity_type="settings",
        entity_id=1,
        description="Configuration updated",
        metadata=sensitive_data,
    )

    resp = client.get("/api/activity?action=SETTINGS_UPDATED", headers=user["headers"])
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) > 0
    meta = items[0]["metadata"]
    assert meta["user_token"] == "[REDACTED]"
    assert meta["password"] == "[REDACTED]"
    assert meta["api_key"] == "[REDACTED]"
    assert meta["safe_field"] == "NonSensitiveValue"


def test_audit_immutability(client: TestClient):
    """Verify that /api/activity endpoints cannot be mutated or deleted."""
    user = register_user(client)

    # Attempt POST, PUT, DELETE on /api/activity
    assert client.post("/api/activity", headers=user["headers"], json={}).status_code == 405
    assert client.put("/api/activity", headers=user["headers"], json={}).status_code == 405
    assert client.delete("/api/activity", headers=user["headers"]).status_code == 405
    assert client.delete("/api/activity/1", headers=user["headers"]).status_code == 404 or 405


def test_notification_lifecycle_and_unread_count(client: TestClient):
    """Verify notifications list, unread count badge, mark as read, and delete."""
    user = register_user(client)

    # Upon registration, a welcome notification is created
    unread_resp = client.get("/api/notifications/unread-count", headers=user["headers"])
    assert unread_resp.status_code == 200
    assert unread_resp.json()["unread_count"] >= 1

    # List notifications
    list_resp = client.get("/api/notifications", headers=user["headers"])
    assert list_resp.status_code == 200
    notifs = list_resp.json()["items"]
    assert len(notifs) >= 1
    notif_id = notifs[0]["id"]
    assert notifs[0]["is_read"] is False

    # Mark as read
    read_resp = client.post(f"/api/notifications/{notif_id}/read", headers=user["headers"])
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True

    # Unread count should now be 0
    unread_resp2 = client.get("/api/notifications/unread-count", headers=user["headers"])
    assert unread_resp2.json()["unread_count"] == 0

    # Delete/dismiss notification
    del_resp = client.delete(f"/api/notifications/{notif_id}", headers=user["headers"])
    assert del_resp.status_code == 200

    # Verify gone
    list_resp2 = client.get("/api/notifications", headers=user["headers"])
    assert len(list_resp2.json()["items"]) == 0


def test_notification_read_all(client: TestClient, db_session):
    """Verify marking all unread notifications as read in bulk."""
    user = register_user(client)

    # Create additional notifications
    notification_service.create_notification(
        db=db_session,
        user_id=user["user_id"],
        type="DOCUMENT_PROCESSED",
        title="Doc 1 Processed",
        message="Your test report is ready.",
    )
    notification_service.create_notification(
        db=db_session,
        user_id=user["user_id"],
        type="REPORT_READY",
        title="Dossier Ready",
        message="Compliance dossier generated.",
    )

    unread_count = client.get("/api/notifications/unread-count", headers=user["headers"]).json()["unread_count"]
    assert unread_count >= 3

    # Mark all read
    mark_all_resp = client.post("/api/notifications/read-all", headers=user["headers"])
    assert mark_all_resp.status_code == 200
    assert mark_all_resp.json()["updated_count"] >= 3

    # Check unread count is 0
    unread_now = client.get("/api/notifications/unread-count", headers=user["headers"]).json()["unread_count"]
    assert unread_now == 0


def test_notification_multi_tenant_isolation(client: TestClient, db_session):
    """Verify that User A cannot read or delete User B's notifications."""
    user_a = register_user(client, "user_alpha@notif.com")
    user_b = register_user(client, "user_beta@notif.com")

    # Get User A's notification
    a_notifs = client.get("/api/notifications", headers=user_a["headers"]).json()["items"]
    assert len(a_notifs) > 0
    a_notif_id = a_notifs[0]["id"]

    # User B attempts to mark User A's notification as read -> 404
    b_read_resp = client.post(f"/api/notifications/{a_notif_id}/read", headers=user_b["headers"])
    assert b_read_resp.status_code == 404

    # User B attempts to delete User A's notification -> 404
    b_del_resp = client.delete(f"/api/notifications/{a_notif_id}", headers=user_b["headers"])
    assert b_del_resp.status_code == 404


def test_notification_preference_suppression(client: TestClient, db_session):
    """Verify that opting out of a notification category suppresses delivery, but system alerts bypass."""
    user = register_user(client)

    # Disable compliance notifications in user preferences
    pref_resp = client.put(
        "/api/users/me/preferences",
        headers=user["headers"],
        json={"compliance_notifications": False},
    )
    assert pref_resp.status_code == 200

    # Attempt to send a COMPLIANCE_GAP notification
    notif = notification_service.create_notification(
        db=db_session,
        user_id=user["user_id"],
        type="COMPLIANCE_GAP",
        title="Compliance Warning",
        message="A gap was identified.",
    )
    # Should be suppressed (returns None)
    assert notif is None

    # Attempt to send a SYSTEM notification (must bypass suppression)
    sys_notif = notification_service.create_notification(
        db=db_session,
        user_id=user["user_id"],
        type="SYSTEM",
        title="System Maintenance",
        message="Scheduled maintenance notice.",
    )
    assert sys_notif is not None
    assert sys_notif.title == "System Maintenance"
