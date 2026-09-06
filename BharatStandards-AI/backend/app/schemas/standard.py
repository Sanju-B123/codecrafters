from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class StandardStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    WITHDRAWN = "WITHDRAWN"
    DRAFT = "DRAFT"
    DEMO = "DEMO"


class RequirementCategoryEnum(str, Enum):
    SAFETY = "SAFETY"
    PERFORMANCE = "PERFORMANCE"
    TESTING = "TESTING"
    DOCUMENTATION = "DOCUMENTATION"
    MARKING = "MARKING"
    PACKAGING = "PACKAGING"
    MATERIAL = "MATERIAL"
    OTHER = "OTHER"


class RequirementResponse(BaseModel):
    id: int
    standard_id: int
    clause: str
    title: str
    description: str
    category: str
    evidence_required: Optional[str] = None
    verification_method: Optional[str] = None
    page: Optional[int] = None
    source: str
    source_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StandardResponse(BaseModel):
    id: int
    standard_number: str
    title: str
    category: str
    scope: Optional[str] = None
    description: Optional[str] = None
    version: str
    status: str
    source: str
    source_url: Optional[str] = None
    publication_date: Optional[datetime] = None
    is_demo: bool = True
    requirements_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StandardDetailResponse(StandardResponse):
    requirements: List[RequirementResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StandardListResponse(BaseModel):
    items: List[StandardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class StandardMatchResponse(BaseModel):
    standard_id: int
    standard_number: str
    title: str
    relevance: str = Field(..., description="HIGH, MEDIUM, or LOW")
    reason: str
    source: str = "National Standards Repository (Synthetic Demo)"
    is_demo: bool = True
