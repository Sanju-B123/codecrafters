import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_application
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile
from app.models.standard import Standard, Requirement
from app.models.knowledge import KnowledgeSource, KnowledgeIndex
from app.models.audit_log import AuditLog

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
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
def normal_user_headers(client, db_session):
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Normal Citizen",
            "email": "normal@bharatstandards.in",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "industry",
        },
    )
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user_headers(client, db_session):
    # Create an admin user directly in DB
    admin = User(
        name="Lead Administrator",
        email="admin@bharatstandards.ai",
        password_hash=get_password_hash("Admin@123456"),
        role=UserRole.ADMIN.value,
        status=UserStatus.ACTIVE.value,
        is_active=True,
    )
    db_session.add(admin)
    db_session.flush()

    profile = Profile(
        user_id=admin.id,
        organization="BharatStandards Admin Directorate",
        designation="Lead Systems Auditor",
    )
    db_session.add(profile)
    db_session.commit()

    login = client.post(
        "/api/auth/login",
        json={
            "email": "admin@bharatstandards.ai",
            "password": "Admin@123456",
        },
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# 1. Access Control Tests
def test_unauthenticated_admin_access_rejected(client):
    res = client.get("/api/admin/metrics")
    assert res.status_code == 401


def test_normal_user_denied_admin_metrics(client, normal_user_headers):
    res = client.get("/api/admin/metrics", headers=normal_user_headers)
    assert res.status_code == 403
    assert "administrative privileges required" in res.json()["detail"].lower()


def test_normal_user_denied_admin_health(client, normal_user_headers):
    res = client.get("/api/admin/health", headers=normal_user_headers)
    assert res.status_code == 403


def test_normal_user_denied_user_list(client, normal_user_headers):
    res = client.get("/api/admin/users", headers=normal_user_headers)
    assert res.status_code == 403


def test_public_registration_cannot_elevate_to_admin(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Sneaky Hacker",
            "email": "hacker@test.in",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "ADMIN",
        },
    )
    assert res.status_code == 422
    assert "administrative role cannot be requested" in str(res.json()).lower()


# 2. Metrics & Health Diagnostics
def test_admin_metrics_success(client, admin_user_headers):
    res = client.get("/api/admin/metrics", headers=admin_user_headers)
    assert res.status_code == 200
    data = res.json()
    assert "totals" in data
    assert "recent_7d" in data
    assert "daily_velocity" in data
    assert data["totals"]["admins"] >= 1
    assert len(data["daily_velocity"]) == 7


def test_admin_health_diagnostics_safe(client, admin_user_headers):
    res = client.get("/api/admin/health", headers=admin_user_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_status"] in ["HEALTHY", "DEGRADED", "UNAVAILABLE"]
    assert "database" in data["subsystems"]
    assert "api_gateway" in data["subsystems"]
    assert "ai_reasoning_engine" in data["subsystems"]
    # Ensure no secrets leaked
    raw_str = str(data)
    assert "sk-" not in raw_str
    assert "password" not in raw_str.lower()


# 3. User Governance & Suspensions
def test_admin_list_users(client, admin_user_headers, normal_user_headers):
    res = client.get("/api/admin/users", headers=admin_user_headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 2
    emails = [u["email"] for u in users]
    assert "admin@bharatstandards.ai" in emails
    assert "normal@bharatstandards.in" in emails


def test_admin_suspend_user_and_block_login(client, admin_user_headers, normal_user_headers, db_session):
    # Find normal user id
    user = db_session.query(User).filter(User.email == "normal@bharatstandards.in").first()
    assert user is not None

    # Suspend user
    patch_res = client.patch(
        f"/api/admin/users/{user.id}",
        json={"status": "SUSPENDED"},
        headers=admin_user_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "SUSPENDED"

    # Suspended user's existing token is rejected
    me_res = client.get("/api/users/me", headers=normal_user_headers)
    assert me_res.status_code == 403
    assert "suspended" in me_res.json()["detail"].lower()

    # Suspended user cannot log in
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "normal@bharatstandards.in",
            "password": "Password123!",
        },
    )
    assert login_res.status_code == 403
    assert "suspended" in login_res.json()["detail"].lower()


def test_cannot_demote_or_suspend_last_admin(client, admin_user_headers, db_session):
    admin = db_session.query(User).filter(User.email == "admin@bharatstandards.ai").first()
    assert admin is not None

    # Try to suspend the sole admin
    res = client.patch(
        f"/api/admin/users/{admin.id}",
        json={"status": "SUSPENDED"},
        headers=admin_user_headers,
    )
    assert res.status_code == 400
    assert "last active administrator" in res.json()["detail"].lower()

    # Try to demote the sole admin
    res2 = client.patch(
        f"/api/admin/users/{admin.id}",
        json={"role": "industry"},
        headers=admin_user_headers,
    )
    assert res2.status_code == 400
    assert "last active administrator" in res2.json()["detail"].lower()


# 4. Standards CRUD & Knowledge Indexing
def test_admin_standard_lifecycle(client, admin_user_headers, db_session):
    # 1. Create standard
    create_payload = {
        "standard_number": "IS 99999:2026",
        "title": "Safety Requirements for Intelligent Power Converters",
        "category": "Electronics & Power Systems",
        "description": "Comprehensive specification for power inverter insulation, ground leakage, and thermal shutdown safety.",
        "version": "2026",
        "status": "ACTIVE",
        "source": "Bureau of Indian Standards Official Gazette",
        "is_demo": False,
    }
    create_res = client.post("/api/admin/standards", json=create_payload, headers=admin_user_headers)
    assert create_res.status_code == 201
    std_data = create_res.json()
    std_id = std_data["id"]
    assert std_data["standard_number"] == "IS 99999:2026"
    assert std_data["index_status"] == "INDEXED"

    # 2. Add Requirement Clause
    req_payload = {
        "clause": "4.2",
        "title": "Insulation Resistance and Dielectric Strength",
        "description": "The insulation resistance between primary circuitry and chassis ground shall be not less than 50 Megaohms when tested at 500V DC.",
        "category": "SAFETY",
        "priority": "CRITICAL",
        "evidence_types": ["test_report", "schematic"],
        "verification_method": "500V DC Megohmmeter testing for 60 seconds",
        "weight": 3.0,
    }
    clause_res = client.post(
        f"/api/admin/standards/{std_id}/requirements",
        json=req_payload,
        headers=admin_user_headers,
    )
    assert clause_res.status_code == 201
    clause_data = clause_res.json()
    assert clause_data["clause"] == "4.2"
    assert clause_data["priority"] == "CRITICAL"

    # 3. View detail with quality score and clauses
    detail_res = client.get(f"/api/admin/standards/{std_id}", headers=admin_user_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["quality_score"] > 0
    assert len(detail_data["requirements"]) == 1
    assert "breakdown" in detail_data or "quality_breakdown" in detail_data

    # 4. Trigger manual index sync
    sync_res = client.post(f"/api/admin/standards/{std_id}/index", headers=admin_user_headers)
    assert sync_res.status_code == 200
    assert sync_res.json()["index_status"] == "INDEXED"

    # 5. Archive standard (non-destructive)
    archive_res = client.delete(f"/api/admin/standards/{std_id}", headers=admin_user_headers)
    assert archive_res.status_code == 200
    assert "archived" in archive_res.json()["message"].lower()

    # 6. Check that it is archived
    check_res = client.get(f"/api/admin/standards/{std_id}", headers=admin_user_headers)
    assert check_res.status_code == 200
    assert check_res.json()["status"] == "ARCHIVED"


    # 7. Update clause
    clause_id = clause_data["id"]
    patch_clause = client.patch(
        f"/api/admin/requirements/{clause_id}",
        json={"priority": "HIGH", "weight": 2.5},
        headers=admin_user_headers,
    )
    assert patch_clause.status_code == 200
    assert patch_clause.json()["priority"] == "HIGH"
    assert patch_clause.json()["weight"] == 2.5

    # 8. Delete clause
    del_clause = client.delete(f"/api/admin/requirements/{clause_id}", headers=admin_user_headers)
    assert del_clause.status_code == 200
    assert "deleted" in del_clause.json()["message"].lower()

    # 9. Hard delete standard
    hard_del = client.delete(f"/api/admin/standards/{std_id}?hard=true", headers=admin_user_headers)
    assert hard_del.status_code == 200
    assert "permanently deleted" in hard_del.json()["message"].lower()

    # Verify standard no longer exists
    not_found = client.get(f"/api/admin/standards/{std_id}", headers=admin_user_headers)
    assert not_found.status_code == 404


def test_admin_documents_listing(client, admin_user_headers):
    res = client.get("/api/admin/documents", headers=admin_user_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)



# 5. Knowledge Sources & BIS Services
def test_admin_knowledge_source_and_service(client, admin_user_headers):
    # Knowledge source creation
    ks_res = client.post(
        "/api/admin/knowledge-sources",
        json={
            "source_type": "OFFICIAL",
            "name": "Manakonline Conformity Portal",
            "url": "https://www.manakonline.in",
            "description": "Direct BIS certification registration portal",
            "authority_level": "HIGH",
            "is_verified": True,
        },
        headers=admin_user_headers,
    )
    assert ks_res.status_code == 201
    assert ks_res.json()["authority_level"] == "HIGH"

    # List knowledge sources
    list_ks = client.get("/api/admin/knowledge-sources", headers=admin_user_headers)
    assert list_ks.status_code == 200
    assert len(list_ks.json()) >= 1

    # BIS Service creation
    svc_res = client.post(
        "/api/admin/bis-services",
        json={
            "service_code": "TEST_ISI_01",
            "title": "Domestic ISI Mark Scheme 1",
            "description": "Product certification scheme for domestic manufacturers under BIS Act 2016.",
            "category": "CERTIFICATION",
            "user_type": "INDUSTRY",
            "status": "ACTIVE",
            "action_type": "ONLINE_PORTAL",
            "portal_name": "Manakonline",
        },
        headers=admin_user_headers,
    )
    assert svc_res.status_code == 201
    svc_id = svc_res.json()["id"]

    # Delete BIS Service
    del_res = client.delete(f"/api/admin/bis-services/{svc_id}", headers=admin_user_headers)
    assert del_res.status_code == 200


# 6. Audit Trail for Admin Actions
def test_admin_actions_logged_in_audit_log(client, admin_user_headers, db_session):
    # Trigger an admin standard creation
    client.post(
        "/api/admin/standards",
        json={
            "standard_number": "IS 88888:2026",
            "title": "Safety Standards for Lithium Battery Cells",
            "category": "Energy Storage",
            "version": "2026",
            "status": "ACTIVE",
            "source": "BIS Gazette",
        },
        headers=admin_user_headers,
    )

    # Check audit log in DB
    audit_logs = (
        db_session.query(AuditLog)
        .filter(AuditLog.action.like("ADMIN_%"))
        .all()
    )
    assert len(audit_logs) >= 1
    actions = [a.action for a in audit_logs]
    assert "ADMIN_STANDARD_CREATED" in actions
