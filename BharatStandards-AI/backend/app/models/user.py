import datetime
import enum
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    INDUSTRY = "industry"
    CONSUMER = "consumer"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class User(Base):
    """
    User account model for authentication, authorization, and administrative governance.
    Supports user personas ('industry', 'consumer', 'USER') and administrative governance ('ADMIN').
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.USER.value)
    status = Column(String(50), nullable=False, default=UserStatus.ACTIVE.value)
    is_active = Column(Boolean, nullable=False, default=True)
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

    # 1-to-1 relationship with Profile
    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with Product
    products = relationship(
        "Product",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with Document
    documents = relationship(
        "Document",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with ComplianceReport
    compliance_reports = relationship(
        "ComplianceReport",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with Conversation
    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with AuditLog
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with Notification
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
