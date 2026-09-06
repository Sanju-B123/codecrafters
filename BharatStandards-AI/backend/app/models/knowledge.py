"""
BharatStandards AI - Knowledge Source, Import Pipeline, & Quality Models
Provides data models for authoritative knowledge sources, ingestion jobs,
row-level import records, and semantic vector indexing lifecycle state.
"""
from datetime import datetime, timezone
import enum
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class KnowledgeSourceType(str, enum.Enum):
    OFFICIAL = "OFFICIAL"
    USER_PROVIDED = "USER_PROVIDED"
    DEMO = "DEMO"


KnowledgeProvenanceType = KnowledgeSourceType


class KnowledgeAuthorityLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class KnowledgeVerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class KnowledgeIndexStatus(str, enum.Enum):
    NOT_INDEXED = "NOT_INDEXED"
    INDEX_PENDING = "INDEX_PENDING"
    INDEXED = "INDEXED"
    INDEX_FAILED = "INDEX_FAILED"


class KnowledgeImportJobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


class KnowledgeImportRecordStatus(str, enum.Enum):
    PENDING = "PENDING"
    VALID = "VALID"
    INVALID = "INVALID"
    IMPORTED = "IMPORTED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class KnowledgeChangeAction(str, enum.Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class KnowledgeSource(Base):
    """
    Authoritative or empirical source reference repository used to validate standards facts,
    evidence trust hierarchies, and RAG retrieval priority.
    """
    __tablename__ = "knowledge_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_type = Column(String(50), nullable=False, default=KnowledgeSourceType.DEMO.value, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    authority_level = Column(String(50), nullable=False, default=KnowledgeAuthorityLevel.HIGH.value)
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_method = Column(String(255), nullable=True)
    verification_status = Column(
        String(50),
        nullable=False,
        default=KnowledgeVerificationStatus.UNVERIFIED.value,
        index=True,
    )
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    import_jobs = relationship(
        "KnowledgeImportJob",
        back_populates="source",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<KnowledgeSource id={self.id} name='{self.name}' type='{self.source_type}'>"


class KnowledgeImportJob(Base):
    """
    Asynchronous or transactional batch import job tracking knowledge files
    (JSON, CSV) through validation, normalization, and draft staging.
    """
    __tablename__ = "knowledge_import_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_id = Column(
        Integer,
        ForeignKey("knowledge_sources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    filename = Column(String(255), nullable=False)
    status = Column(
        String(50),
        nullable=False,
        default=KnowledgeImportJobStatus.QUEUED.value,
        index=True,
    )
    total_records = Column(Integer, nullable=False, default=0)
    processed_records = Column(Integer, nullable=False, default=0)
    successful_records = Column(Integer, nullable=False, default=0)
    failed_records = Column(Integer, nullable=False, default=0)
    error_summary = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator = relationship("User")
    source = relationship("KnowledgeSource", back_populates="import_jobs")
    records = relationship(
        "KnowledgeImportRecord",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="KnowledgeImportRecord.id",
    )

    def __repr__(self):
        return f"<KnowledgeImportJob id={self.id} file='{self.filename}' status='{self.status}'>"


class KnowledgeImportRecord(Base):
    """
    Row-level tracking for granular debugging of records parsed from an import file.
    Tracks validation errors, entity creation IDs, and raw vs normalized payloads.
    """
    __tablename__ = "knowledge_import_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(
        Integer,
        ForeignKey("knowledge_import_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_type = Column(String(50), nullable=False, index=True)  # 'standard', 'requirement', 'source'
    external_id = Column(String(100), nullable=True, index=True)
    status = Column(
        String(50),
        nullable=False,
        default=KnowledgeImportRecordStatus.PENDING.value,
        index=True,
    )
    error_message = Column(Text, nullable=True)
    created_entity_type = Column(String(50), nullable=True)
    created_entity_id = Column(Integer, nullable=True)
    raw_data = Column(JSON, nullable=True)
    normalized_data = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship
    job = relationship("KnowledgeImportJob", back_populates="records")

    def __repr__(self):
        return f"<KnowledgeImportRecord id={self.id} job_id={self.job_id} type='{self.record_type}' status='{self.status}'>"


class KnowledgeChangeLog(Base):
    """
    Dedicated audit and change tracking record specifically for knowledge base modifications.
    Captures creation, version transitions, approval, rejection, and archival.
    """
    __tablename__ = "knowledge_change_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    entity_type = Column(String(50), nullable=False, index=True)  # 'standard', 'requirement', 'knowledge_source'
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # 'CREATED', 'UPDATED', 'APPROVED', etc.
    old_version = Column(String(50), nullable=True)
    new_version = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship
    user = relationship("User")

    def __repr__(self):
        return f"<KnowledgeChangeLog id={self.id} entity={self.entity_type}:{self.entity_id} action='{self.action}'>"


class KnowledgeIndex(Base):
    """
    Tracks semantic vector indexing status for Standards, Clauses, and Document Chunks.
    Allows administrative oversight of RAG retrieval freshness without requiring synchronous embedding.
    """
    __tablename__ = "knowledge_indices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False, index=True)  # 'standard', 'requirement', 'document_chunk'
    entity_id = Column(Integer, nullable=False, index=True)
    index_status = Column(
        String(50),
        nullable=False,
        default=KnowledgeIndexStatus.NOT_INDEXED.value,
        index=True,
    )
    embedding_model = Column(String(100), nullable=True)
    indexed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_knowledge_index_entity", "entity_type", "entity_id", unique=True),
    )

    def __repr__(self):
        return (
            f"<KnowledgeIndex id={self.id} entity={self.entity_type}:{self.entity_id} "
            f"status={self.index_status}>"
        )
