"""
BharatStandards AI - BIS Service Schemas
Defines request/response Pydantic models for BIS services, guided checklists,
roadmaps, and deterministic recommendations.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ServiceStep(BaseModel):
    """
    Individual step in a guided compliance journey roadmap.
    """
    step_number: int = Field(..., description="Chronological phase number")
    title: str = Field(..., description="Step title")
    description: str = Field(..., description="Actionable description")
    action_type: Optional[str] = Field(None, description="Reusable action type e.g. VIEW_STANDARD, UPLOAD_DOCUMENT")
    action_target: Optional[str] = Field(None, description="Internal route destination or official resource")


class ActionItem(BaseModel):
    """
    Concrete actionable recommendation.
    """
    action_type: str = Field(..., description="VIEW_STANDARD, UPLOAD_DOCUMENT, FIX_GAP, RUN_COMPLIANCE_CHECK, VIEW_SERVICE, OPEN_OFFICIAL_SOURCE, CONTACT_AUTHORITY")
    label: str = Field(..., description="Button or action label")
    target: str = Field(..., description="Navigation route or destination")
    description: Optional[str] = Field(None, description="Explanation of why this action is recommended")
    priority: Optional[str] = Field("MEDIUM", description="CRITICAL, HIGH, MEDIUM, LOW")


class BISServiceResponse(BaseModel):
    """
    Comprehensive BIS service, scheme, or guidance representation.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_code: str
    name: str
    description: str
    category: str
    user_type: str
    eligibility: str
    required_documents: List[Any] = []
    steps: List[Any] = []
    official_source_name: Optional[str] = None
    official_source_url: Optional[str] = None
    is_demo: bool = True
    status: str
    created_at: datetime
    updated_at: datetime


class ServiceListResponse(BaseModel):
    """
    Paginated BIS services catalogue.
    """
    items: List[BISServiceResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ServiceRecommendationResponse(BaseModel):
    """
    Deterministic guidance recommendation linking product characteristics and gap analysis.
    """
    service: BISServiceResponse
    match_reason: str
    priority: str = "MEDIUM"
    suggested_actions: List[ActionItem] = []
    is_demo: bool = True


class ComplianceNextStepsResponse(BaseModel):
    """
    Prioritized action plan derived from a compliance audit.
    """
    report_id: int
    product_id: int
    product_name: str
    readiness_score: float
    status: str
    prioritized_actions: List[ActionItem] = []
    recommended_services: List[ServiceRecommendationResponse] = []
    summary: Optional[str] = None
