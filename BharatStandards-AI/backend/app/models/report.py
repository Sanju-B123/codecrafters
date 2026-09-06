"""
BharatStandards AI - Report Database Model
Defines the Report entity linking authenticated users to compliance readiness audit assessments.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Report(Base):
    """
    SQLAlchemy entity representing an official or demonstration compliance readiness report.
    References the ComplianceReport as the single source of truth for all scores, clause determinations,
    and empirical citations.
    """
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    compliance_report_id = Column(Integer, ForeignKey("compliance_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="COMPLETED")
    pdf_path = Column(String(500), nullable=True)

    generated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", backref="reports")
    compliance_report = relationship("ComplianceReport", backref="dossier_reports")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "compliance_report_id": self.compliance_report_id,
            "report_number": self.report_number,
            "title": self.title,
            "status": self.status,
            "generated_at": self.generated_at,
            "created_at": self.created_at,
        }
