from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentStatusEnum(str, Enum):
    UPLOADING = "UPLOADING"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    NEEDS_OCR = "NEEDS_OCR"
    FAILED = "FAILED"


class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    page: int
    section: Optional[str] = None
    char_count: int
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    filename: str
    original_filename: str
    file_type: str
    mime_type: str
    file_size: int
    status: str
    processing_error: Optional[str] = None
    page_count: int = 0
    chunks_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DocumentStatusResponse(BaseModel):
    id: int
    status: str
    page_count: int = 0
    processing_error: Optional[str] = None


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DocumentSearchResult(BaseModel):
    chunk_id: int
    page: int
    section: Optional[str] = None
    snippet: str
    full_content: str
