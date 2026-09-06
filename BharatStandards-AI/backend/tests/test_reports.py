"""
BharatStandards AI - Compliance Reports & PDF Export Tests
Validates report generation, single-source-of-truth score consistency (78%),
ReportLab vector PDF generation, multi-tenant security isolation, and statutory disclaimers.
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
from app.models.report import Report
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
        "name": "Dev Sharma",
        "email": "dev.user_a@enterprise.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = resp.json()["access_token"]
    user = db_session.query(User).filter(User.email == "dev.user_a@enterprise.in").first()
    return {"headers": {"Authorization": f"Bearer {token}"}, "user": user}


@pytest.fixture
def auth_user_b(client, db_session):
    """Register and authenticate user B (consumer/other)."""
    resp = client.post("/api/auth/register", json={
        "name": "Rohit Verma",
        "email": "rohit.user_b@consumer.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "consumer",
    })
    token = resp.json()["access_token"]
    user = db_session.query(User).filter(User.email == "rohit.user_b@consumer.in").first()
    return {"headers": {"Authorization": f"Bearer {token}"}, "user": user}


@pytest.fixture
def user_a_compliance_report(db_session, auth_user_a):
    """Set up product and run compliance assessment for User A."""
    user = auth_user_a["user"]
    prod = Product(
        user_id=user.id,
        name="Electric Storage Water Heater 25L",
        category="Electrical Appliances",
        manufacturer="Bharat Appliances Ltd",
        model_number="EWH-25L-2026",
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)

    report = ComplianceService.run_compliance_check(
        product_id=prod.id,
        standard_id=1,
        user_id=user.id,
        db=db_session,
    )
    return report


def test_generate_report_success(client, auth_user_a, user_a_compliance_report):
    """Test 1: Generate a report from an existing compliance assessment."""
    comp = user_a_compliance_report
    resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp.id},
        headers=auth_user_a["headers"],
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["compliance_report_id"] == comp.id
    assert data["report_number"].startswith("BSA-2026-")
    assert data["status"] == "COMPLETED"
    assert data["readiness_score"] == 78.0
    assert data["passed_count"] == 15
    assert data["partial_count"] == 3
    assert data["missing_count"] == 2
    assert "Important: This report is an AI-assisted compliance readiness assessment" in data["disclaimer"]


def test_score_and_count_consistency_with_compliance_engine(client, auth_user_a, user_a_compliance_report):
    """Test 2: Verify report scores match the compliance engine with 100% consistency."""
    comp = user_a_compliance_report
    resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp.id},
        headers=auth_user_a["headers"],
    )
    data = resp.json()

    # Single source of truth verification
    assert data["readiness_score"] == comp.score
    assert data["passed_count"] == comp.passed_count
    assert data["partial_count"] == comp.partial_count
    assert data["missing_count"] == comp.missing_count
    assert data["total_requirements"] == comp.total_requirements
    assert len(data["assessments"]) == comp.total_requirements
    assert len(data["gaps"]) == len(comp.gaps)


def test_get_report_details(client, auth_user_a, user_a_compliance_report):
    """Test 3: Fetch full structured report dossier by ID."""
    comp = user_a_compliance_report
    gen_resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp.id},
        headers=auth_user_a["headers"],
    )
    report_id = gen_resp.json()["id"]

    resp = client.get(f"/api/reports/{report_id}", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == report_id
    assert data["product"]["name"] == "Electric Storage Water Heater 25L"
    assert data["standard"]["standard_number"] == "DEMO-IS-001"
    assert len(data["action_plan"]) >= 1
    assert len(data["sources"]) >= 1
    assert len(data["history"]) >= 1


def test_list_user_reports(client, auth_user_a, user_a_compliance_report):
    """Test 4: List all reports belonging to the authenticated user."""
    comp = user_a_compliance_report
    client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp.id},
        headers=auth_user_a["headers"],
    )

    resp = client.get("/api/reports", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert items[0]["report_number"].startswith("BSA-2026-")
    assert items[0]["readiness_score"] == 78.0


def test_download_pdf_report(client, auth_user_a, user_a_compliance_report):
    """Test 5: Download PDF export and verify binary PDF headers."""
    comp = user_a_compliance_report
    gen_resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp.id},
        headers=auth_user_a["headers"],
    )
    report_id = gen_resp.json()["id"]

    resp = client.get(f"/api/reports/{report_id}/download", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "attachment; filename=\"BSA-2026-" in resp.headers["content-disposition"]
    # Verify standard PDF magic header bytes
    assert resp.content.startswith(b"%PDF-")
    # Verify non-trivial PDF size (> 5 KB)
    assert len(resp.content) > 5000


def test_ownership_isolation_security(client, auth_user_a, auth_user_b, user_a_compliance_report):
    """Test 6: User B cannot access, download, or delete User A's report."""
    comp_a = user_a_compliance_report
    gen_resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp_a.id},
        headers=auth_user_a["headers"],
    )
    report_id = gen_resp.json()["id"]

    # User B tries to view User A's report
    resp_get = client.get(f"/api/reports/{report_id}", headers=auth_user_b["headers"])
    assert resp_get.status_code in [403, 404]

    # User B tries to download User A's PDF
    resp_dl = client.get(f"/api/reports/{report_id}/download", headers=auth_user_b["headers"])
    assert resp_dl.status_code in [403, 404]

    # User B tries to delete User A's report
    resp_del = client.delete(f"/api/reports/{report_id}", headers=auth_user_b["headers"])
    assert resp_del.status_code in [403, 404]


def test_delete_report(client, auth_user_a, user_a_compliance_report):
    """Test 7: Permanently delete report."""
    comp = user_a_compliance_report
    gen_resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": comp.id},
        headers=auth_user_a["headers"],
    )
    report_id = gen_resp.json()["id"]

    del_resp = client.delete(f"/api/reports/{report_id}", headers=auth_user_a["headers"])
    assert del_resp.status_code == 200
    assert "deleted successfully" in del_resp.json()["message"]

    # Subsequent retrieval must 404
    get_resp = client.get(f"/api/reports/{report_id}", headers=auth_user_a["headers"])
    assert get_resp.status_code == 404


def test_generate_report_non_existent_compliance_id(client, auth_user_a):
    """Test 8: 404 error when generating report for non-existent assessment."""
    resp = client.post(
        "/api/reports/generate",
        json={"compliance_report_id": 999999},
        headers=auth_user_a["headers"],
    )
    assert resp.status_code == 404


def test_compliance_route_alias_get_or_generate_report(client, auth_user_a, user_a_compliance_report):
    """Test 9: GET /api/compliance/{id}/report auto-generates or returns report."""
    comp = user_a_compliance_report
    resp = client.get(f"/api/compliance/{comp.id}/report", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["compliance_report_id"] == comp.id
    assert data["report_number"].startswith("BSA-2026-")
