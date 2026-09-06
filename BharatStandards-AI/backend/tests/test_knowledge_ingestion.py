import json
import pytest
from io import BytesIO
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import create_application
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile
from app.models.standard import Standard, Requirement, StandardStatus, RequirementStatus
from app.models.knowledge import (
    KnowledgeSource,
    KnowledgeSourceType,
    KnowledgeVerificationStatus,
    KnowledgeImportJob,
    KnowledgeImportRecord,
    KnowledgeChangeLog,
    KnowledgeChangeAction,
)
from app.knowledge.ingestion.source_loader import IngestionPayload
from app.knowledge.ingestion.json_loader import JsonSourceLoader
from app.knowledge.ingestion.csv_loader import CsvSourceLoader
from app.knowledge.ingestion.document_loader import DocumentSourceLoader
from app.knowledge.ingestion.normalizer import KnowledgeNormalizer
from app.knowledge.ingestion.validator import KnowledgeValidator
from app.knowledge.ingestion.deduplicator import KnowledgeDeduplicator
from app.rag.retriever import DatabaseHybridRetriever


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
            "name": "Standard User",
            "email": "user@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "industry",
        },
    )
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user_headers(client, db_session):
    admin = User(
        name="Lead Knowledge Admin",
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
        organization="BharatStandards Knowledge Directorate",
        designation="Lead Systems Auditor",
    )
    db_session.add(profile)
    db_session.commit()

    login = client.post(
        "/api/auth/login",
        json={"email": "admin@bharatstandards.ai", "password": "Admin@123456"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Unit Tests for Ingestion Loaders, Normalizer, Validator, Deduplicator
# ---------------------------------------------------------------------------

def test_json_source_loader_valid():
    loader = JsonSourceLoader()
    raw_data = json.dumps({
        "standards": [
            {
                "standard_number": "IS 1293:2019",
                "title": "Plugs and Socket-Outlets of Rated Voltage up to 250V",
                "category": "ELECTRICAL",
                "description": "Safety specifications for domestic plugs.",
            }
        ],
        "requirements": [
            {
                "standard_number": "IS 1293:2019",
                "clause": "13.1",
                "title": "Insulation Resistance",
                "description": "Insulation resistance shall not be less than 5 Megaohms.",
                "testing_method": "500V DC megohmmeter",
                "weight": 3.0,
                "priority": "MANDATORY",
            }
        ],
        "sources": [
            {
                "name": "BIS Official Portal",
                "url": "https://www.services.bis.gov.in",
                "source_type": "OFFICIAL",
            }
        ]
    }).encode("utf-8")

    payload = loader.load(raw_data)
    assert len(payload.standards) == 1
    assert len(payload.requirements) == 1
    assert len(payload.sources) == 1
    assert payload.standards[0]["standard_number"] == "IS 1293:2019"


def test_csv_source_loader_valid():
    loader = CsvSourceLoader()
    csv_data = (
        "standard_number,title,category,description,version\n"
        "IS 694,PVC Insulated Cables,ELECTRICAL,PVC insulated electric cables,2010\n"
    ).encode("utf-8")

    payload = loader.load(csv_data, filename="standards.csv")
    assert len(payload.standards) == 1
    assert payload.standards[0]["standard_number"] == "IS 694"
    assert payload.standards[0]["category"] == "ELECTRICAL"


def test_document_source_loader_markdown():
    loader = DocumentSourceLoader()
    md_content = """# IS 302-2-3: Safety of Electric Irons
Category: ELECTRICAL
Version: 2021

## Clause 8.1 - Protection Against Electric Shock
Live parts must not be accessible during normal operation using standard test finger.
Testing Method: Standard test probe B per IS 14003.

## Clause 11.2 - Heating Test
Temperature rise of handles held in normal use shall not exceed 60K.
""".encode("utf-8")

    payload = loader.load(md_content, filename="is_302_electric_irons.md")
    assert len(payload.standards) == 1
    assert len(payload.requirements) == 2
    assert payload.requirements[0]["clause"] == "8.1"
    assert payload.requirements[1]["clause"] == "11.2"


def test_normalizer_preserves_text_and_normalizes_standard_number():
    raw_payload = IngestionPayload(
        format="json",
        standards=[
            {
                "standard_number": "is  1293 : 2019 ",
                "title": "  Plugs   and Sockets  ",
                "category": "electrical",
                "description": "Verbatim technical text with exact tolerances: ±0.05 mm and 1000V rms.",
            }
        ],
        requirements=[
            {
                "standard_number": "is 1293 : 2019",
                "clause": "Clause 13.1.2 ",
                "title": " Insulation Resistance ",
                "description": "Shall withstand 500V ± 10V DC for 60s without breakdown.",
            }
        ]
    )

    normalized = KnowledgeNormalizer.normalize_payload(raw_payload)
    std = normalized.standards[0]
    req = normalized.requirements[0]

    assert std["standard_number"] == "IS 1293:2019"
    assert std["category"] == "ELECTRICAL"
    assert std["description"] == "Verbatim technical text with exact tolerances: ±0.05 mm and 1000V rms."
    assert req["clause"] == "13.1.2"
    assert req["description"] == "Shall withstand 500V ± 10V DC for 60s without breakdown."


def test_validator_catches_schema_and_enum_errors():
    invalid_payload = IngestionPayload(
        format="json",
        standards=[
            {
                "standard_number": "",  # missing required
                "title": "Missing Number Standard",
                "status": "INVALID_STATUS",  # bad enum
            }
        ],
        requirements=[
            {
                "standard_number": "IS 999",
                "clause": "1.0",
                "title": "Test Clause",
                "description": "",  # missing description
                "priority": "SUPER_MANDATORY",  # bad enum
                "category": "INVALID_REQ_CATEGORY",  # bad enum
            }
        ],
        sources=[
            {
                "name": "Bad Source",
                "url": "not-a-valid-url",  # bad URL
                "source_type": "OFFICIAL",
            }
        ]
    )

    result = KnowledgeValidator.validate(invalid_payload)
    assert not result.is_valid
    assert len(result.errors) >= 5
    error_fields = [e.field for e in result.errors]
    assert "standard_number" in error_fields
    assert "status" in error_fields
    assert "category" in error_fields
    assert "description" in error_fields
    assert "url" in error_fields


def test_deduplicator_identifies_existing_standards_and_clauses(db_session):
    existing_std = Standard(
        standard_number="IS 16046:2018",
        title="Secondary Cells and Batteries",
        category="ELECTRONICS",
        description="Lithium cell safety",
        version="2018",
        status=StandardStatus.ACTIVE.value,
    )
    db_session.add(existing_std)
    db_session.commit()

    existing_req = Requirement(
        standard_id=existing_std.id,
        clause="4.2",
        title="Continuous Charging",
        description="Continuous charging at constant voltage.",
        status=RequirementStatus.ACTIVE.value,
    )
    db_session.add(existing_req)
    db_session.commit()

    payload = IngestionPayload(
        format="json",
        standards=[
            {
                "standard_number": "IS 16046:2018",
                "version": "2018",
                "title": "Duplicate Standard",
            },
            {
                "standard_number": "IS 99999:2026",
                "version": "2026",
                "title": "Brand New Standard",
            }
        ],
        requirements=[
            {
                "standard_number": "IS 16046:2018",
                "clause": "4.2",
                "title": "Duplicate Clause",
                "description": "Exact match clause",
            }
        ]
    )

    report = KnowledgeDeduplicator.find_duplicates(payload, db_session)
    assert len(report.duplicate_standards) == 1
    assert "IS 16046:2018" in report.duplicate_standards
    assert len(report.duplicate_requirements) == 1


# ---------------------------------------------------------------------------
# API Integration & Admin Authorization Tests
# ---------------------------------------------------------------------------

def test_admin_auth_required_for_knowledge_routes(client, normal_user_headers):
    # Non-admin user receives 403 Forbidden
    resp = client.get("/api/admin/knowledge/health", headers=normal_user_headers)
    assert resp.status_code == 403

    resp = client.get("/api/admin/knowledge/drafts", headers=normal_user_headers)
    assert resp.status_code == 403

    resp = client.get("/api/admin/knowledge/imports", headers=normal_user_headers)
    assert resp.status_code == 403


def test_preview_knowledge_file_api(client, admin_user_headers):
    data = {
        "standards": [
            {
                "standard_number": "IS 10001:2026",
                "title": "Synthetic Industrial Safety Spec",
                "category": "MACHINERY",
                "description": "DEMO / SYNTHETIC DATA - Mechanical guards spec.",
            }
        ],
        "requirements": [
            {
                "standard_number": "IS 10001:2026",
                "clause": "5.1",
                "title": "Guard Clearance",
                "description": "Distance must be greater than 15mm.",
            }
        ]
    }
    file_bytes = json.dumps(data).encode("utf-8")

    response = client.post(
        "/api/admin/knowledge/import/preview",
        files={"file": ("safety_standards.json", BytesIO(file_bytes), "application/json")},
        data={"provenance_type": "DEMO"},
        headers=admin_user_headers,
    )
    assert response.status_code == 200
    res = response.json()
    assert res["filename"] == "safety_standards.json"
    assert res["standards_count"] == 1
    assert res["requirements_count"] == 1
    assert res["valid_records"] == 2
    assert res["is_valid"] is True


def test_import_and_commit_knowledge_workflow(client, admin_user_headers, db_session):
    data = {
        "standards": [
            {
                "standard_number": "IS 8888:2026",
                "title": "Solar Photovoltaic Inverters Safety",
                "category": "SOLAR",
                "description": "DEMO / SYNTHETIC DATA - Inverter specifications.",
                "version": "2026",
            }
        ],
        "requirements": [
            {
                "standard_number": "IS 8888:2026",
                "clause": "9.1",
                "title": "Anti-Islanding Protection",
                "description": "Inverter must trip within 2.0 seconds upon grid disconnection.",
                "testing_method": "Grid disconnect simulation relay",
                "priority": "MANDATORY",
                "weight": 3.0,
            }
        ]
    }
    file_bytes = json.dumps(data).encode("utf-8")

    # 1. Upload & Stage as DRAFT (commit_immediately=False)
    import_resp = client.post(
        "/api/admin/knowledge/import",
        files={"file": ("solar_inverters.json", BytesIO(file_bytes), "application/json")},
        data={
            "provenance_type": "DEMO",
            "source_name": "Demo Ingestion File",
            "verification_status": "UNVERIFIED",
            "commit_immediately": "false",
        },
        headers=admin_user_headers,
    )
    assert import_resp.status_code == 200
    job_id = import_resp.json()["id"]

    # 2. Inspect Records
    records_resp = client.get(f"/api/admin/knowledge/imports/{job_id}/records", headers=admin_user_headers)
    assert records_resp.status_code == 200
    records = records_resp.json()
    assert len(records) == 2

    # 3. Commit Job into Draft Knowledge
    commit_resp = client.post(f"/api/admin/knowledge/imports/{job_id}/commit", headers=admin_user_headers)
    assert commit_resp.status_code == 200

    # 4. Verify Draft Inbox has the staged standard and requirement
    drafts_resp = client.get("/api/admin/knowledge/drafts", headers=admin_user_headers)
    assert drafts_resp.status_code == 200
    drafts = drafts_resp.json()
    assert any(s["standard_number"] == "IS 8888:2026" for s in drafts["standards"])
    assert any(r["clause"] == "9.1" for r in drafts["requirements"])

    std_item = next(s for s in drafts["standards"] if s["standard_number"] == "IS 8888:2026")
    req_item = next(r for r in drafts["requirements"] if r["clause"] == "9.1")

    # 5. Approve Draft Standard -> Becomes ACTIVE, logs KnowledgeChangeLog
    appr_std = client.post(
        f"/api/admin/knowledge/standard/{std_item['id']}/approve",
        headers=admin_user_headers,
    )
    assert appr_std.status_code == 200
    assert appr_std.json()["new_status"] == StandardStatus.ACTIVE.value

    # Check DB standard status and change log
    active_std = db_session.query(Standard).filter(Standard.id == std_item["id"]).first()
    assert active_std.status == StandardStatus.ACTIVE.value

    log = db_session.query(KnowledgeChangeLog).filter(
        KnowledgeChangeLog.entity_id == std_item["id"],
        KnowledgeChangeLog.entity_type == "STANDARD",
    ).first()
    assert log is not None
    assert log.action == KnowledgeChangeAction.APPROVED.value

    # 6. Approve Requirement Clause
    appr_req = client.post(
        f"/api/admin/knowledge/requirement/{req_item['id']}/approve",
        headers=admin_user_headers,
    )
    assert appr_req.status_code == 200
    assert appr_req.json()["new_status"] == RequirementStatus.ACTIVE.value


def test_reject_and_archive_knowledge_entities(client, admin_user_headers, db_session):
    draft_std = Standard(
        standard_number="IS 7777:2026",
        title="Candidate For Rejection",
        category="TESTING",
        status=StandardStatus.DRAFT.value,
    )
    db_session.add(draft_std)
    db_session.commit()

    # Reject
    rej_resp = client.post(
        f"/api/admin/knowledge/standard/{draft_std.id}/reject?reason=Incorrect+scope",
        headers=admin_user_headers,
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["new_status"] == "REJECTED"

    # Archive
    arch_resp = client.post(
        f"/api/admin/knowledge/standard/{draft_std.id}/archive",
        headers=admin_user_headers,
    )
    assert arch_resp.status_code == 200
    assert arch_resp.json()["new_status"] == StandardStatus.ARCHIVED.value


def test_rag_retriever_filters_draft_and_boosts_verified(db_session):
    # Create an ACTIVE verified official standard
    std_official = Standard(
        standard_number="IS 1001:2020",
        title="Verified Safe Drinking Water Systems",
        category="WATER",
        status=StandardStatus.ACTIVE.value,
    )
    # Create a DRAFT standard (should be excluded)
    std_draft = Standard(
        standard_number="IS 1002:2026",
        title="Draft Water Filtration Guidelines",
        category="WATER",
        status=StandardStatus.DRAFT.value,
    )
    db_session.add_all([std_official, std_draft])
    db_session.commit()

    # Add source for official
    source = KnowledgeSource(
        name="Official BIS Water Gazette",
        source_type=KnowledgeSourceType.OFFICIAL.value,
        verification_status=KnowledgeVerificationStatus.VERIFIED.value,
        is_verified=True,
    )
    db_session.add(source)
    db_session.commit()

    retriever = DatabaseHybridRetriever(db_session)
    results = retriever.retrieve(query="drinking water systems", user_id=1, limit=10)

    found_standards = results["standards"]
    found_numbers = [s["standard_number"] for s in found_standards]

    assert "IS 1001:2020" in found_numbers
    assert "IS 1002:2026" not in found_numbers  # Draft is filtered out from RAG!


def test_knowledge_health_telemetry_metrics(client, admin_user_headers, db_session):
    # Verify health response contains all metrics
    resp = client.get("/api/admin/knowledge/health", headers=admin_user_headers)
    assert resp.status_code == 200
    health = resp.json()

    assert "total_standards" in health
    assert "active_standards" in health
    assert "draft_standards" in health
    assert "total_requirements" in health
    assert "verified_sources" in health
    assert "pending_review_count" in health
    assert "quality_score" in health
    assert health["last_review_threshold_days"] == 180
    assert 0.0 <= health["quality_score"] <= 100.0
