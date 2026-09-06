"""
BharatStandards AI - Compliance Pydantic Schemas
Defines request/response contracts for compliance checking, requirement assessments,
gap prioritization, and executive summaries.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ComplianceCheckRequest(BaseModel):
    """
    Request payload to initiate a compliance readiness audit.
    """
    product_id: int = Field(..., description="ID of the product to evaluate")
    standard_id: int = Field(..., description="ID of the Indian Standard to assess against")


class RequirementBrief(BaseModel):
    """
    Brief requirement clause details embedded within assessment results.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    clause: str
    title: str
    category: str
    description: str
    verification_method: Optional[str] = None
    weight: Optional[float] = 2.0


class ComplianceResultResponse(BaseModel):
    """
    Individual clause evaluation determination.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    requirement_id: int
    requirement: Optional[RequirementBrief] = None
    status: str
    evidence: Optional[str] = None
    confidence: str
    reason: str
    recommended_action: str
    weight: float
    score_contribution: float
    created_at: datetime


class GapResponse(BaseModel):
    """
    Compliance deficiency or documentation gap.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    requirement_id: int
    requirement: Optional[RequirementBrief] = None
    priority: str
    description: str
    evidence: Optional[str] = None
    recommended_action: str
    created_at: datetime


class ComplianceReportResponse(BaseModel):
    """
    High-level compliance report details.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    standard_id: int
    score: float
    status: str
    total_requirements: int
    passed_count: int
    partial_count: int
    missing_count: int
    summary: Optional[str] = None
    scoring_methodology: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Augmented fields populated dynamically
    product_name: Optional[str] = None
    standard_number: Optional[str] = None
    standard_title: Optional[str] = None
    overall_risk_score: Optional[float] = None
    risk_level: Optional[str] = None


class ComplianceReportDetailResponse(ComplianceReportResponse):
    """
    Comprehensive compliance report with complete requirement breakdown and gap register.
    """
    results: List[ComplianceResultResponse] = []
    gaps: List[GapResponse] = []


class ComplianceReportSummaryResponse(BaseModel):
    """
    Executive summary metrics for a compliance assessment run.
    """
    id: int
    product_id: int
    product_name: str
    standard_id: int
    standard_number: str
    score: float
    overall_risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    status: str
    total_requirements: int
    passed_count: int
    partial_count: int
    missing_count: int
    critical_gaps: int
    high_gaps: int
    medium_gaps: int
    low_gaps: int
    total_gaps: int
    summary: Optional[str] = None
    scoring_methodology: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Step 18: Risk Engine & What-If Pydantic Schemas
# ---------------------------------------------------------------------------

class RiskFactorDetail(BaseModel):
    """
    Explainable factor contribution breakdown for a requirement risk score.
    """
    factor_type: str  # REQUIREMENT_PRIORITY, COMPLIANCE_STATUS, EVIDENCE, CONFIDENCE
    factor_value: str
    weight: float
    contribution: float


class ComplianceRiskItem(BaseModel):
    """
    Detailed clause-level risk item.
    """
    id: Optional[int] = None
    requirement_id: int
    clause: str
    title: str
    risk_score: float
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    status: str
    reasons: List[str] = []
    factors: List[RiskFactorDetail] = []
    recommended_action: str
    potential_risk_reduction: float = 0.0


class TopRiskItem(BaseModel):
    """
    Top risk summary card item.
    """
    requirement_id: int
    clause: str
    title: str
    risk_score: float
    risk_level: str
    status: str
    reason: str
    recommended_action: str
    factors: List[RiskFactorDetail] = []


class RiskActionPlanItem(BaseModel):
    """
    Prioritized action item ranked by potential risk reduction.
    """
    action: str
    priority: str  # CRITICAL, HIGH, MEDIUM, LOW
    related_requirement_id: int
    clause: str
    risk_reduction_potential: float
    reason: str


class ProductRiskSummaryResponse(BaseModel):
    """
    Comprehensive risk overview for a product assessment.
    """
    product_id: int
    compliance_report_id: int
    overall_risk_score: float
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    top_risks: List[TopRiskItem] = []
    recommended_actions: List[RiskActionPlanItem] = []
    calculated_at: datetime
    disclaimer: str = "BharatStandards AI Risk Classification - Not an official BIS risk rating."


class WhatIfRequest(BaseModel):
    """
    Payload to simulate resolving specific compliance gaps.
    """
    resolved_requirement_ids: List[int] = Field(
        default_factory=list,
        description="List of requirement IDs simulated as fully resolved / passing",
    )


class WhatIfRemainingGap(BaseModel):
    """
    Gap item that remains open after What-If scenario simulation.
    """
    requirement_id: int
    clause: str
    title: str
    priority: str
    risk_score: float


class WhatIfResponse(BaseModel):
    """
    Scenario estimate showing projected readiness score and risk reduction.
    """
    compliance_report_id: Optional[int] = None
    report_id: Optional[int] = None
    original_score: float
    current_score: float
    projected_score: float
    estimated_score: float
    projected_score_delta: float = 0.0
    potential_score_improvement: float = 0.0
    original_risk_score: float
    current_risk: float
    original_risk_level: str = "LOW"
    projected_risk_score: float
    estimated_risk: float
    projected_risk_level: str = "LOW"
    projected_risk_delta: float = 0.0
    potential_risk_reduction: float = 0.0
    simulated_resolved_count: int = 0
    resolved_count: int = 0
    remaining_gaps: List[WhatIfRemainingGap] = []
    disclaimer: str = (
        "Scenario estimate based on current assessment. "
        "Does not guarantee official BIS certification or legal conformity."
    )


class RiskRecalculateResponse(BaseModel):
    """
    Response returned after recalculating risk assessment.
    """
    compliance_report_id: int
    overall_risk_score: float
    risk_level: str
    recalculated_at: datetime
    message: str
    risk_summary: Optional[ProductRiskSummaryResponse] = None


