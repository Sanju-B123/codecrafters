"""
BharatStandards AI - Admin Pydantic Schemas
Defines request and response schemas for administrative management endpoints.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------
# Health & Dashboard Schemas
# ---------------------------------------------------------
class SubsystemHealth(BaseModel):
    status: str
    latency_ms: Optional[float] = None
    details: str


class AdminHealthResponse(BaseModel):
    overall_status: str
    timestamp: str
    subsystems: Dict[str, SubsystemHealth]


class TopStandardItem(BaseModel):
    code: str
    title: str
    evaluations: int


class TopGapItem(BaseModel):
    description: str
    priority: str
    count: int


class DailyVelocityItem(BaseModel):
    date: str
    label: str
    events: int
    reports: int


class DashboardTotals(BaseModel):
    users: int
    admins: int
    suspended_users: int
    products: int
    standards: int
    archived_standards: int
    requirements: int
    documents: int
    reports: int
    bis_services: int
    audit_events: int
    indexed_items: int
    unindexed_items: int


class RecentVelocity(BaseModel):
    new_users: int
    new_reports: int
    audit_events: int


class AIAnalyticsMetrics(BaseModel):
    total_queries: int = 0
    requests_today: int = 0
    avg_response_time_ms: float = 0.0
    low_confidence_responses: int = 0
    retrieval_failures: int = 0
    ai_errors: int = 0
    has_data: bool = False


class FailingCategoryItem(BaseModel):
    category: str
    failure_count: int


class ComplianceRiskAnalytics(BaseModel):
    total_evaluations: int = 0
    average_readiness_score: float = 0.0
    average_risk_score: float = 0.0
    critical_gaps_count: int = 0
    high_gaps_count: int = 0
    medium_gaps_count: int = 0
    low_gaps_count: int = 0
    common_failing_categories: List[FailingCategoryItem] = []


class AdminDashboardMetricsResponse(BaseModel):
    totals: DashboardTotals
    recent_7d: RecentVelocity
    ai_analytics: Optional[AIAnalyticsMetrics] = None
    compliance_analytics: Optional[ComplianceRiskAnalytics] = None
    top_standards: List[TopStandardItem]
    top_gaps: List[TopGapItem]
    daily_velocity: List[DailyVelocityItem]


# ---------------------------------------------------------
# User Management Schemas
# ---------------------------------------------------------
class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    products_count: int = 0
    reports_count: int = 0


class AdminUpdateUserRequest(BaseModel):
    role: Optional[str] = Field(None, description="Role: USER, ADMIN, industry, consumer")
    status: Optional[str] = Field(None, description="Status: ACTIVE, SUSPENDED")


# ---------------------------------------------------------
# Standard & Requirement Schemas
# ---------------------------------------------------------
class AdminRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    standard_id: int
    clause: str
    title: str
    description: str
    category: str
    priority: str
    evidence_types: Optional[List[str]] = None
    status: str
    evidence_required: Optional[str] = None
    verification_method: Optional[str] = None
    weight: float
    page: Optional[int] = None
    source: str
    source_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AdminRequirementCreateRequest(BaseModel):
    clause: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5)
    category: str = Field(default="SAFETY")
    priority: str = Field(default="HIGH")
    evidence_types: Optional[List[str]] = Field(default=["test_report"])
    evidence_required: Optional[str] = None
    verification_method: Optional[str] = None
    weight: float = Field(default=2.0)
    page: Optional[int] = None
    source: Optional[str] = "Bureau of Indian Standards Official Gazette"
    source_url: Optional[str] = None


class AdminRequirementUpdateRequest(BaseModel):
    clause: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    evidence_types: Optional[List[str]] = None
    status: Optional[str] = None
    evidence_required: Optional[str] = None
    verification_method: Optional[str] = None
    weight: Optional[float] = None
    page: Optional[int] = None
    source: Optional[str] = None
    source_url: Optional[str] = None


class AdminStandardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    standard_number: str
    code: str
    title: str
    category: str
    scope: Optional[str] = None
    description: Optional[str] = None
    version: str
    status: str
    source: str
    source_name: str
    source_url: Optional[str] = None
    publication_date: Optional[datetime] = None
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    requirements_count: int = 0
    quality_score: Optional[int] = None
    quality_tier: Optional[str] = None
    index_status: Optional[str] = None


class AdminStandardDetailResponse(AdminStandardResponse):
    requirements: List[AdminRequirementResponse] = []
    quality_breakdown: Optional[Dict[str, Any]] = None


class AdminStandardCreateRequest(BaseModel):
    standard_number: str = Field(..., min_length=3, max_length=100, description="e.g. IS 13252 (Part 1):2010")
    title: str = Field(..., min_length=3, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    scope: Optional[str] = None
    description: Optional[str] = None
    version: str = Field(default="2026")
    status: str = Field(default="ACTIVE")
    source: str = Field(default="Bureau of Indian Standards (BIS)")
    source_url: Optional[str] = None
    publication_date: Optional[datetime] = None
    is_demo: bool = Field(default=False)


class AdminStandardUpdateRequest(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    scope: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    publication_date: Optional[datetime] = None
    is_demo: Optional[bool] = None


# ---------------------------------------------------------
# Document Schemas (Platform Wide)
# ---------------------------------------------------------
class AdminDocumentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    user_id: int
    user_email: Optional[str] = None
    filename: str
    file_type: str
    file_size_bytes: int
    document_type: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Knowledge Base & Indexing Schemas
# ---------------------------------------------------------
class AdminKnowledgeSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_type: str
    name: str
    url: Optional[str] = None
    description: Optional[str] = None
    authority_level: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class AdminKnowledgeSourceCreateRequest(BaseModel):
    source_type: str = Field(default="DEMO", description="OFFICIAL, USER_PROVIDED, or DEMO")
    name: str = Field(..., min_length=3, max_length=255)
    url: Optional[str] = None
    description: Optional[str] = None
    authority_level: str = Field(default="HIGH", description="HIGH, MEDIUM, LOW")
    is_verified: bool = Field(default=False)


class AdminKnowledgeIndexResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    entity_id: int
    index_status: str
    embedding_model: Optional[str] = None
    indexed_at: Optional[datetime] = None
    updated_at: datetime


# ---------------------------------------------------------
# BIS Services Schemas
# ---------------------------------------------------------
class AdminBISServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_code: str
    title: str
    description: str
    category: str
    user_type: str
    status: str
    action_type: str
    portal_name: Optional[str] = None
    portal_url: Optional[str] = None
    help_text: Optional[str] = None
    estimated_timeline: Optional[str] = None
    applicable_standards: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AdminBISServiceCreateRequest(BaseModel):
    service_code: str = Field(..., min_length=2, max_length=50)
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: str = Field(default="CERTIFICATION")
    user_type: str = Field(default="INDUSTRY")
    status: str = Field(default="ACTIVE")
    action_type: str = Field(default="ONLINE_PORTAL")
    portal_name: Optional[str] = None
    portal_url: Optional[str] = None
    help_text: Optional[str] = None
    estimated_timeline: Optional[str] = None
    applicable_standards: Optional[str] = None
    is_active: bool = Field(default=True)


class AdminBISServiceUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    user_type: Optional[str] = None
    status: Optional[str] = None
    action_type: Optional[str] = None
    portal_name: Optional[str] = None
    portal_url: Optional[str] = None
    help_text: Optional[str] = None
    estimated_timeline: Optional[str] = None
    applicable_standards: Optional[str] = None
    is_active: Optional[bool] = None
