import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import create_application
from app.core.database import Base, get_db
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
def auth_headers(client):
    reg = client.post("/api/auth/register", json={
        "name": "Profile Tester",
        "email": "tester@bharatstandards.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_my_profile_success(client, auth_headers):
    response = client.get("/api/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Profile Tester"
    assert data["email"] == "tester@bharatstandards.in"
    assert data["role"] == "industry"
    assert "profile" in data


def test_update_my_profile_success(client, auth_headers):
    update_payload = {
        "name": "Updated Profile Tester",
        "phone": "+91 9876543210",
        "organization": "Bharat Electricals Ltd",
        "industry": "Electrical Appliances",
        "designation": "Quality Assurance Head",
        "location": "Faridabad, Haryana",
    }
    response = client.put("/api/users/me", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Profile Tester"
    assert data["profile"]["phone"] == "+91 9876543210"
    assert data["profile"]["organization"] == "Bharat Electricals Ltd"
    assert data["profile"]["industry"] == "Electrical Appliances"
    assert data["profile"]["designation"] == "Quality Assurance Head"
    assert data["profile"]["location"] == "Faridabad, Haryana"


def test_change_password_success(client, auth_headers):
    payload = {
        "current_password": "Password123!",
        "new_password": "NewStrongPassword456!",
        "confirm_new_password": "NewStrongPassword456!",
    }
    response = client.put("/api/users/me/password", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert "password changed successfully" in response.json()["message"].lower()

    # Login with new password should succeed
    login_res = client.post("/api/auth/login", json={
        "email": "tester@bharatstandards.in",
        "password": "NewStrongPassword456!",
    })
    assert login_res.status_code == 200

    # Login with old password should fail
    old_login = client.post("/api/auth/login", json={
        "email": "tester@bharatstandards.in",
        "password": "Password123!",
    })
    assert old_login.status_code == 401


def test_change_password_incorrect_current_fails(client, auth_headers):
    payload = {
        "current_password": "WrongOldPassword!",
        "new_password": "NewStrongPassword456!",
        "confirm_new_password": "NewStrongPassword456!",
    }
    response = client.put("/api/users/me/password", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "incorrect current password" in response.json()["detail"].lower()


def test_change_password_mismatch_fails(client, auth_headers):
    payload = {
        "current_password": "Password123!",
        "new_password": "NewStrongPassword456!",
        "confirm_new_password": "DifferentPassword789!",
    }
    response = client.put("/api/users/me/password", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_update_preferences_success(client, auth_headers):
    payload = {
        "email_notifications": True,
        "compliance_notifications": False,
        "theme": "dark",
        "language": "en",
    }
    response = client.put("/api/users/me/preferences", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert "settings saved" in response.json()["message"].lower()

    # Check that GET /api/users/me reflects new preferences
    get_res = client.get("/api/users/me", headers=auth_headers)
    assert get_res.status_code == 200
    prefs = get_res.json()["profile"]["preferences"]
    assert prefs["compliance_notifications"] is False
    assert prefs["theme"] == "dark"


def test_delete_account_success(client, auth_headers):
    response = client.request(
        "DELETE",
        "/api/users/me",
        json={"confirmation": "DELETE"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"].lower()

    # Verify user can no longer log in
    login_res = client.post("/api/auth/login", json={
        "email": "tester@bharatstandards.in",
        "password": "Password123!",
    })
    assert login_res.status_code == 401


def test_unauthenticated_profile_access_fails(client):
    response = client.get("/api/users/me")
    assert response.status_code == 401
