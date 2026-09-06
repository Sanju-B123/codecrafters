"""
BharatStandards AI - BIS Services API Routes
Exposes REST endpoints for querying BIS services, guided roadmaps, and deterministic recommendations.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, security_scheme
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.schemas.bis_service import (
    BISServiceResponse,
    ServiceListResponse,
    ServiceRecommendationResponse,
    ComplianceNextStepsResponse,
)
from app.services.service_recommendation_service import ServiceRecommendationService
from app.services.audit_service import audit_service

router = APIRouter(prefix="/services", tags=["BIS Services & Guidance"])


@router.get(
    "",
    response_model=ServiceListResponse,
    summary="List BIS Services and Guidance Catalogue",
)
def list_services(
    search: Optional[str] = Query(None, description="Search keyword in service name, description, code"),
    category: Optional[str] = Query(None, description="Filter by Category enum"),
    user_type: Optional[str] = Query(None, description="Filter by User Type (Industry, Consumer, Both)"),
    status: Optional[str] = Query(None, description="Filter by Status enum (ACTIVE, DEMO, etc.)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Search and filter official and synthetic demonstration BIS services with pagination.
    """
    return ServiceRecommendationService.get_services(
        db=db,
        search=search,
        category=category,
        user_type=user_type,
        service_status=status,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/recommended",
    response_model=List[ServiceRecommendationResponse],
    summary="Get User-Tailored Service Recommendations",
)
def get_recommended_services(
    limit: int = Query(5, ge=1, le=20, description="Max recommendations to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve guidance recommendations tailored to the user's role (Industry vs Consumer).
    """
    return ServiceRecommendationService.get_recommendations_for_user(
        db=db,
        user=current_user,
        limit=limit,
    )


@router.get(
    "/{id}",
    response_model=BISServiceResponse,
    summary="Get Detailed BIS Service Guidance",
)
def get_service_detail(
    id: int,
    auth=Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """
    Retrieve full procedural guidance, required documents checklist, and typical steps for a service.
    """
    svc = ServiceRecommendationService.get_service_by_id(db=db, service_id=id)
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and payload.get("sub"):
            try:
                user_id = int(payload["sub"])
                audit_service.log_event(
                    db=db,
                    user_id=user_id,
                    action="SERVICE_VIEWED",
                    entity_type="service",
                    entity_id=svc.id,
                    description=f"Viewed guidance for BIS service '{svc.title}'",
                    metadata={"service_code": svc.service_code, "category": svc.category},
                )
            except Exception:
                pass
    return svc
