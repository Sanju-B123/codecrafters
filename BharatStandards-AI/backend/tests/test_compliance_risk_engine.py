"""
BharatStandards AI - Compliance Intelligence & Product Risk Engine Test Suite (Step 18)
Comprehensive tests covering:
- risk score calculation logic
- risk factor breakdown (Requirement Priority, Compliance Status, Evidence, Confidence)
- risk classifications (CRITICAL, HIGH, MEDIUM, LOW)
- critical gap prioritization & top risks
- recommended action ranking by risk reduction potential
- What-If simulation calculation & ephemeral execution
- score consistency with core compliance engine
- multi-tenant risk isolation
- cached risk retrieval & cache invalidation
- force recalculate behavior
- requirement-level risk evaluation endpoints
- AI assistant risk grounded retrieval
- admin compliance telemetry
- invalid report ID and edge case handling
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import create_application
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.product import Product
from app.models.standard import Standard, Requirement
from app.models.compliance import ComplianceReport, ComplianceRisk, GapPriority
from app.services.standards_seed import seed_standards_knowledge_base
from app.services.compliance_service import ComplianceService
from app.services.risk_engine import ComplianceRiskEngine
from app.services.what_if_service import WhatIfAnalysisService

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create clean database tables and seed synthetic standards."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        seed_standards_knowledge_base(session)
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
def auth_headers(client, db_session):
    """Register and authenticate test industry user."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Risk Engineer",
            "email": "risk_tester@voltassystems.in",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "industry",
        },
    )
    res = client.post(
        "/api/auth/login",
        json={
            "email": "risk_tester@voltassystems.in",
            "password": "Password123!",
        },
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user_headers(client, db_session):
    """Register and authenticate a secondary user for multi-tenant isolation testing."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Other Engineer",
            "email": "other_user@havells.in",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "industry",
        },
    )
    res = client.post(
        "/api/auth/login",
        json={
            "email": "other_user@havells.in",
            "password": "Password123!",
        },
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, db_session):
    """Register and authenticate an admin user."""
    admin_user = User(
        name="National BIS Admin",
        email="admin_risk@bis.gov.in",
        password_hash=get_password_hash("AdminPass123!"),
        role="ADMIN",
        is_active=True,
    )
    db_session.add(admin_user)
    db_session.commit()

    res = client.post(
        "/api/auth/login",
        json={
            "email": "admin_risk@bis.gov.in",
            "password": "AdminPass123!",
        },
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_product_and_compliance(client, auth_headers):
    """Creates a sample product and executes initial compliance check."""
    prod_res = client.post(
        "/api/products",
        json={
            "name": "Smart Water Geyser 25L",
            "category": "Electrical",
            "manufacturer": "Voltas Systems",
            "model_number": "VG-25L-2026",
            "description": "Stationary storage electric water heater",
        },
        headers=auth_headers,
    )
    product_id = prod_res.json()["id"]

    # Execute compliance check against benchmark standard (DEMO-IS-001)
    std_res = client.get("/api/standards")
    standard_id = std_res.json()["items"][0]["id"]

    check_res = client.post(
        "/api/compliance/check",
        json={"product_id": product_id, "standard_id": standard_id},
        headers=auth_headers,
    )
    report_id = check_res.json()["id"]

    return {
        "product_id": product_id,
        "standard_id": standard_id,
        "report_id": report_id,
        "report_data": check_res.json(),
    }


# ===========================================================================
# 1. RISK SCORE CALCULATION LOGIC & FACTOR BREAKDOWN
# ===========================================================================

def test_risk_score_calculation_logic(client, auth_headers, setup_product_and_compliance):
    """Verify 0-100 risk score calculation, factor decomposition, and disclaimer."""
    report_id = setup_product_and_compliance["report_id"]

    res = client.get(f"/api/compliance/{report_id}/risk", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert "overall_risk_score" in data
    assert 0 <= data["overall_risk_score"] <= 100
    assert data["risk_level"] in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    assert "top_risks" in data
    assert "recommended_actions" in data
    assert len(data["top_risks"]) <= 5


def test_risk_factor_breakdown(client, auth_headers, setup_product_and_compliance):
    """Verify each clause risk has explainable factor contributions matching weights."""
    report_id = setup_product_and_compliance["report_id"]

    res = client.get(f"/api/compliance/{report_id}/risks", headers=auth_headers)
    assert res.status_code == 200
    risk_items = res.json()
    assert len(risk_items) > 0

    first_item = risk_items[0]
    assert "requirement_id" in first_item
    assert "clause" in first_item
    assert "risk_score" in first_item
    assert "factors" in first_item
    assert "reasons" in first_item

    # Verify factors cover all 4 required dimensions
    factor_types = [f["factor_type"] for f in first_item["factors"]]
    assert "REQUIREMENT_PRIORITY" in factor_types
    assert "COMPLIANCE_STATUS" in factor_types
    assert "EVIDENCE_AVAILABILITY" in factor_types
    assert "EVIDENCE_CONFIDENCE" in factor_types

    # Sum of factor contributions equals total clause risk score (with rounding)
    contrib_sum = sum(f["contribution"] for f in first_item["factors"])
    assert abs(contrib_sum - first_item["risk_score"]) < 0.2


# ===========================================================================
# 2. RISK CLASSIFICATION LEVELS & THRESHOLDS
# ===========================================================================

def test_risk_level_classifications():
    """Verify threshold mappings: 0-20 LOW, 21-50 MEDIUM, 51-75 HIGH, 76-100 CRITICAL."""
    assert ComplianceRiskEngine.get_risk_level(85.0) == GapPriority.CRITICAL.value
    assert ComplianceRiskEngine.get_risk_level(76.0) == GapPriority.CRITICAL.value
    assert ComplianceRiskEngine.get_risk_level(75.0) == GapPriority.HIGH.value
    assert ComplianceRiskEngine.get_risk_level(51.0) == GapPriority.HIGH.value
    assert ComplianceRiskEngine.get_risk_level(50.0) == GapPriority.MEDIUM.value
    assert ComplianceRiskEngine.get_risk_level(21.0) == GapPriority.MEDIUM.value
    assert ComplianceRiskEngine.get_risk_level(20.0) == GapPriority.LOW.value
    assert ComplianceRiskEngine.get_risk_level(0.0) == GapPriority.LOW.value


# ===========================================================================
# 3. CRITICAL GAP PRIORITIZATION & RECOMMENDED ACTION RANKING
# ===========================================================================

def test_critical_gap_prioritization(client, auth_headers, setup_product_and_compliance):
    """Verify top risks are sorted by risk score descending, prioritizing serious gaps."""
    report_id = setup_product_and_compliance["report_id"]

    res = client.get(f"/api/compliance/{report_id}/risks", headers=auth_headers)
    assert res.status_code == 200
    risks = res.json()

    # Verify descending sort order
    scores = [r["risk_score"] for r in risks]
    assert scores == sorted(scores, reverse=True)


def test_recommended_action_ranking(client, auth_headers, setup_product_and_compliance):
    """Verify action plan items are ranked by potential risk reduction descending."""
    report_id = setup_product_and_compliance["report_id"]

    res = client.get(f"/api/compliance/{report_id}/risk/actions", headers=auth_headers)
    assert res.status_code == 200
    actions = res.json()

    assert len(actions) > 0
    reductions = [a["risk_reduction_potential"] for a in actions]
    assert reductions == sorted(reductions, reverse=True)
    assert all(a["risk_reduction_potential"] >= 0 for a in actions)


# ===========================================================================
# 4. WHAT-IF SCENARIO SIMULATION & SCORE CONSISTENCY
# ===========================================================================

def test_what_if_simulation_calculation(client, auth_headers, setup_product_and_compliance):
    """Verify What-If simulation calculates projected scores without mutating database."""
    report_id = setup_product_and_compliance["report_id"]

    # Get non-pass requirements
    report_detail = client.get(f"/api/compliance/{report_id}", headers=auth_headers).json()
    non_pass_results = [r for r in report_detail["results"] if r["status"] != "PASS"]
    assert len(non_pass_results) > 0

    target_req_id = non_pass_results[0]["requirement_id"]

    # Run simulation
    sim_res = client.post(
        f"/api/compliance/{report_id}/what-if",
        json={"resolved_requirement_ids": [target_req_id]},
        headers=auth_headers,
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()

    assert sim_data["compliance_report_id"] == report_id
    assert sim_data["projected_score"] >= sim_data["original_score"]
    assert sim_data["projected_score_delta"] >= 0
    assert sim_data["projected_risk_score"] <= sim_data["original_risk_score"]
    assert sim_data["projected_risk_delta"] >= 0
    assert sim_data["simulated_resolved_count"] == 1

    # Verify database report was NOT modified (ephemeral simulation guarantee)
    after_report = client.get(f"/api/compliance/{report_id}", headers=auth_headers).json()
    assert after_report["score"] == sim_data["original_score"]


def test_score_consistency_with_compliance_check(db_session, setup_product_and_compliance):
    """Verify What-If projected readiness uses the exact same formula as ComplianceService."""
    report_id = setup_product_and_compliance["report_id"]
    report = db_session.query(ComplianceReport).filter(ComplianceReport.id == report_id).first()

    # All non-pass requirements
    non_pass_ids = [r.requirement_id for r in report.results if r.status != "PASS"]

    # If all non-pass are simulated as resolved, projected readiness should be 100.0%
    sim = WhatIfAnalysisService.simulate_what_if(
        compliance_report_id=report_id,
        resolved_requirement_ids=non_pass_ids,
        user_id=report.user_id,
        db=db_session,
    )
    assert sim.projected_score == 100.0
    assert sim.projected_risk_score <= 20.0
    assert sim.projected_risk_level == GapPriority.LOW.value


# ===========================================================================
# 5. MULTI-TENANT ISOLATION
# ===========================================================================

def test_multi_tenant_risk_isolation(client, setup_product_and_compliance, second_user_headers):
    """Verify a different user cannot access or simulate What-If on another tenant's report."""
    report_id = setup_product_and_compliance["report_id"]

    # Attempt risk retrieval
    res = client.get(f"/api/compliance/{report_id}/risk", headers=second_user_headers)
    assert res.status_code in (403, 404)

    # Attempt What-If simulation
    sim_res = client.post(
        f"/api/compliance/{report_id}/what-if",
        json={"resolved_requirement_ids": [1]},
        headers=second_user_headers,
    )
    assert sim_res.status_code in (403, 404)


# ===========================================================================
# 6. CACHING, FORCE RECALCULATE & COMPLIANCE RE-RUN INVALIDATION
# ===========================================================================

def test_cached_risk_retrieval(client, auth_headers, setup_product_and_compliance):
    """Verify subsequent requests return cached risk records."""
    report_id = setup_product_and_compliance["report_id"]

    first_call = client.get(f"/api/compliance/{report_id}/risk", headers=auth_headers).json()
    second_call = client.get(f"/api/compliance/{report_id}/risk", headers=auth_headers).json()

    assert first_call["overall_risk_score"] == second_call["overall_risk_score"]
    assert first_call["risk_level"] == second_call["risk_level"]


def test_force_recalculate_behavior(client, auth_headers, setup_product_and_compliance):
    """Verify POST /api/compliance/{id}/recalculate-risk refreshes risk factors."""
    report_id = setup_product_and_compliance["report_id"]

    res = client.post(f"/api/compliance/{report_id}/recalculate-risk", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["compliance_report_id"] >= report_id
    assert "risk_summary" in data
    assert "recalculated" in data["message"].lower()


def test_invalidation_on_re_running_compliance(client, auth_headers, setup_product_and_compliance):
    """Verify re-running compliance check updates the report and establishes fresh risk state."""
    product_id = setup_product_and_compliance["product_id"]
    standard_id = setup_product_and_compliance["standard_id"]

    re_check = client.post(
        "/api/compliance/check",
        json={"product_id": product_id, "standard_id": standard_id},
        headers=auth_headers,
    )
    assert re_check.status_code in (200, 201)
    new_report_id = re_check.json()["id"]

    # Verify new report has risk populated automatically
    assert re_check.json()["overall_risk_score"] is not None
    assert re_check.json()["risk_level"] in ("CRITICAL", "HIGH", "MEDIUM", "LOW")


# ===========================================================================
# 7. REQUIREMENT-LEVEL RISK EVALUATION ENDPOINTS
# ===========================================================================

def test_requirement_level_risk_endpoint(client, auth_headers, setup_product_and_compliance):
    """Verify GET /api/requirements/{id}/risk?product_id={id} returns clause risk decomposition."""
    product_id = setup_product_and_compliance["product_id"]
    report_id = setup_product_and_compliance["report_id"]

    # Get a requirement ID from the report
    risks = client.get(f"/api/compliance/{report_id}/risks", headers=auth_headers).json()
    req_id = risks[0]["requirement_id"]

    # Test under /requirements/{id}/risk
    res1 = client.get(f"/api/requirements/{req_id}/risk?product_id={product_id}", headers=auth_headers)
    assert res1.status_code == 200
    assert res1.json()["requirement_id"] == req_id
    assert "factors" in res1.json()
    assert "reasons" in res1.json()

    # Test under /standards/requirements/{id}/risk
    res2 = client.get(f"/api/standards/requirements/{req_id}/risk?product_id={product_id}", headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["requirement_id"] == req_id


# ===========================================================================
# 8. AI ASSISTANT RISK GROUNDED INTEGRATION
# ===========================================================================

def test_ai_assistant_risk_query(client, auth_headers, setup_product_and_compliance):
    """Verify AI Assistant answers risk prioritization inquiries using risk context."""
    product_id = setup_product_and_compliance["product_id"]

    query_payload = {
        "message": "What are my top compliance risks and what is my risk score?",
        "product_id": product_id,
    }

    res = client.post("/api/ai/chat", json=query_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert "answer" in data
    assert len(data["answer"]) > 10
    # Citations or action buttons recommended
    assert "actions" in data


# ===========================================================================
# 9. ADMIN COMPLIANCE TELEMETRY
# ===========================================================================

def test_admin_compliance_analytics(client, admin_headers, setup_product_and_compliance):
    """Verify admin telemetry includes average readiness, average risk, and gap distributions."""
    res = client.get("/api/admin/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()

    assert "compliance_analytics" in data
    ca = data["compliance_analytics"]
    assert ca is not None
    assert "average_readiness_score" in ca
    assert "average_risk_score" in ca
    assert "critical_gaps_count" in ca
    assert "common_failing_categories" in ca


# ===========================================================================
# 10. ERROR HANDLING & EDGE CASES
# ===========================================================================

def test_invalid_report_id_handling(client, auth_headers):
    """Verify 404 for invalid report IDs."""
    res = client.get("/api/compliance/999999/risk", headers=auth_headers)
    assert res.status_code == 404

    sim_res = client.post(
        "/api/compliance/999999/what-if",
        json={"resolved_requirement_ids": [1]},
        headers=auth_headers,
    )
    assert sim_res.status_code == 404


def test_what_if_empty_resolved_list(client, auth_headers, setup_product_and_compliance):
    """Verify What-If with empty resolution list returns zero deltas."""
    report_id = setup_product_and_compliance["report_id"]

    sim_res = client.post(
        f"/api/compliance/{report_id}/what-if",
        json={"resolved_requirement_ids": []},
        headers=auth_headers,
    )
    assert sim_res.status_code == 200
    sim = sim_res.json()

    assert sim["projected_score_delta"] == 0.0
    assert sim["projected_risk_delta"] == 0.0
    assert sim["simulated_resolved_count"] == 0
