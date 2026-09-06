"""
Automated Test Suite for MongoDB Persistence Layer.
Tests:
- MongoDB client connection & mongomock fallback
- Real-time SQLAlchemy Session lifecycle hooks (insert, update, delete)
- Rollback transaction safety
- Full SQLite-to-MongoDB migration service
- MongoDB API endpoints (/health, /collections, /sync, /frontend-state)
- Admin subsystem telemetry integration
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_session_factory, Base, get_engine
from app.core.mongodb import (
    init_mongodb,
    get_mongo_db,
    ping_mongodb,
    get_all_collection_stats,
    is_mongodb_mock,
)
from app.core.mongo_sync import register_mongo_sync_listeners
from app.services.mongodb_sync import sync_all_sql_to_mongo, sync_table_to_mongo
from app.services.admin_service import admin_service
from app.models.standard import Standard, StandardStatus

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_mongodb_test_env():
    """Ensure MongoDB is initialized and listeners registered before tests."""
    init_mongodb(force_mock=True)
    register_mongo_sync_listeners()
    yield


def test_mongodb_initialization_and_mock_fallback():
    """Test that MongoDB initializes properly with mongomock fallback."""
    db = get_mongo_db()
    assert db is not None
    assert is_mongodb_mock() is True

    health = ping_mongodb()
    assert health["status"] == "connected"
    assert "mongomock" in health["mode"]
    assert health["database"] == "bharat_standards"
    assert health["error"] is None


def test_real_time_session_persistence():
    """
    Test that inserting, updating, and deleting an entity in SQLAlchemy
    automatically mirrors into MongoDB in real time.
    """
    db = get_mongo_db()
    factory = get_session_factory()
    assert factory is not None

    with factory() as session:
        # 1. Insert
        test_standard = Standard(
            standard_number="TEST-IS-99999",
            title="Automated Test Standard for MongoDB Mirroring",
            category="Testing",
            status=StandardStatus.ACTIVE.value,
            description="Testing real-time replication to MongoDB",
        )
        session.add(test_standard)
        session.commit()

        std_id = test_standard.id
        assert std_id is not None

    # Check MongoDB collection
    mongo_doc = db.standards.find_one({"_id": std_id})
    assert mongo_doc is not None
    assert mongo_doc["standard_number"] == "TEST-IS-99999"
    assert mongo_doc["title"] == "Automated Test Standard for MongoDB Mirroring"
    assert "_synced_at" in mongo_doc

    # 2. Update
    with factory() as session:
        std = session.query(Standard).filter(Standard.id == std_id).first()
        std.title = "Updated Test Standard Title"
        session.commit()

    mongo_doc_updated = db.standards.find_one({"_id": std_id})
    assert mongo_doc_updated is not None
    assert mongo_doc_updated["title"] == "Updated Test Standard Title"

    # 3. Delete
    with factory() as session:
        std = session.query(Standard).filter(Standard.id == std_id).first()
        session.delete(std)
        session.commit()

    mongo_doc_deleted = db.standards.find_one({"_id": std_id})
    assert mongo_doc_deleted is None


def test_transaction_rollback_safety():
    """Test that rolled-back transactions never commit to MongoDB."""
    db = get_mongo_db()
    factory = get_session_factory()

    with factory() as session:
        aborted_standard = Standard(
            standard_number="TEST-ROLLBACK-001",
            title="This should never be in MongoDB",
            category="Testing",
            status=StandardStatus.DRAFT.value,
        )
        session.add(aborted_standard)
        session.flush()
        # Explicit rollback
        session.rollback()

    # Verify not in MongoDB
    doc = db.standards.find_one({"standard_number": "TEST-ROLLBACK-001"})
    assert doc is None


def test_sql_to_mongo_migration_service():
    """Test full database sync populates MongoDB collections."""
    result = sync_all_sql_to_mongo()
    assert result["status"] == "success"
    assert result["total_records"] > 0
    assert result["synced_tables"] > 0

    stats = get_all_collection_stats()
    assert len(stats) > 0


def test_mongodb_health_api():
    """Test GET /api/mongodb/health."""
    response = client.get("/api/mongodb/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "connected"
    assert "collections_count" in data
    assert "total_documents" in data


def test_mongodb_collections_api():
    """Test GET /api/mongodb/collections."""
    # Ensure some data exists
    sync_all_sql_to_mongo()

    response = client.get("/api/mongodb/collections")
    assert response.status_code == 200
    data = response.json()
    assert "collections" in data
    assert data["collections_count"] > 0


def test_mongodb_collection_documents_api():
    """Test GET /api/mongodb/collections/{name}."""
    sync_all_sql_to_mongo()

    response = client.get("/api/mongodb/collections/standards?limit=10&skip=0")
    assert response.status_code == 200
    data = response.json()
    assert data["collection"] == "standards"
    assert len(data["documents"]) > 0
    assert "_id" in data["documents"][0]


def test_mongodb_sync_api():
    """Test POST /api/mongodb/sync."""
    response = client.post("/api/mongodb/sync")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_records"] > 0


def test_frontend_state_persistence_api():
    """Test GET and POST /api/mongodb/frontend-state."""
    test_payload = {
        "key": "test_user_ui_state",
        "data": {
            "theme": "light",
            "active_tab": "dashboard",
            "sidebar_collapsed": False,
            "tour_completed": True,
            "draft_eval": {"product_name": "Solar Inverter", "step": 2},
        },
    }

    # 1. Save state
    post_res = client.post("/api/mongodb/frontend-state", json=test_payload)
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert post_data["status"] == "saved"
    assert post_data["key"] == "test_user_ui_state"

    # 2. Retrieve state
    get_res = client.get("/api/mongodb/frontend-state?key=test_user_ui_state")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["exists"] is True
    assert get_data["key"] == "test_user_ui_state"
    assert get_data["data"]["theme"] == "light"
    assert get_data["data"]["draft_eval"]["product_name"] == "Solar Inverter"


def test_admin_system_health_subsystems():
    """Test that AdminService system health includes MongoDB."""
    factory = get_session_factory()
    with factory() as session:
        health = admin_service.get_system_health(session)

    assert "subsystems" in health
    assert "mongodb" in health["subsystems"]
    mongo_diag = health["subsystems"]["mongodb"]
    assert mongo_diag["status"] in ("HEALTHY", "DEGRADED")
    assert "Engine:" in mongo_diag["details"]
