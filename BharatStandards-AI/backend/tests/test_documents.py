import io
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
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.services.document_processing_service import document_processing_service
from app.services.storage_service import storage_service

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

SAMPLE_PDF_BYTES = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 73 >> stream
BT
/F1 12 Tf
100 700 Td
(National Testing Laboratory - Dielectric Withstand Test Passed 1500V) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000368 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
445
%%EOF"""


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
        "name": "Doc Lead 1",
        "email": "doclead1@bharat.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user2_headers(client):
    reg = client.post("/api/auth/register", json={
        "name": "Doc Lead 2",
        "email": "doclead2@bharat.in",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "industry",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_upload_valid_pdf(client, user1_headers):
    files = {"file": ("test_report.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    response = client.post("/api/documents/upload", files=files, headers=user1_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test_report.pdf"
    assert data["file_type"] == "PDF"
    assert data["status"] in ["QUEUED", "PROCESSING", "PROCESSED"]
    assert data["id"] is not None


def test_upload_invalid_extension_fails(client, user1_headers):
    files = {"file": ("malicious.exe", io.BytesIO(b"fake data"), "application/octet-stream")}
    response = client.post("/api/documents/upload", files=files, headers=user1_headers)
    assert response.status_code == 400
    assert "only pdf" in response.json()["detail"].lower()


def test_upload_empty_file_fails(client, user1_headers):
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/api/documents/upload", files=files, headers=user1_headers)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_linked_to_product(client, user1_headers):
    # Create product
    prod_resp = client.post("/api/products", json={
        "name": "Electric Water Heater Pro",
        "category": "Electrical Appliances",
    }, headers=user1_headers)
    prod_id = prod_resp.json()["id"]

    # Upload document linked to product
    files = {"file": ("pressure_test.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    data = {"product_id": prod_id}
    response = client.post("/api/documents/upload", files=files, data=data, headers=user1_headers)
    assert response.status_code == 201
    doc_data = response.json()
    assert doc_data["product_id"] == prod_id


def test_upload_linked_to_unowned_product_fails(client, user1_headers, user2_headers):
    # User 1 creates product
    prod_resp = client.post("/api/products", json={
        "name": "User 1 Confidential Item",
        "category": "Electronics",
    }, headers=user1_headers)
    user1_prod_id = prod_resp.json()["id"]

    # User 2 tries to link document to User 1's product -> 404
    files = {"file": ("hacked.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    data = {"product_id": user1_prod_id}
    response = client.post("/api/documents/upload", files=files, data=data, headers=user2_headers)
    assert response.status_code == 404


def test_document_processing_pipeline(client, db_session, user1_headers):
    files = {"file": ("lab_report.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    upload_resp = client.post("/api/documents/upload", files=files, headers=user1_headers)
    doc_id = upload_resp.json()["id"]

    # Run processing service
    processed = document_processing_service.process_document(db_session, doc_id)
    assert processed is not None
    assert processed.status == DocumentStatus.PROCESSED.value
    assert processed.page_count == 1

    # Verify chunks created
    chunks = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
    assert len(chunks) >= 1
    assert "Dielectric Withstand Test Passed" in chunks[0].content

    # Verify detail endpoint returns chunks
    detail_resp = client.get(f"/api/documents/{doc_id}", headers=user1_headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["status"] == "PROCESSED"
    assert len(detail_data["chunks"]) >= 1


def test_search_document_text(client, db_session, user1_headers):
    files = {"file": ("searchable.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    upload_resp = client.post("/api/documents/upload", files=files, headers=user1_headers)
    doc_id = upload_resp.json()["id"]

    # Process document
    document_processing_service.process_document(db_session, doc_id)

    # Search for keyword "Dielectric"
    search_resp = client.get(f"/api/documents/{doc_id}/search?q=Dielectric", headers=user1_headers)
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) >= 1
    assert results[0]["page"] == 1
    assert "Dielectric" in results[0]["snippet"]


def test_delete_document(client, user1_headers):
    files = {"file": ("to_delete.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    upload_resp = client.post("/api/documents/upload", files=files, headers=user1_headers)
    doc_id = upload_resp.json()["id"]

    # Delete
    del_resp = client.delete(f"/api/documents/{doc_id}", headers=user1_headers)
    assert del_resp.status_code == 200

    # Ensure 404 now
    get_resp = client.get(f"/api/documents/{doc_id}", headers=user1_headers)
    assert get_resp.status_code == 404


def test_ownership_isolation(client, user1_headers, user2_headers):
    """
    CRITICAL SECURITY TEST:
    A user cannot view, delete, process, or search another user's document.
    """
    # User 1 uploads document
    files = {"file": ("user1_doc.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    upload_resp = client.post("/api/documents/upload", files=files, headers=user1_headers)
    user1_doc_id = upload_resp.json()["id"]

    # User 2 tries to GET User 1's document -> 404
    get_resp = client.get(f"/api/documents/{user1_doc_id}", headers=user2_headers)
    assert get_resp.status_code == 404

    # User 2 tries to DELETE User 1's document -> 404
    del_resp = client.delete(f"/api/documents/{user1_doc_id}", headers=user2_headers)
    assert del_resp.status_code == 404

    # User 2 tries to SEARCH User 1's document -> 404
    search_resp = client.get(f"/api/documents/{user1_doc_id}/search?q=Dielectric", headers=user2_headers)
    assert search_resp.status_code == 404

    # User 2 tries to REPROCESS User 1's document -> 404
    proc_resp = client.post(f"/api/documents/{user1_doc_id}/process", headers=user2_headers)
    assert proc_resp.status_code == 404

    # User 2 document list should be empty
    list_resp = client.get("/api/documents", headers=user2_headers)
    assert list_resp.json()["total"] == 0
