"""
BharatStandards AI - Standards Knowledge Base API Router
Exposes paginated standards discovery, clause breakdown, and search endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.compliance import ComplianceRiskItem
from app.schemas.standard import (
    StandardDetailResponse,
    StandardListResponse,
    RequirementResponse,
)
from app.services.risk_engine import ComplianceRiskEngine
from app.services.standard_service import StandardService

router = APIRouter(prefix="/standards", tags=["Standards Knowledge Base"])
requirements_router = APIRouter(prefix="/requirements", tags=["Requirements"])


@router.get("", response_model=StandardListResponse)
def list_standards(
    q: Optional[str] = Query(None, description="Keyword search query across title, description, scope"),
    category: Optional[str] = Query(None, description="Filter by industrial sector / division"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ACTIVE, DEMO, etc.)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("relevance", description="Sort order: 'relevance', 'name', 'latest'"),
    db: Session = Depends(get_db),
):
    """
    Retrieve paginated Indian Standards and QCOs from the knowledge base.
    """
    return StandardService.search_standards(
        db=db,
        query=q,
        category=category,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
    )


@router.get("/search", response_model=StandardListResponse)
def search_standards_endpoint(
    query: Optional[str] = Query(None, alias="q", description="Keyword search query"),
    category: Optional[str] = Query(None, description="Filter by sector"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("relevance"),
    db: Session = Depends(get_db),
):
    """
    Dedicated search endpoint for fast type-ahead and keyword querying.
    """
    return StandardService.search_standards(
        db=db,
        query=query,
        category=category,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
    )


@router.get("/{identifier}", response_model=StandardDetailResponse)
def get_standard(
    identifier: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve comprehensive standard specification, scope, and all clause requirements.
    Supports either numeric database ID (e.g. '1') or standard code (e.g. 'DEMO-IS-001').
    """
    return StandardService.get_standard_details(db, identifier)


@router.get("/{identifier}/requirements", response_model=List[RequirementResponse])
def get_standard_requirements(
    identifier: str,
    category: Optional[str] = Query(None, description="Optional category filter: SAFETY, PERFORMANCE, TESTING, etc."),
    db: Session = Depends(get_db),
):
    """
    Retrieve all clause-level requirements for a standard, with optional category filtering.
    """
    return StandardService.get_requirements(db, identifier, category_filter=category)




@requirements_router.get("/{id}/risk", response_model=ComplianceRiskItem)
@router.get("/requirements/{id}/risk", response_model=ComplianceRiskItem)
def get_requirement_risk(
    id: int,
    product_id: int = Query(..., description="ID of the product being evaluated"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve clause-level risk assessment for a specific requirement and product.
    Explains the risk score, factors, reasons, and recommended action.
    """
    return ComplianceRiskEngine.get_requirement_risk(
        db=db,
        requirement_id=id,
        product_id=product_id,
        user=current_user,
    )


# Admin-guarded modification endpoints (Standard users are prevented from modifying knowledge base)
@router.post("", status_code=status.HTTP_403_FORBIDDEN)
def create_standard(
    current_admin: User = Depends(require_role(["admin"])),
):
    """Admin-only endpoint for importing standards."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Knowledge base modifications require national administrator credentials.",
    )


@router.delete("/{identifier}", status_code=status.HTTP_403_FORBIDDEN)
def delete_standard(
    identifier: str,
    current_admin: User = Depends(require_role(["admin"])),
):
    """Admin-only endpoint for withdrawing standards."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Knowledge base modifications require national administrator credentials.",
    )
