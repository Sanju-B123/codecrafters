"""
BharatStandards AI - Audit Service
Provides tamper-resistant, enterprise-grade audit logging and activity timeline queries.
Ensures zero-secret storage, strict user isolation, and complete auditability.
"""
from datetime import datetime
import re
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.audit_log import AuditLog

# Sensitive keys that must be sanitized before persisting to audit records
REDACTED_KEYS = {
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "secret",
    "api_key",
    "api_secret",
    "private_key",
    "card_number",
    "credit_card",
    "cvv",
    "pin",
    "hash",
}


class AuditService:
    @staticmethod
    def sanitize_metadata(data: Any) -> Any:
        """
        Recursively sanitizes dictionary or list data to ensure zero sensitive credentials
        or tokens are stored in audit logs.
        """
        if isinstance(data, dict):
            clean_dict = {}
            for k, v in data.items():
                k_lower = str(k).lower().replace("-", "_")
                if any(sensitive in k_lower for sensitive in REDACTED_KEYS):
                    clean_dict[k] = "[REDACTED]"
                else:
                    clean_dict[k] = AuditService.sanitize_metadata(v)
            return clean_dict
        elif isinstance(data, (list, tuple)):
            return [AuditService.sanitize_metadata(item) for item in data]
        return data

    @staticmethod
    def log_event(
        db: Session,
        user_id: int,
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        description: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[AuditLog]:
        """
        Records an immutable audit event in the database.
        Fails gracefully without raising exceptions to prevent disrupting business operations.
        """
        try:
            cleaned_metadata = AuditService.sanitize_metadata(metadata) if metadata else None
            # Truncate strings to match DB constraints
            safe_description = description[:1000] if description else f"User triggered {action}"
            safe_ip = ip_address[:45] if ip_address else None
            safe_ua = user_agent[:500] if user_agent else None

            audit_record = AuditLog(
                user_id=user_id,
                action=action.upper(),
                entity_type=entity_type.lower() if entity_type else None,
                entity_id=entity_id,
                description=safe_description,
                extra_metadata=cleaned_metadata,
                ip_address=safe_ip,
                user_agent=safe_ua,
            )
            db.add(audit_record)
            db.commit()
            db.refresh(audit_record)
            return audit_record
        except Exception as e:
            logger.warning(f"Audit log recording failed for user {user_id}, action {action}: {e}")
            try:
                db.rollback()
            except Exception:
                pass
            return None

    @staticmethod
    def get_logs(
        db: Session,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[AuditLog], int]:
        """
        Retrieves paginated audit events with multi-criteria filtering.
        If user_id is provided, enforces tenant isolation for that specific user.
        If user_id is None, returns system-wide records (for admin governance).
        """
        query = db.query(AuditLog)
        if user_id is not None:
            query = query.filter(AuditLog.user_id == user_id)

        if action:
            query = query.filter(AuditLog.action == action.upper())

        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type.lower())

        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)

        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(AuditLog.description.ilike(search_pattern))

        total = query.count()

        # Apply pagination and sort latest first
        offset = max(0, (page - 1) * limit)
        logs = (
            query.order_by(desc(AuditLog.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return logs, total


audit_service = AuditService()
