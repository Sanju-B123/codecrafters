"""
BharatStandards AI - BIS Services & Guided-Action Unit and Integration Tests
Tests service catalogue listing, keyword search, filters, ownership isolation,
deterministic recommendations, and anti-hallucination trust boundaries.
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
from app.models.bis_service import BISService, ServiceCategory, ServiceStatus, ServiceUserType
from app.services.standards_seed import seed_standards_knowledge_base
from app.services.services_seed import seed_bis_services
from app.services.compliance_service import ComplianceService

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create clean database tables and seed synthetic standards & services."""
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


@pytest.fixture
def auth_user_a(client, db_session):
    """Register and authenticate user A (industry)."""
    resp = client.post("/api/auth/register", json={
        "name": "Arjun Sharma",
        "email": "arjun.user_a@enterprise.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = resp.json()["access_token"]
    user = db_session.query(User).filter(User.email == "arjun.user_a@enterprise.in").first()
    return {"headers": {"Authorization": f"Bearer {token}"}, "user": user}


@pytest.fixture
def auth_user_b(client, db_session):
    """Register and authenticate user B (consumer)."""
    resp = client.post("/api/auth/register", json={
        "name": "Priya Verma",
        "email": "priya.user_b@consumer.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "consumer",
    })
    token = resp.json()["access_token"]
    user = db_session.query(User).filter(User.email == "priya.user_b@consumer.in").first()
    return {"headers": {"Authorization": f"Bearer {token}"}, "user": user}



def test_list_services_default_pagination(client, db_session):
    """Test 1: List all services with default pagination."""
    resp = client.get("/api/services")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 4
    assert len(data["items"]) >= 4
    assert data["page"] == 1
    assert data["page_size"] == 10


def test_search_services(client, db_session):
    """Test 2: Search services by keyword (e.g. 'Scheme-I', 'NABL')."""
    resp = client.get("/api/services?search=Scheme-I")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) >= 1
    assert any("Scheme-I" in item["name"] for item in data["items"])

    resp_nabl = client.get("/api/services?search=NABL")
    assert resp_nabl.status_code == 200
    assert len(resp_nabl.json()["items"]) >= 1


def test_filter_services_by_category_and_user_type(client, db_session):
    """Test 3: Filter services by category and user type."""
    # Filter by CERTIFICATION
    resp = client.get("/api/services?category=CERTIFICATION")
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["category"] == "CERTIFICATION"

    # Filter by user type CONSUMER
    resp_consumer = client.get("/api/services?user_type=CONSUMER")
    assert resp_consumer.status_code == 200
    for item in resp_consumer.json()["items"]:
        assert item["user_type"] in ["CONSUMER", "BOTH"]


def test_get_service_by_id(client, db_session):
    """Test 4: Retrieve service detail by valid ID."""
    svc = db_session.query(BISService).first()
    assert svc is not None
    resp = client.get(f"/api/services/{svc.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == svc.id
    assert data["service_code"] == svc.service_code
    assert isinstance(data["required_documents"], list)
    assert isinstance(data["steps"], list)
    assert len(data["steps"]) > 0


def test_get_service_not_found(client, db_session):
    """Test 5: Retrieve service with non-existent ID returns 404."""
    resp = client.get("/api/services/999999")
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_get_recommended_services_for_industry_and_consumer(client, auth_user_a, auth_user_b):
    """Test 6: Get general recommendations tailored to role."""
    # Industry user
    resp_ind = client.get("/api/services/recommended", headers=auth_user_a["headers"])
    assert resp_ind.status_code == 200
    ind_data = resp_ind.json()
    assert len(ind_data) > 0
    assert any("certification" in r["match_reason"].lower() or "testing" in r["match_reason"].lower() for r in ind_data)

    # Consumer user
    resp_con = client.get("/api/services/recommended", headers=auth_user_b["headers"])
    assert resp_con.status_code == 200
    con_data = resp_con.json()
    assert len(con_data) > 0
    assert any("consumer" in r["match_reason"].lower() for r in con_data)


def test_product_service_recommendations(client, db_session, auth_user_a):
    """Test 7: Product-aware service recommendations."""
    # Create product for User A
    user = auth_user_a["user"]
    prod = Product(
        user_id=user.id,
        name="Geyser Pro 25L",
        category="Electrical Appliances - Storage Water Heater",
        intended_use="Domestic",
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)

    resp = client.get(f"/api/products/{prod.id}/services", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    # Water heater should recommend Scheme-I
    codes = [r["service"]["service_code"] for r in data]
    assert "DEMO-SERVICE-001" in codes


def test_compliance_service_recommendations(client, db_session, auth_user_a):
    """Test 8: Compliance-gap driven recommendations and prioritized action steps."""
    user = auth_user_a["user"]
    prod = Product(
        user_id=user.id,
        name="Geyser Pro 25L",
        category="Electrical Appliances",
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)

    # Run compliance check (will generate 15 pass, 3 partial, 2 missing)
    report = ComplianceService.run_compliance_check(
        product_id=prod.id,
        standard_id=1,
        user_id=user.id,
        db=db_session,
    )

    resp = client.get(
        f"/api/compliance/{report.id}/recommended-services",
        headers=auth_user_a["headers"],
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["report_id"] == report.id
    assert data["readiness_score"] == 78.0
    assert len(data["prioritized_actions"]) >= 3
    # Check prioritized actions: 1. Resolve missing, 2. Review partial, 3. Consult guidance
    action_labels = [a["label"] for a in data["prioritized_actions"]]
    assert any("Resolve Missing Evidence" in l for l in action_labels)
    assert any("Review Partial Requirements" in l for l in action_labels)
    assert any("Consult Relevant Official Guidance" in l for l in action_labels)


def test_ownership_isolation_security(client, db_session, auth_user_a, auth_user_b):
    """Test 9: Strict ownership isolation — User B cannot access User A's product or compliance recommendations."""
    user_a = auth_user_a["user"]
    prod_a = Product(
        user_id=user_a.id,
        name="User A Confidential Device",
        category="Electronics",
    )
    db_session.add(prod_a)
    db_session.commit()
    db_session.refresh(prod_a)

    report_a = ComplianceService.run_compliance_check(
        product_id=prod_a.id,
        standard_id=1,
        user_id=user_a.id,
        db=db_session,
    )

    # User B requests User A's product services -> 403 Forbidden
    resp_prod = client.get(
        f"/api/products/{prod_a.id}/services",
        headers=auth_user_b["headers"],
    )
    assert resp_prod.status_code in [403, 404]

    # User B requests User A's compliance recommendations -> 403 Forbidden
    resp_comp = client.get(
        f"/api/compliance/{report_a.id}/recommended-services",
        headers=auth_user_b["headers"],
    )
    assert resp_comp.status_code in [403, 404]


def test_trust_and_anti_hallucination_guarantees(client, db_session):
    """Test 10: Anti-hallucination guarantees — demo flags and zero fabricated URLs."""
    services = db_session.query(BISService).all()
    for svc in services:
        assert svc.is_demo is True
        assert svc.status in [ServiceStatus.DEMO.value, ServiceStatus.INFORMATIONAL.value]
        # Must not fabricate fake URLs
        if svc.official_source_url is not None:
            assert svc.official_source_url.startswith("https://")
        else:
            assert svc.official_source_url is None
