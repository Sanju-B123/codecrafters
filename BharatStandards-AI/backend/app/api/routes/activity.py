"""
BharatStandards AI - Activity & Audit Trail API Routes
Provides paginated query endpoints for user activity history and compliance audit logs.
Audit entries are strictly read-only and enforce complete tenant isolation.
"""
from datetime import datetime
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.audit import AuditLogListResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/activity", tags=["Audit Trail & Activity"])


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="Get User Activity Timeline & Audit Logs",
)
def get_activity_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    start_date: Optional[datetime] = Query(None, description="Filter events starting from date"),
    end_date: Optional[datetime] = Query(None, description="Filter events up to date"),
    search: Optional[str] = Query(None, description="Search event description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronologically ordered audit records and activity events for the authenticated user.
    Enforces tenant isolation: users can only inspect their own activity history.
    """
    items, total = audit_service.get_logs(
        db=db,
        user_id=current_user.id,
        action=action,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date,
        search=search,
        page=page,
        limit=limit,
    )

    pages = math.ceil(total / limit) if limit > 0 else 0

    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )
