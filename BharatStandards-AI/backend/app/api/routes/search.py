"""
BharatStandards AI - Unified Global Search API
Searches products, standards, requirements, and documents with strict tenant isolation.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.standard import Standard, Requirement, StandardStatus
from app.models.document import Document

router = APIRouter(prefix="/search", tags=["Global Search"])


class SearchResultItem(BaseModel):
    id: int
    title: str
    subtitle: Optional[str] = None
    category: Optional[str] = None
    type: str  # PRODUCT, STANDARD, REQUIREMENT, DOCUMENT
    url: str


class GlobalSearchResponse(BaseModel):
    query: str
    total_matches: int
    products: List[SearchResultItem] = []
    standards: List[SearchResultItem] = []
    requirements: List[SearchResultItem] = []
    documents: List[SearchResultItem] = []


@router.get("", response_model=GlobalSearchResponse, summary="Unified Global Search")
def global_search(
    q: str = Query(..., min_length=1, description="Search keyword"),
    limit: int = Query(5, ge=1, le=20, description="Max items per category"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Unified multi-entity search honoring strict multi-tenant authorization.
    Users only see their own products and documents, alongside public Indian Standards.
    """
    clean_q = q.strip()
    if not clean_q:
        return GlobalSearchResponse(query="", total_matches=0)

    pattern = f"%{clean_q}%"

    # 1. User's Products
    product_query = (
        db.query(Product)
        .filter(
            Product.user_id == current_user.id,
            or_(
                Product.name.ilike(pattern),
                Product.category.ilike(pattern),
                Product.model_number.ilike(pattern),
                Product.description.ilike(pattern),
            ),
        )
        .limit(limit)
        .all()
    )
    product_items = [
        SearchResultItem(
            id=p.id,
            title=p.name,
            subtitle=f"{p.category or 'Product'} • Model {p.model_number or 'N/A'}",
            category=p.category,
            type="PRODUCT",
            url=f"/products/{p.id}",
        )
        for p in product_query
    ]

    # 2. Public Standards
    standards_query = (
        db.query(Standard)
        .filter(
            or_(
                Standard.standard_number.ilike(pattern),
                Standard.title.ilike(pattern),
                Standard.category.ilike(pattern),
                Standard.scope.ilike(pattern),
            )
        )
        .limit(limit)
        .all()
    )
    standard_items = [
        SearchResultItem(
            id=s.id,
            title=s.standard_number,
            subtitle=s.title,
            category=s.category,
            type="STANDARD",
            url=f"/standards/{s.id}",
        )
        for s in standards_query
    ]

    # 3. Requirements (under accessible standards)
    req_query = (
        db.query(Requirement)
        .filter(
            or_(
                Requirement.clause.ilike(pattern),
                Requirement.title.ilike(pattern),
                Requirement.description.ilike(pattern),
            )
        )
        .limit(limit)
        .all()
    )
    requirement_items = [
        SearchResultItem(
            id=r.id,
            title=f"Clause {r.clause}: {r.title}",
            subtitle=f"Standard #{r.standard_id} • {r.priority or 'Standard'} Priority",
            category=r.category or "Clause",
            type="REQUIREMENT",
            url=f"/standards/{r.standard_id}",
        )
        for r in req_query
    ]

    # 4. User's Documents
    doc_query = (
        db.query(Document)
        .filter(
            Document.user_id == current_user.id,
            or_(
                Document.filename.ilike(pattern),
                Document.original_filename.ilike(pattern),
            ),
        )
        .limit(limit)
        .all()
    )
    document_items = [
        SearchResultItem(
            id=d.id,
            title=d.original_filename or d.filename,
            subtitle=f"{d.file_type or 'Document'} • {d.status}",
            category=d.file_type,
            type="DOCUMENT",
            url=f"/documents/{d.id}",
        )
        for d in doc_query
    ]

    total = len(product_items) + len(standard_items) + len(requirement_items) + len(document_items)

    return GlobalSearchResponse(
        query=clean_q,
        total_matches=total,
        products=product_items,
        standards=standard_items,
        requirements=requirement_items,
        documents=document_items,
    )
