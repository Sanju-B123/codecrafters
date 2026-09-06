import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_application
from app.core.database import Base, get_db
from app.models.user import User
from app.models.profile import Profile

# Use in-memory SQLite database with StaticPool so all connections share the same memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)



@pytest.fixture(scope="function")
def db_session():
    """Create fresh tables for each test and tear down after."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Override get_db dependency with test database session."""
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


def test_register_industry_user_success(client):
    payload = {
        "name": "Rajesh Kumar",
        "email": "rajesh@solartech.in",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "role": "industry",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "Rajesh Kumar"
    assert data["user"]["email"] == "rajesh@solartech.in"
    assert data["user"]["role"] == "industry"
    assert "password_hash" not in data["user"]


def test_register_consumer_user_success(client):
    payload = {
        "name": "Priya Sharma",
        "email": "priya@gmail.com",
        "password": "ConsumerPassword123!",
        "confirm_password": "ConsumerPassword123!",
        "role": "consumer",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "consumer"


def test_register_duplicate_email_fails(client):
    payload = {
        "name": "Duplicate Test",
        "email": "duplicate@test.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    }
    first_res = client.post("/api/auth/register", json=payload)
    assert first_res.status_code == 201

    second_res = client.post("/api/auth/register", json=payload)
    assert second_res.status_code == 400
    assert "already exists" in second_res.json()["detail"].lower()


def test_register_password_mismatch_fails(client):
    payload = {
        "name": "Mismatch Test",
        "email": "mismatch@test.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!",
        "role": "industry",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_register_password_too_short_fails(client):
    payload = {
        "name": "Short Pass",
        "email": "short@test.com",
        "password": "short",
        "confirm_password": "short",
        "role": "industry",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client):
    # Register first
    client.post("/api/auth/register", json={
        "name": "Login Test",
        "email": "login@test.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })

    # Login
    response = client.post("/api/auth/login", json={
        "email": "login@test.com",
        "password": "Password123!",
        "remember_me": True,
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@test.com"


def test_login_invalid_password_fails(client):
    client.post("/api/auth/register", json={
        "name": "Login Test",
        "email": "wrongpass@test.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })

    response = client.post("/api/auth/login", json={
        "email": "wrongpass@test.com",
        "password": "IncorrectPassword999!",
    })
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_login_nonexistent_email_fails(client):
    response = client.post("/api/auth/login", json={
        "email": "doesnotexist@test.com",
        "password": "SomePassword123!",
    })
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_get_me_authenticated(client):
    reg = client.post("/api/auth/register", json={
        "name": "Auth Me Test",
        "email": "authme@test.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "consumer",
    })
    token = reg.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "authme@test.com"
    assert data["name"] == "Auth Me Test"
    assert data["role"] == "consumer"


def test_get_me_unauthenticated_fails(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_get_me_invalid_token_fails(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"},
    )
    assert response.status_code == 401


def test_logout(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert "logged out" in response.json()["message"].lower()
