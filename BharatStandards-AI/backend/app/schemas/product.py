from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    ANALYZING = "ANALYZING"
    READY = "READY"
    ARCHIVED = "ARCHIVED"


class RelevanceLevelEnum(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Commercial or technical name of the product")
    category: str = Field(..., min_length=2, max_length=100, description="Industrial or consumer sector category")
    description: Optional[str] = Field(None, max_length=2000, description="General product description and functionality")
    intended_use: Optional[str] = Field(None, max_length=2000, description="Operating environment and intended target application")
    manufacturer: Optional[str] = Field(None, max_length=255, description="OEM or manufacturing enterprise name")
    model_number: Optional[str] = Field(None, max_length=100, description="OEM model number or catalog designation")
    technical_details: Optional[str] = Field(None, max_length=4000, description="Technical characteristics, ratings, materials")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    intended_use: Optional[str] = Field(None, max_length=2000)
    manufacturer: Optional[str] = Field(None, max_length=255)
    model_number: Optional[str] = Field(None, max_length=100)
    technical_details: Optional[str] = Field(None, max_length=4000)
    status: Optional[ProductStatusEnum] = None


class StandardMatchResponse(BaseModel):
    standard_number: str = Field(..., description="Synthetic BIS standard code (e.g. DEMO-IS-001)")
    title: str = Field(..., description="Standard title and specification name")
    relevance: RelevanceLevelEnum = Field(..., description="Relevance level score: HIGH, MEDIUM, LOW")
    why_it_applies: str = Field(..., description="Technical rationale for match based on product parameters")
    source: str = Field("National Standards Repository (Synthetic Demo)", description="Originating authority or catalogue")
    is_demo: bool = Field(True, description="Strict indicator that this is synthetic hackathon demo data")


class ProductAnalysisResponse(BaseModel):
    product_id: int
    product_name: str
    status: str
    analyzed_at: datetime
    standards: List[StandardMatchResponse]
    summary: str
    disclaimer: str = (
        "BharatStandards AI provides AI-assisted informational and compliance-readiness guidance. "
        "It does not grant or represent official BIS certification. All standard codes shown with 'DEMO-' "
        "prefix represent synthetic demonstration data for evaluation purposes."
    )


class ProductResponse(BaseModel):
    id: int
    user_id: int
    name: str
    category: str
    description: Optional[str] = None
    intended_use: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    technical_details: Optional[str] = None
    status: str
    analysis_data: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
