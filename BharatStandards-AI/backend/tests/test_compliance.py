"""
Tests for Compliance Engine: check execution, evidence matching,
weight-based scoring (78%), gap identification, and ownership isolation.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_application
from app.core.database import Base, get_db
from app.models.user import User
from app.models.product import Product
from app.models.standard import Standard
from app.services.standards_seed import seed_standards_knowledge_base

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create clean database tables and seed synthetic standards."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        seed_standards_knowledge_base(session)
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


@pytest.fixture
def auth_headers(client, db_session):
    """Register and authenticate test industry user."""
    client.post("/api/auth/register", json={
        "name": "Compliance Engineer",
        "email": "compliance_user@voltassystems.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry"
    })
    res = client.post("/api/auth/login", json={
        "email": "compliance_user@voltassystems.in",
        "password": "Password123!"
    })
    token = res.json()["access_token"]
    user = db_session.query(User).filter(User.email == "compliance_user@voltassystems.in").first()
    return {"Authorization": f"Bearer {token}"}, user


@pytest.fixture
def other_user_headers(client, db_session):
    """Register second user for cross-tenant isolation tests."""
    client.post("/api/auth/register", json={
        "name": "Other Engineer",
        "email": "other_user@havells.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry"
    })
    res = client.post("/api/auth/login", json={
        "email": "other_user@havells.in",
        "password": "Password123!"
    })
    token = res.json()["access_token"]
    user = db_session.query(User).filter(User.email == "other_user@havells.in").first()
    return {"Authorization": f"Bearer {token}"}, user


@pytest.fixture
def demo_product(db_session, auth_headers):
    """Create demo Electric Water Heater product for test user."""
    _, user = auth_headers
    prod = Product(
        user_id=user.id,
        name="Electric Storage Water Heater 25L",
        category="Electrical Appliances",
        description="Electric 25 Litres stationary storage water heater rated at 2000W, 230V AC.",
        model_number="EWH-25L-PRIME",
        manufacturer="Voltas Systems Pvt Ltd",
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)
    return prod


def test_run_compliance_check_success(client, db_session, auth_headers, demo_product):
    """Verify running compliance check against DEMO-IS-001 yields exact 78% score and 15/3/2 breakdown."""
    headers, _ = auth_headers
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()
    assert std is not None

    res = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["product_id"] == demo_product.id
    assert data["standard_id"] == std.id
    assert data["total_requirements"] == 20
    assert data["passed_count"] == 15
    assert data["partial_count"] == 3
    assert data["missing_count"] == 2
    assert data["score"] == 78.0
    assert data["status"] == "COMPLETED"
    assert "Weighted points formula" in data["scoring_methodology"]


def test_compliance_results_and_traceability(client, db_session, auth_headers, demo_product):
    """Verify clause results include traceable evidence, snippets, confidence and reasons."""
    headers, _ = auth_headers
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()

    create_res = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers,
    )
    report_id = create_res.json()["id"]

    res = client.get(f"/api/compliance/{report_id}/results", headers=headers)
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 20

    # Inspect PASS results
    pass_results = [r for r in results if r["status"] == "PASS"]
    assert len(pass_results) == 15
    for r in pass_results:
        assert r["confidence"] in ("HIGH", "MEDIUM")
        assert len(r["reason"]) > 0
        assert len(r["recommended_action"]) > 0

    # Inspect a MISSING result
    missing_results = [r for r in results if r["status"] == "MISSING"]
    assert len(missing_results) == 2
    assert any("11.4" in r["requirement"]["clause"] for r in missing_results)
    assert any("19.1" in r["requirement"]["clause"] for r in missing_results)


def test_compliance_gaps_generation(client, db_session, auth_headers, demo_product):
    """Verify gap register items are generated for non-PASS requirements with priorities."""
    headers, _ = auth_headers
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()

    create_res = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers,
    )
    report_id = create_res.json()["id"]

    res = client.get(f"/api/compliance/{report_id}/gaps", headers=headers)
    assert res.status_code == 200
    gaps = res.json()
    # 3 PARTIAL + 2 MISSING = 5 Gaps
    assert len(gaps) == 5

    priorities = [g["priority"] for g in gaps]
    assert "CRITICAL" in priorities
    assert "HIGH" in priorities
    assert "MEDIUM" in priorities


def test_compliance_summary(client, db_session, auth_headers, demo_product):
    """Verify executive summary metrics."""
    headers, _ = auth_headers
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()

    create_res = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers,
    )
    report_id = create_res.json()["id"]

    res = client.get(f"/api/compliance/{report_id}/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["score"] == 78.0
    assert summary["total_gaps"] == 5
    assert summary["critical_gaps"] == 1
    assert summary["high_gaps"] == 1
    assert summary["medium_gaps"] == 3


def test_compliance_history_and_latest(client, db_session, auth_headers, demo_product):
    """Verify listing report history and fetching latest report for a product."""
    headers, _ = auth_headers
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()

    # Trigger check
    client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers,
    )

    # List all user reports
    list_res = client.get("/api/compliance", headers=headers)
    assert list_res.status_code == 200
    reports = list_res.json()
    assert len(reports) >= 1

    # Get latest for product
    latest_res = client.get(f"/api/compliance/product/{demo_product.id}/latest", headers=headers)
    assert latest_res.status_code == 200
    assert latest_res.json() is not None
    assert latest_res.json()["product_id"] == demo_product.id


def test_compliance_ownership_isolation(client, db_session, auth_headers, other_user_headers, demo_product):
    """Verify User B cannot access User A's compliance report (returns 404)."""
    headers_a, _ = auth_headers
    headers_b, _ = other_user_headers
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()

    create_res = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers_a,
    )
    report_id = create_res.json()["id"]

    # User B tries to access User A's report
    res_b = client.get(f"/api/compliance/{report_id}", headers=headers_b)
    assert res_b.status_code == 404

    # User B tries to access results
    res_b_results = client.get(f"/api/compliance/{report_id}/results", headers=headers_b)
    assert res_b_results.status_code == 404

    # User B tries to trigger check on User A's product
    res_b_check = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": std.id},
        headers=headers_b,
    )
    assert res_b_check.status_code == 404


def test_unauthenticated_compliance_fails(client, demo_product):
    """Verify unauthenticated requests fail with 401."""
    res = client.get("/api/compliance")
    assert res.status_code == 401

    res = client.post("/api/compliance/check", json={"product_id": 1, "standard_id": 1})
    assert res.status_code == 401


def test_compliance_non_existent_product_fails(client, auth_headers, db_session):
    """Verify 404 when product does not exist."""
    headers, _ = auth_headers
    std = db_session.query(Standard).first()
    res = client.post(
        "/api/compliance/check",
        json={"product_id": 999999, "standard_id": std.id},
        headers=headers,
    )
    assert res.status_code == 404


def test_compliance_non_existent_standard_fails(client, auth_headers, demo_product):
    """Verify 404 when standard does not exist."""
    headers, _ = auth_headers
    res = client.post(
        "/api/compliance/check",
        json={"product_id": demo_product.id, "standard_id": 999999},
        headers=headers,
    )
    assert res.status_code == 404


def test_compliance_no_documents_non_demo_product(client, auth_headers, db_session):
    """Verify 400 when non-demo product has no uploaded documents."""
    headers, user = auth_headers
    prod = Product(
        user_id=user.id,
        name="Custom LED Industrial Lighting",
        category="Lighting",
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)

    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-002").first()

    res = client.post(
        "/api/compliance/check",
        json={"product_id": prod.id, "standard_id": std.id},
        headers=headers,
    )
    assert res.status_code == 400
    assert "No supporting documents" in res.json()["detail"]
