"""
BharatStandards AI - Admin Knowledge Pipeline Schemas
Data transfer objects for ingestion, preview, import jobs, draft review, and quality health telemetry.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ValidationErrorDetail(BaseModel):
    record_type: str
    index_or_row: str
    identifier: Optional[str] = None
    field: str
    error: str


class KnowledgeImportPreviewResponse(BaseModel):
    filename: str
    format_type: str
    total_records: int
    valid_records: int
    invalid_records: int
    is_valid: bool
    errors: List[ValidationErrorDetail] = Field(default_factory=list)
    duplicates_found: int
    duplicate_matches: List[Dict[str, Any]] = Field(default_factory=list)
    standards_count: int
    requirements_count: int
    standards_preview: List[Dict[str, Any]] = Field(default_factory=list)
    requirements_preview: List[Dict[str, Any]] = Field(default_factory=list)
    source_metadata: Optional[Dict[str, Any]] = None


class KnowledgeImportRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    record_type: str
    external_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_entity_type: Optional[str] = None
    created_entity_id: Optional[int] = None
    raw_data: Optional[Dict[str, Any]] = None
    normalized_data: Optional[Dict[str, Any]] = None
    created_at: datetime


class KnowledgeImportJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: str
    total_records: int
    processed_records: int
    successful_records: int
    failed_records: int
    error_summary: Optional[str] = None
    created_by: Optional[int] = None
    source_id: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class KnowledgeDraftStandardItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    standard_number: str
    title: str
    code: Optional[str] = None
    category: str
    description: Optional[str] = None
    status: str
    version: Optional[str] = None
    effective_date: Optional[datetime] = None
    provenance_type: Optional[str] = None
    created_at: datetime


class KnowledgeDraftRequirementItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    standard_id: int
    standard_number: Optional[str] = None
    clause: str
    title: str
    description: str
    verification_method: Optional[str] = None
    evidence_required: Optional[str] = None
    weight: Optional[float] = 2.0
    priority: Optional[str] = "HIGH"
    status: str
    created_at: datetime


class KnowledgeDraftsInboxResponse(BaseModel):
    total_drafts: int
    standards: List[KnowledgeDraftStandardItem] = Field(default_factory=list)
    requirements: List[KnowledgeDraftRequirementItem] = Field(default_factory=list)


class KnowledgeActionResponse(BaseModel):
    success: bool
    message: str
    entity_type: str
    entity_id: int
    new_status: str


class KnowledgeHealthResponse(BaseModel):
    total_standards: int
    active_standards: int
    draft_standards: int
    archived_standards: int
    total_requirements: int
    active_requirements: int
    draft_requirements: int
    archived_requirements: int
    verified_sources: int
    unverified_sources: int
    user_provided_sources: int
    demo_sources: int
    pending_review_count: int
    index_pending: int
    index_failed: int
    quality_score: float
    last_review_threshold_days: int = 180


class KnowledgeRecordItem(BaseModel):
    id: int
    entity_type: str  # STANDARD or REQUIREMENT
    code: str  # standard_number or clause
    title: str
    category: Optional[str] = None
    status: str  # DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ARCHIVED, ACTIVE, DEMO
    source: Optional[str] = None
    source_type: str = "OFFICIAL"  # VERIFIED, USER PROVIDED, DEMO/SYNTHETIC, AI GENERATED
    authority: str = "HIGH"
    version: Optional[str] = None
    verification_status: str = "VERIFIED"
    imported_date: Optional[datetime] = None
    last_verified_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    is_demo: bool = False
    index_status: Optional[str] = "INDEXED"


class KnowledgeRecordsListResponse(BaseModel):
    total: int
    items: List[KnowledgeRecordItem] = Field(default_factory=list)


class KnowledgeSourceDetailResponse(BaseModel):
    id: int
    source_type: str
    name: str
    url: Optional[str] = None
    description: Optional[str] = None
    authority_level: str
    is_verified: bool
    last_checked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

