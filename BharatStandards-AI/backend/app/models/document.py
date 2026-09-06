import enum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DocumentStatus(str, enum.Enum):
    """
    Lifecycle status for an ingested document.
    """
    UPLOADING = "UPLOADING"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    NEEDS_OCR = "NEEDS_OCR"
    FAILED = "FAILED"


class Document(Base):
    """
    Technical document, lab test report, or certificate uploaded for a product.
    Belongs strictly to one authenticated User and optionally links to a Product.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    filename = Column(String(255), nullable=False, unique=True, index=True)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False, default="PDF")
    mime_type = Column(String(100), nullable=False, default="application/pdf")
    file_size = Column(Integer, nullable=False, default=0)
    storage_path = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default=DocumentStatus.QUEUED.value)
    processing_error = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=False, default=0)
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
    user = relationship("User", back_populates="documents")
    product = relationship("Product", back_populates="documents")
    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentChunk.chunk_index",
    )

    @property
    def file_size_bytes(self) -> int:
        return self.file_size or 0

    @property
    def document_type(self) -> str:
        return self.file_type or "PDF"

    @property
    def title(self) -> str:
        return self.original_filename or self.filename

    @property
    def summary(self) -> str:
        return ""

    def __repr__(self):
        return f"<Document id={self.id} filename='{self.original_filename}' status='{self.status}'>"


class DocumentChunk(Base):
    """
    Individual extracted passage or text chunk from a processed document.
    Preserves page boundaries and section hierarchy for compliance evidence retrieval.
    """
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index = Column(Integer, nullable=False, index=True)
    content = Column(Text, nullable=False)
    page = Column(Integer, nullable=False, default=1, index=True)
    section = Column(String(255), nullable=True)
    char_count = Column(Integer, nullable=False, default=0)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship back to Document
    document = relationship("Document", back_populates="chunks")

    def __repr__(self):
        return f"<DocumentChunk id={self.id} doc={self.document_id} page={self.page} chunk={self.chunk_index}>"
