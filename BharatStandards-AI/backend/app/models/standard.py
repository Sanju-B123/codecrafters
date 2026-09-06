import enum
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class StandardStatus(str, enum.Enum):
    """
    Status of an Indian Standard or Quality Control Order (QCO).
    """
    ACTIVE = "ACTIVE"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"
    WITHDRAWN = "WITHDRAWN"
    DEMO = "DEMO"


class RequirementCategory(str, enum.Enum):
    """
    Technical categorization for standard clauses and compliance criteria.
    """
    SAFETY = "SAFETY"
    PERFORMANCE = "PERFORMANCE"
    TESTING = "TESTING"
    DOCUMENTATION = "DOCUMENTATION"
    MARKING = "MARKING"
    PACKAGING = "PACKAGING"
    MATERIAL = "MATERIAL"
    OTHER = "OTHER"


class RequirementPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RequirementStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"


class Standard(Base):
    """
    Indian Standard (IS) or Technical Regulation specification.
    Serves as the root entity for requirements and future RAG retrieval.
    """
    __tablename__ = "standards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    standard_number = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    scope = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    version = Column(String(50), nullable=False, default="2026")
    status = Column(String(50), nullable=False, default=StandardStatus.DEMO.value)
    source = Column(String(255), nullable=False, default="Synthetic Demo Knowledge Base")
    source_url = Column(String(500), nullable=True)
    publication_date = Column(DateTime(timezone=True), nullable=True)
    is_demo = Column(Boolean, nullable=False, default=True)
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

    @property
    def source_name(self) -> str:
        return self.source

    @source_name.setter
    def source_name(self, value: str):
        self.source = value

    @property
    def code(self) -> str:
        return self.standard_number

    @code.setter
    def code(self, value: str):
        self.standard_number = value

    # 1-to-many relationship with Requirement
    requirements = relationship(
        "Requirement",
        back_populates="standard",
        cascade="all, delete-orphan",
        order_by="Requirement.clause",
    )

    # 1-to-many relationship with ComplianceReport
    compliance_reports = relationship(
        "ComplianceReport",
        back_populates="standard",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Standard id={self.id} number='{self.standard_number}' status='{self.status}'>"


class Requirement(Base):
    """
    Individual technical clause or requirement within an Indian Standard.
    Traceable to source pages, documents, and testing verification methods.
    """
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    standard_id = Column(
        Integer,
        ForeignKey("standards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    clause = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default=RequirementCategory.SAFETY.value)
    priority = Column(String(50), nullable=False, default=RequirementPriority.HIGH.value)
    evidence_types = Column(JSON, nullable=True)
    status = Column(String(50), nullable=False, default=RequirementStatus.ACTIVE.value)
    evidence_required = Column(Text, nullable=True)
    verification_method = Column(Text, nullable=True)
    weight = Column(Float, nullable=False, default=2.0)
    page = Column(Integer, nullable=True)
    source = Column(String(255), nullable=False, default="Synthetic Demo Knowledge Base")
    source_url = Column(String(500), nullable=True)
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

    @property
    def test_method(self) -> str:
        return self.verification_method

    @test_method.setter
    def test_method(self, value: str):
        self.verification_method = value

    # Relationship back to Standard
    standard = relationship("Standard", back_populates="requirements")

    def __repr__(self):
        return f"<Requirement id={self.id} clause='{self.clause}' standard_id={self.standard_id}>"

