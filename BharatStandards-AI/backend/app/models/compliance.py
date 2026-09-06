import enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ReportStatus(str, enum.Enum):
    """
    Lifecycle execution status of a compliance readiness assessment.
    """
    NOT_STARTED = "NOT_STARTED"
    ANALYZING = "ANALYZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ComplianceStatus(str, enum.Enum):
    """
    Audit determination for an individual requirement clause.
    """
    PASS = "PASS"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"


class ConfidenceLevel(str, enum.Enum):
    """
    Confidence grading of the evidence matching outcome.
    """
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class GapPriority(str, enum.Enum):
    """
    Risk severity ranking for compliance gaps.
    """
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ComplianceReport(Base):
    """
    Compliance readiness assessment report compiled for a Product against a Standard.
    Provides verifiable readiness score, requirement breakdown, and gap analysis.
    """
    __tablename__ = "compliance_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    standard_id = Column(
        Integer,
        ForeignKey("standards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    standard_version = Column(String(50), nullable=True)
    score = Column(Float, nullable=False, default=0.0)
    overall_risk_score = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)

    status = Column(String(50), nullable=False, default=ReportStatus.COMPLETED.value)
    total_requirements = Column(Integer, nullable=False, default=0)
    passed_count = Column(Integer, nullable=False, default=0)
    partial_count = Column(Integer, nullable=False, default=0)
    missing_count = Column(Integer, nullable=False, default=0)
    summary = Column(Text, nullable=True)
    scoring_methodology = Column(Text, nullable=True)
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
    user = relationship("User", back_populates="compliance_reports")
    product = relationship("Product", back_populates="compliance_reports")
    standard = relationship("Standard", back_populates="compliance_reports")
    results = relationship(
        "ComplianceResult",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="ComplianceResult.id",
    )
    gaps = relationship(
        "Gap",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="Gap.id",
    )
    risks = relationship(
        "ComplianceRisk",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="ComplianceRisk.id",
    )

    def __repr__(self):
        return (
            f"<ComplianceReport id={self.id} product_id={self.product_id} "
            f"score={self.score}% risk={self.overall_risk_score} status='{self.status}'>"
        )


class ComplianceResult(Base):
    """
    Clause-by-clause audit evaluation outcome linking a Requirement to Evidence.
    Includes deterministic status, confidence score, rationale, and recommended action.
    """
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(
        Integer,
        ForeignKey("compliance_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requirement_id = Column(
        Integer,
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(50), nullable=False, default=ComplianceStatus.MISSING.value)
    evidence = Column(Text, nullable=True)  # JSON or structured summary of matching evidence
    confidence = Column(String(50), nullable=False, default=ConfidenceLevel.HIGH.value)
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    weight = Column(Float, nullable=False, default=1.0)
    score_contribution = Column(Float, nullable=False, default=0.0)
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
    report = relationship("ComplianceReport", back_populates="results")
    requirement = relationship("Requirement")

    def __repr__(self):
        return (
            f"<ComplianceResult id={self.id} report_id={self.report_id} "
            f"requirement_id={self.requirement_id} status='{self.status}'>"
        )


class Gap(Base):
    """
    Non-conformance or partial documentation gap identified during compliance assessment.
    Ranked by priority to drive the action plan.
    """
    __tablename__ = "compliance_gaps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(
        Integer,
        ForeignKey("compliance_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requirement_id = Column(
        Integer,
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    priority = Column(String(50), nullable=False, default=GapPriority.HIGH.value)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    report = relationship("ComplianceReport", back_populates="gaps")
    requirement = relationship("Requirement")

    def __repr__(self):
        return (
            f"<Gap id={self.id} report_id={self.report_id} priority='{self.priority}'>"
        )


class ComplianceRisk(Base):
    """
    Clause-level explainable risk assessment generated by ComplianceRiskEngine.
    Quantifies the severity, likelihood, and compliance consequences of an identified gap.
    """
    __tablename__ = "compliance_risks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    compliance_report_id = Column(
        Integer,
        ForeignKey("compliance_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requirement_id = Column(
        Integer,
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    risk_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(50), nullable=False, default=GapPriority.MEDIUM.value)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), nullable=False, default=ComplianceStatus.MISSING.value)
    reasons = Column(Text, nullable=True)  # JSON-encoded array of human-readable rationale strings
    calculated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    report = relationship("ComplianceReport", back_populates="risks")
    requirement = relationship("Requirement")
    factors = relationship(
        "RiskFactor",
        back_populates="risk",
        cascade="all, delete-orphan",
        order_by="RiskFactor.id",
    )

    def __repr__(self):
        return (
            f"<ComplianceRisk id={self.id} report_id={self.compliance_report_id} "
            f"requirement_id={self.requirement_id} score={self.risk_score} level='{self.risk_level}'>"
        )


class RiskFactor(Base):
    """
    Individual explainable factor contributing to a clause's risk score.
    Makes the risk engine 100% transparent and eliminates black-box scoring.
    """
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    risk_id = Column(
        Integer,
        ForeignKey("compliance_risks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    factor_type = Column(String(100), nullable=False)  # REQUIREMENT_PRIORITY, COMPLIANCE_STATUS, EVIDENCE, CONFIDENCE
    factor_value = Column(String(100), nullable=False)  # e.g., "HIGH", "MISSING", "NOT_FOUND", "LOW"
    weight = Column(Float, nullable=False, default=1.0)
    contribution = Column(Float, nullable=False, default=0.0)

    # Relationships
    risk = relationship("ComplianceRisk", back_populates="factors")

    def __repr__(self):
        return (
            f"<RiskFactor id={self.id} risk_id={self.risk_id} "
            f"type='{self.factor_type}' contribution={self.contribution}>"
        )
