"""
BharatStandards AI - Compliance Report Schemas
Defines request/response contracts for structured readiness dossiers,
requirement matrices, empirical evidence audits, and exportable reports.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ReportGenerateRequest(BaseModel):
    """
    Request payload to generate an official compliance readiness report.
    """
    compliance_report_id: int = Field(..., description="ID of the completed compliance assessment")


class ReportBriefResponse(BaseModel):
    """
    Summary representation for report listings and dashboard widgets.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_number: str
    title: str
    compliance_report_id: int
    product_id: int
    product_name: str
    standard_id: int
    standard_number: str
    standard_title: str
    readiness_score: float
    status: str
    total_requirements: int
    passed_count: int
    partial_count: int
    missing_count: int
    is_demo: bool = True
    generated_at: datetime
    created_at: datetime


class ReportAssessmentItem(BaseModel):
    """
    Clause-by-clause requirement assessment with citation and audit trace.
    """
    clause: str
    title: str
    category: str
    status: str  # PASS, PARTIAL, MISSING
    confidence: str
    evidence: Optional[str] = None
    reason: str
    recommended_action: str
    weight: float
    document_name: Optional[str] = None
    page: Optional[int] = None
    snippet: Optional[str] = None


class ReportGapItem(BaseModel):
    """
    Deficiency or documentation non-conformance item.
    """
    priority: str  # CRITICAL, HIGH, MEDIUM, LOW
    clause: str
    requirement_title: str
    problem: str
    current_evidence: Optional[str] = None
    recommended_action: str


class ReportActionPlanItem(BaseModel):
    """
    Prioritized action item for closing compliance gaps.
    """
    priority: str
    action: str
    related_requirement: str
    reason: str
    target_route: Optional[str] = None


class ReportSourceItem(BaseModel):
    """
    Authoritative or empirical source reference.
    """
    source_type: str  # OFFICIAL_STANDARD, USER_DOCUMENT, SYNTHETIC_DEMO
    name: str
    reference: str
    details: Optional[str] = None
    url: Optional[str] = None


class ReportProductInfo(BaseModel):
    """
    Product metadata included in the report dossier.
    """
    id: int
    name: str
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    category: str
    description: Optional[str] = None
    intended_use: Optional[str] = None
    technical_details: Optional[str] = None


class ReportStandardInfo(BaseModel):
    """
    Standard specifications against which the product was audited.
    """
    id: int
    standard_number: str
    title: str
    category: str
    version: Optional[str] = None
    status: str
    scope: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None


class ReportHistoryItem(BaseModel):
    """
    Historical assessment version for trend tracking.
    """
    version: int
    report_id: Optional[int] = None
    report_number: Optional[str] = None
    compliance_report_id: int
    readiness_score: float
    passed_count: int
    partial_count: int
    missing_count: int
    generated_at: datetime
    status: str


class ReportDetailResponse(BaseModel):
    """
    Complete, presentation-ready compliance readiness report dossier.
    """
    id: int
    report_number: str
    title: str
    compliance_report_id: int
    generated_at: datetime
    status: str
    is_demo: bool = True
    readiness_score: float
    passed_count: int
    partial_count: int
    missing_count: int
    total_requirements: int
    critical_gaps_count: int = 0
    high_gaps_count: int = 0
    summary: str
    disclaimer: str

    product: ReportProductInfo
    standard: ReportStandardInfo
    overall_risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    top_risks: List[Dict[str, Any]] = []
    assessments: List[ReportAssessmentItem] = []
    gaps: List[ReportGapItem] = []
    action_plan: List[ReportActionPlanItem] = []
    sources: List[ReportSourceItem] = []
    history: List[ReportHistoryItem] = []
