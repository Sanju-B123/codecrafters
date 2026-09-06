import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_application
from app.core.database import Base, get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.product import Product, ProductStatus

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
def user1_headers(client):
    reg = client.post("/api/auth/register", json={
        "name": "Industry User One",
        "email": "user1@industry.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user2_headers(client):
    reg = client.post("/api/auth/register", json={
        "name": "Consumer User Two",
        "email": "user2@consumer.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "consumer",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_product(client, user1_headers):
    payload = {
        "name": "Electric Water Heater",
        "category": "Electrical Appliances",
        "description": "Domestic 25L storage electric water heater",
        "intended_use": "Residential bathroom hot water supply",
        "manufacturer": "Demo Industries Ltd",
        "model_number": "EH-2000",
        "technical_details": "230V AC, 2000W, 25 Litres, Class I earthing",
    }
    response = client.post("/api/products", json=payload, headers=user1_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Electric Water Heater"
    assert data["category"] == "Electrical Appliances"
    assert data["manufacturer"] == "Demo Industries Ltd"
    assert data["model_number"] == "EH-2000"
    assert data["status"] == "DRAFT"
    assert data["id"] is not None


def test_get_products_list(client, user1_headers):
    # Create two products for user 1
    client.post("/api/products", json={
        "name": "Smart Water Meter",
        "category": "Electronics",
    }, headers=user1_headers)
    client.post("/api/products", json={
        "name": "Industrial Boiler",
        "category": "Mechanical Equipment",
    }, headers=user1_headers)

    response = client.get("/api/products", headers=user1_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Test filtering by category
    filter_resp = client.get("/api/products?category=Electronics", headers=user1_headers)
    assert filter_resp.status_code == 200
    filter_data = filter_resp.json()
    assert filter_data["total"] == 1
    assert filter_data["items"][0]["name"] == "Smart Water Meter"


def test_get_product_detail(client, user1_headers):
    create_resp = client.post("/api/products", json={
        "name": "Solar Inverter 5kW",
        "category": "Electronics",
        "manufacturer": "SunPower India",
    }, headers=user1_headers)
    prod_id = create_resp.json()["id"]

    response = client.get(f"/api/products/{prod_id}", headers=user1_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == prod_id
    assert data["name"] == "Solar Inverter 5kW"


def test_update_product(client, user1_headers):
    create_resp = client.post("/api/products", json={
        "name": "Initial Name",
        "category": "Textiles",
    }, headers=user1_headers)
    prod_id = create_resp.json()["id"]

    update_resp = client.put(f"/api/products/{prod_id}", json={
        "name": "Updated Fire Retardant Fabric",
        "manufacturer": "Bharat Weaves",
    }, headers=user1_headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["name"] == "Updated Fire Retardant Fabric"
    assert updated_data["manufacturer"] == "Bharat Weaves"


def test_delete_product(client, user1_headers):
    create_resp = client.post("/api/products", json={
        "name": "Temporary Test Unit",
        "category": "Other",
    }, headers=user1_headers)
    prod_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/products/{prod_id}", headers=user1_headers)
    assert del_resp.status_code == 200

    # Ensure it no longer exists
    get_resp = client.get(f"/api/products/{prod_id}", headers=user1_headers)
    assert get_resp.status_code == 404


def test_ownership_isolation_security(client, user1_headers, user2_headers):
    """
    CRITICAL SECURITY TEST:
    A logged-in user must ONLY view, edit, delete, and analyze their OWN products.
    Requests for another user's product ID must return 404 Not Found without leaking existence.
    """
    # User 1 creates a product
    create_resp = client.post("/api/products", json={
        "name": "User 1 Proprietary Design",
        "category": "Medical Devices",
    }, headers=user1_headers)
    user1_prod_id = create_resp.json()["id"]

    # User 2 tries to GET User 1's product -> 404
    resp_get = client.get(f"/api/products/{user1_prod_id}", headers=user2_headers)
    assert resp_get.status_code == 404

    # User 2 tries to UPDATE User 1's product -> 404
    resp_put = client.put(f"/api/products/{user1_prod_id}", json={"name": "Hacked Name"}, headers=user2_headers)
    assert resp_put.status_code == 404

    # User 2 tries to DELETE User 1's product -> 404
    resp_del = client.delete(f"/api/products/{user1_prod_id}", headers=user2_headers)
    assert resp_del.status_code == 404

    # User 2 tries to ANALYZE User 1's product -> 404
    resp_analyze = client.post(f"/api/products/{user1_prod_id}/analyze", headers=user2_headers)
    assert resp_analyze.status_code == 404

    # User 2's product list must be empty
    user2_list = client.get("/api/products", headers=user2_headers)
    assert user2_list.json()["total"] == 0


def test_mock_product_analysis(client, user1_headers):
    """
    Test mock standards discovery analysis.
    Verifies that status transitions to READY, synthetic standards with DEMO-IS-001 are returned,
    and BIS disclaimer is included.
    """
    create_resp = client.post("/api/products", json={
        "name": "Electric Storage Water Heater",
        "category": "Electrical Appliances",
        "description": "25 Litres storage type water heater",
        "model_number": "EH-2000",
    }, headers=user1_headers)
    prod_id = create_resp.json()["id"]

    analyze_resp = client.post(f"/api/products/{prod_id}/analyze", headers=user1_headers)
    assert analyze_resp.status_code == 200
    analysis = analyze_resp.json()

    assert analysis["status"] == "READY"
    assert len(analysis["standards"]) >= 2
    # Verify synthetic demo standard exists
    std_numbers = [s["standard_number"] for s in analysis["standards"]]
    assert "DEMO-IS-001" in std_numbers
    assert any(s["relevance"] == "HIGH" for s in analysis["standards"])
    assert "disclaimer" in analysis
    assert "BharatStandards AI provides AI-assisted" in analysis["disclaimer"]

    # Verify product in database now has status READY
    prod_resp = client.get(f"/api/products/{prod_id}", headers=user1_headers)
    assert prod_resp.json()["status"] == "READY"

    # Verify GET /analysis returns the analysis
    get_analysis_resp = client.get(f"/api/products/{prod_id}/analysis", headers=user1_headers)
    assert get_analysis_resp.status_code == 200
    assert get_analysis_resp.json()["product_id"] == prod_id
