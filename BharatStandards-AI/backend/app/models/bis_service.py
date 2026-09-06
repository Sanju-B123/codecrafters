"""
BharatStandards AI - BIS Service Model
Defines database entities for BIS services, procedural guidance, required document checklists,
and compliance journey steps.
"""
from datetime import datetime, timezone
import enum
import json
from typing import Any, List, Optional
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from app.core.database import Base


class ServiceCategory(str, enum.Enum):
    CERTIFICATION = "CERTIFICATION"
    REGISTRATION = "REGISTRATION"
    TESTING = "TESTING"
    LICENSING = "LICENSING"
    MARKING = "MARKING"
    PRODUCT_COMPLIANCE = "PRODUCT_COMPLIANCE"
    CONSUMER_GUIDANCE = "CONSUMER_GUIDANCE"
    OTHER = "OTHER"


class ServiceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INFORMATIONAL = "INFORMATIONAL"
    DEMO = "DEMO"
    ARCHIVED = "ARCHIVED"


class ServiceUserType(str, enum.Enum):
    INDUSTRY = "INDUSTRY"
    CONSUMER = "CONSUMER"
    BOTH = "BOTH"


class ServiceActionType(str, enum.Enum):
    VIEW_STANDARD = "VIEW_STANDARD"
    UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT"
    FIX_GAP = "FIX_GAP"
    RUN_COMPLIANCE_CHECK = "RUN_COMPLIANCE_CHECK"
    VIEW_SERVICE = "VIEW_SERVICE"
    OPEN_OFFICIAL_SOURCE = "OPEN_OFFICIAL_SOURCE"
    CONTACT_AUTHORITY = "CONTACT_AUTHORITY"


class BISService(Base):
    """
    SQLAlchemy entity representing an official or synthetic demonstration BIS service,
    conformity scheme, or compliance guidance module.
    """
    __tablename__ = "bis_services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    service_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default=ServiceCategory.OTHER.value, index=True)
    user_type = Column(String(50), nullable=False, default=ServiceUserType.BOTH.value, index=True)
    eligibility = Column(Text, nullable=False)
    
    # Structured JSON fields stored as serialized strings for SQLite/Postgres portability
    _required_documents = Column("required_documents", Text, nullable=False, default="[]")
    _steps = Column("steps", Text, nullable=False, default="[]")

    official_source_name = Column(String(255), nullable=True)
    official_source_url = Column(String(500), nullable=True)
    is_demo = Column(Boolean, nullable=False, default=True)
    status = Column(String(50), nullable=False, default=ServiceStatus.DEMO.value, index=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @property
    def title(self) -> str:
        return self.name


    @title.setter
    def title(self, value: str):
        self.name = value

    @property
    def portal_name(self) -> Optional[str]:
        return self.official_source_name

    @portal_name.setter
    def portal_name(self, value: Optional[str]):
        self.official_source_name = value

    @property
    def portal_url(self) -> Optional[str]:
        return self.official_source_url

    @portal_url.setter
    def portal_url(self, value: Optional[str]):
        self.official_source_url = value

    @property
    def action_type(self) -> str:
        return ServiceActionType.OPEN_OFFICIAL_SOURCE.value

    @action_type.setter
    def action_type(self, value: str):
        pass

    @property
    def is_active(self) -> bool:
        return self.status == ServiceStatus.ACTIVE.value

    @is_active.setter
    def is_active(self, value: bool):
        if value:
            self.status = ServiceStatus.ACTIVE.value
        else:
            self.status = ServiceStatus.ARCHIVED.value

    @property
    def required_documents(self) -> List[Any]:

        if not self._required_documents:
            return []
        try:
            return json.loads(self._required_documents)
        except (ValueError, TypeError):
            return []

    @required_documents.setter
    def required_documents(self, val: Any):
        if isinstance(val, (list, dict)):
            self._required_documents = json.dumps(val)
        elif isinstance(val, str):
            self._required_documents = val
        else:
            self._required_documents = "[]"

    @property
    def steps(self) -> List[Any]:
        if not self._steps:
            return []
        try:
            return json.loads(self._steps)
        except (ValueError, TypeError):
            return []

    @steps.setter
    def steps(self, val: Any):
        if isinstance(val, (list, dict)):
            self._steps = json.dumps(val)
        elif isinstance(val, str):
            self._steps = val
        else:
            self._steps = "[]"

    def to_dict(self):
        return {
            "id": self.id,
            "service_code": self.service_code,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "user_type": self.user_type,
            "eligibility": self.eligibility,
            "required_documents": self.required_documents,
            "steps": self.steps,
            "official_source_name": self.official_source_name,
            "official_source_url": self.official_source_url,
            "is_demo": self.is_demo,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
