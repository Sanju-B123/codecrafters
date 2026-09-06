"""
BharatStandards AI - Base Source Loader
Abstract interface and canonical ingestion payload structure for knowledge ingestion.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IngestionPayload(BaseModel):
    """
    Standardized in-memory representation of extracted standards knowledge
    prior to validation, normalization, and draft persistence.
    """
    source_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    standards: List[Dict[str, Any]] = Field(default_factory=list)
    requirements: List[Dict[str, Any]] = Field(default_factory=list)
    raw_record_count: int = 0
    format_type: str = "json"


class BaseSourceLoader(ABC):
    """
    Abstract loader interface for ingestion formats (JSON, CSV, markdown, etc.).
    """

    @abstractmethod
    def can_load(self, filename: str, content_type: Optional[str] = None) -> bool:
        """Determines if this loader can parse the specified file."""
        pass

    @abstractmethod
    def load(self, raw_bytes: bytes, filename: str = "") -> IngestionPayload:
        """Parses the raw file bytes into a structured IngestionPayload."""
        pass
