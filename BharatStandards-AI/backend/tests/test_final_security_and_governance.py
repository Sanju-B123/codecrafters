"""
BharatStandards AI - Comprehensive Security, Multi-Tenant Isolation & Knowledge Governance Tests
Validates:
1. Security response headers (OWASP recommended security headers)
2. Strict multi-tenant data isolation (User A vs User B for products and documents)
3. Role-based access control (RBAC): Admin APIs forbidden (403) for non-admin users
4. Knowledge Governance APIs: Records listing, provenance tracking, approval, rejection, archiving, and re-indexing
5. Unified Global Search tenant isolation: private records shielded, public standards accessible
6. Synthetic Demo Dataset integrity: Idempotent seeder verification of demo accounts, products, and compliance dossiers
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
from app.services.admin_seed import seed_admin_and_knowledge
from app.services.demo_seed import seed_demo_dataset
from app.models.user import User
from app.models.product import Product
from app.models.standard import Standard, Requirement
from app.models.document import Document
from app.models.compliance import ComplianceReport
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create clean database tables and seed baseline data."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        seed_standards_knowledge_base(session)
        seed_bis_services(session)
        seed_admin_and_knowledge(session)
        seed_demo_dataset(session)
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


def register_user(client: TestClient, email: str, name: str = "Test User") -> dict:
    """Helper to register and obtain auth headers."""
    resp = client.post(
        "/api/auth/register",
        json={
            "name": name,
            "email": email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "company_name": "Test Company",
            "sector": "consumer_electronics",
        },
    )
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def login_user(client: TestClient, email: str, password: str = "Password123!") -> dict:
    """Helper to login and obtain auth headers."""
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestSecurityResponseHeaders:
    """Validate that OWASP security response headers are applied to HTTP responses."""

    def test_security_headers_present(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        headers = resp.headers

        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert "1; mode=block" in headers.get("X-XSS-Protection", "")
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


class TestMultiTenantIsolation:
    """Validate strict tenant boundaries between User A and User B."""

    def test_product_tenant_isolation(self, client):
        headers_a = register_user(client, "user_a@tenant.in", "User A")
        headers_b = register_user(client, "user_b@tenant.in", "User B")

        # User A creates a product
        create_resp = client.post(
            "/api/products",
            headers=headers_a,
            json={
                "name": "User A Private Water Heater",
                "category": "Appliances",
                "model_number": "UA-WH-01",
                "description": "Confidential product specifications for User A",
            },
        )
        assert create_resp.status_code == 201
        product_a_id = create_resp.json()["id"]

        # User A can access it
        get_a = client.get(f"/api/products/{product_a_id}", headers=headers_a)
        assert get_a.status_code == 200
        assert get_a.json()["name"] == "User A Private Water Heater"

        # User B cannot access User A's product (404 Not Found)
        get_b = client.get(f"/api/products/{product_a_id}", headers=headers_b)
        assert get_b.status_code == 404

        # User B cannot update User A's product
        update_b = client.put(
            f"/api/products/{product_a_id}",
            headers=headers_b,
            json={"name": "Tampered Name"},
        )
        assert update_b.status_code == 404

        # User B cannot delete User A's product
        delete_b = client.delete(f"/api/products/{product_a_id}", headers=headers_b)
        assert delete_b.status_code == 404

    def test_document_tenant_isolation(self, client, db_session):
        headers_a = register_user(client, "doc_user_a@tenant.in", "Doc User A")
        headers_b = register_user(client, "doc_user_b@tenant.in", "Doc User B")

        # Query user A from db to get user_id
        user_a = db_session.query(User).filter_by(email="doc_user_a@tenant.in").first()
        doc_a = Document(
            user_id=user_a.id,
            filename="confidential_test_report.pdf",
            original_filename="confidential_test_report.pdf",
            storage_path="/uploads/test.pdf",
            file_size=1024,
            file_type="PDF",
            mime_type="application/pdf",
            status="PROCESSED",
        )
        db_session.add(doc_a)
        db_session.commit()
        db_session.refresh(doc_a)

        # User A can access the document
        resp_a = client.get(f"/api/documents/{doc_a.id}", headers=headers_a)
        assert resp_a.status_code == 200

        # User B cannot access User A's document
        resp_b = client.get(f"/api/documents/{doc_a.id}", headers=headers_b)
        assert resp_b.status_code == 404

        # User B cannot delete User A's document
        del_b = client.delete(f"/api/documents/{doc_a.id}", headers=headers_b)
        assert del_b.status_code == 404


class TestRoleBasedAccessControl:
    """Validate that administrative endpoints strictly enforce ADMIN role."""

    def test_regular_user_forbidden_from_admin_endpoints(self, client):
        headers_user = register_user(client, "regular_officer@industry.in", "Regular Officer")

        # Admin metrics
        assert client.get("/api/admin/metrics", headers=headers_user).status_code == 403

        # Admin users list
        assert client.get("/api/admin/users", headers=headers_user).status_code == 403

        # Admin audit logs
        assert client.get("/api/admin/audit", headers=headers_user).status_code == 403

        # Admin knowledge records
        assert client.get("/api/admin/knowledge/records", headers=headers_user).status_code == 403

        # Admin knowledge sources
        assert client.get("/api/admin/knowledge/sources", headers=headers_user).status_code == 403

        # Admin reindex
        assert client.post("/api/admin/knowledge/reindex-all", headers=headers_user).status_code == 403

    def test_admin_authorized_for_governance_and_audit(self, client, db_session):
        # Create an admin user
        admin = User(
            email="admin_test@bharatstandards.ai",
            password_hash=get_password_hash("Admin123!"),
            name="BIS Administrator",
            role="ADMIN",
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()

        headers_admin = login_user(client, "admin_test@bharatstandards.ai", "Admin123!")

        # 1. Metrics Overview
        resp_ov = client.get("/api/admin/metrics", headers=headers_admin)
        assert resp_ov.status_code == 200
        assert "totals" in resp_ov.json()
        assert resp_ov.json()["totals"]["users"] >= 1

        # 2. Audit stream
        resp_audit = client.get("/api/admin/audit?limit=10", headers=headers_admin)
        assert resp_audit.status_code == 200
        assert "items" in resp_audit.json()

        # 3. Knowledge records list
        resp_records = client.get("/api/admin/knowledge/records", headers=headers_admin)
        assert resp_records.status_code == 200
        data = resp_records.json()
        assert "items" in data
        assert data["total"] > 0

        # 4. Knowledge sources list
        resp_sources = client.get("/api/admin/knowledge/sources", headers=headers_admin)
        assert resp_sources.status_code == 200
        assert len(resp_sources.json()) > 0

        # 5. Approve record action
        std = db_session.query(Standard).first()
        assert std is not None
        resp_app = client.post(f"/api/admin/knowledge/standard/{std.id}/approve", headers=headers_admin)
        assert resp_app.status_code == 200
        assert resp_app.json()["new_status"] == "ACTIVE"

        # 6. Reject record action with notes
        resp_rej = client.post(
            f"/api/admin/knowledge/standard/{std.id}/reject?reason=Needs+review",
            headers=headers_admin,
        )
        assert resp_rej.status_code == 200
        assert resp_rej.json()["new_status"] == "REJECTED"

        # 7. Re-index entity action
        resp_reindex = client.post(f"/api/admin/knowledge/standard/{std.id}/reindex", headers=headers_admin)
        assert resp_reindex.status_code == 200
        assert resp_reindex.json()["success"] is True
        assert resp_reindex.json()["new_status"] == "INDEXED"

        # 8. Re-index all
        resp_all = client.post("/api/admin/knowledge/reindex-all", headers=headers_admin)
        assert resp_all.status_code == 200
        assert resp_all.json()["success"] is True


class TestGlobalSearchIsolation:
    """Validate unified global search tenant scoping."""

    def test_search_tenant_isolation(self, client):
        headers_a = register_user(client, "search_user_a@tenant.in", "User A")
        headers_b = register_user(client, "search_user_b@tenant.in", "User B")

        # User A creates a product
        client.post(
            "/api/products",
            headers=headers_a,
            json={
                "name": "Solar Geyser Tank 50L",
                "category": "Solar",
                "model_number": "SOL-50L",
                "description": "High efficiency solar water heating system",
            },
        )

        # User B creates a product
        client.post(
            "/api/products",
            headers=headers_b,
            json={
                "name": "Industrial Steam Boiler",
                "category": "Boilers",
                "model_number": "BLR-900",
                "description": "Commercial pressurized steam generator",
            },
        )

        # User A searches for "Solar" -> finds "Solar Geyser Tank 50L"
        resp_a = client.get("/api/search?q=Solar", headers=headers_a)
        assert resp_a.status_code == 200
        data_a = resp_a.json()
        assert any(p["title"] == "Solar Geyser Tank 50L" for p in data_a["products"])

        # User B searches for "Solar" -> DOES NOT see User A's product
        resp_b = client.get("/api/search?q=Solar", headers=headers_b)
        assert resp_b.status_code == 200
        data_b = resp_b.json()
        assert not any(p["title"] == "Solar Geyser Tank 50L" for p in data_b["products"])

        # Both User A and User B can find public Indian Standards
        std_search_a = client.get("/api/search?q=Water", headers=headers_a)
        assert std_search_a.status_code == 200
        assert len(std_search_a.json()["standards"]) > 0

        std_search_b = client.get("/api/search?q=Water", headers=headers_b)
        assert std_search_b.status_code == 200
        assert len(std_search_b.json()["standards"]) > 0


class TestSyntheticDemoDatasetIntegrity:
    """Validate the presence, structure, and idempotency of the demo dataset."""

    def test_demo_dataset_seeded_properly(self, client, db_session):
        # 1. Demo User exists
        demo_user = db_session.query(User).filter_by(email="demo@bharatstandards.ai").first()
        assert demo_user is not None
        assert demo_user.role == "industry"

        # 2. Demo User can authenticate
        headers = login_user(client, "demo@bharatstandards.ai", "DemoUser123!")
        assert "Authorization" in headers

        # 3. Demo Product exists
        demo_prod = db_session.query(Product).filter_by(user_id=demo_user.id).first()
        assert demo_prod is not None
        assert "Domestic Electric Water Heater" in demo_prod.name
        assert demo_prod.model_number == "DEWH-25L-2026"

        # 4. Benchmark Standard exists with 20 clauses
        benchmark_std = db_session.query(Standard).filter_by(standard_number="DEMO-IS-001").first()
        assert benchmark_std is not None
        reqs = db_session.query(Requirement).filter_by(standard_id=benchmark_std.id).all()
        assert len(reqs) == 20

        # 5. Synthetic evidence documents exist
        docs = db_session.query(Document).filter_by(user_id=demo_user.id, product_id=demo_prod.id).all()
        assert len(docs) == 2
        filenames = [d.original_filename for d in docs]
        assert any("NABL" in f for f in filenames)
        assert any("Manual" in f for f in filenames)

        # 6. Compliance dossier exists
        comp = db_session.query(ComplianceReport).filter_by(user_id=demo_user.id, product_id=demo_prod.id).first()
        assert comp is not None
        assert comp.score == 78.0
        assert comp.overall_risk_score == 39.0
        assert comp.risk_level == "MEDIUM"

        # 7. Idempotency check: seeding again does not create duplicate users or products
        count_users_before = db_session.query(User).count()
        count_products_before = db_session.query(Product).count()

        seed_demo_dataset(db_session)

        assert db_session.query(User).count() == count_users_before
        assert db_session.query(Product).count() == count_products_before
