from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    """
    Immutable audit log entry recording all critical system, compliance, and user actions.
    Ensures end-to-end traceability for regulatory, quality, and enterprise audits.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    # Using 'metadata_json' as attribute name or 'metadata' as column name.
    # Note: In SQLAlchemy Base, `.metadata` is reserved for MetaData!
    # Therefore, we name the column "metadata" in DB but attribute "extra_metadata" or "metadata_info",
    # or Column("metadata", JSON). Let's use Column("metadata", JSON) mapped to extra_data or extra_metadata!
    extra_metadata = Column("metadata", JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_user_created", "user_id", "created_at"),
        Index("ix_audit_logs_user_action", "user_id", "action"),
        Index("ix_audit_logs_user_entity", "user_id", "entity_type"),
    )

    def __repr__(self):
        return (
            f"<AuditLog id={self.id} user_id={self.user_id} "
            f"action={self.action} entity={self.entity_type}:{self.entity_id}>"
        )
