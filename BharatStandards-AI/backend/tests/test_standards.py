import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_application
from app.core.database import Base, get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.product import Product
from app.models.standard import Standard, Requirement, StandardStatus, RequirementCategory
from app.services.standards_seed import seed_standards_knowledge_base
from app.services.standard_service import StandardService

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
    seed_standards_knowledge_base(session)
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
def user_headers(client):
    reg = client.post("/api/auth/register", json={
        "name": "Standard Explorer",
        "email": "standards@test.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_standards(client):
    response = client.get("/api/standards")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 3
    assert len(data["items"]) >= 3

    numbers = [s["standard_number"] for s in data["items"]]
    assert "DEMO-IS-001" in numbers
    assert "DEMO-IS-002" in numbers
    assert "DEMO-IS-003" in numbers


def test_search_standards(client):
    response = client.get("/api/standards/search?q=water heater")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Water Heater" in s["title"] for s in data["items"])


def test_filter_standards_by_category(client):
    response = client.get("/api/standards?category=Electronics")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for s in data["items"]:
        assert "Electronics" in s["category"]


def test_get_standard_by_code(client):
    response = client.get("/api/standards/DEMO-IS-001")
    assert response.status_code == 200
    data = response.json()
    assert data["standard_number"] == "DEMO-IS-001"
    assert "Electric Water Heater" in data["title"]
    assert data["is_demo"] is True
    assert len(data["requirements"]) >= 8

    # Verify requirements are structured with clauses and evidence
    clauses = [r["clause"] for r in data["requirements"]]
    assert "4.1" in clauses
    assert "6.1" in clauses
    assert "8.4" in clauses


def test_get_standard_by_numeric_id(client, db_session):
    std = db_session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()
    assert std is not None

    response = client.get(f"/api/standards/{std.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == std.id
    assert data["standard_number"] == "DEMO-IS-001"


def test_get_standard_not_found(client):
    response = client.get("/api/standards/NON-EXISTENT-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_standard_requirements(client):
    response = client.get("/api/standards/DEMO-IS-001/requirements")
    assert response.status_code == 200
    reqs = response.json()
    assert len(reqs) >= 8

    req_map = {r["clause"]: r for r in reqs}
    assert "4.1" in req_map
    assert req_map["4.1"]["category"] == "SAFETY"
    assert req_map["4.1"]["evidence_required"] is not None


def test_filter_requirements_by_category(client):
    response = client.get("/api/standards/DEMO-IS-001/requirements?category=SAFETY")
    assert response.status_code == 200
    reqs = response.json()
    assert len(reqs) >= 1
    for r in reqs:
        assert r["category"] == "SAFETY"


def test_unauthorized_modification_prohibited(client, user_headers):
    """Knowledge base must remain immutable to regular users."""
    post_resp = client.post("/api/standards", json={"standard_number": "MALICIOUS-01"}, headers=user_headers)
    assert post_resp.status_code in [401, 403]

    del_resp = client.delete("/api/standards/DEMO-IS-001", headers=user_headers)
    assert del_resp.status_code in [401, 403]


def test_standard_service_find_potential_matches(db_session):
    product = Product(
        name="Domestic Water Heater",
        category="Electrical Appliances",
        description="Electric geyser",
    )
    matches = StandardService.find_potential_matches(db_session, product)
    assert len(matches) >= 2
    match_numbers = [m["standard_number"] for m in matches]
    assert "DEMO-IS-001" in match_numbers
    assert any(m["relevance"] == "HIGH" for m in matches)
