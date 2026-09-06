"""
BharatStandards AI - Standards Business Logic Service
Coordinates repository queries, pagination, requirements retrieval, and deterministic matching.
"""
import math
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.standard_repository import StandardRepository
from app.models.standard import Standard, Requirement
from app.models.product import Product
from app.schemas.standard import (
    StandardResponse,
    StandardDetailResponse,
    StandardListResponse,
    RequirementResponse,
)


class StandardService:
    """
    Business service layer managing Indian Standards knowledge base.
    """

    @staticmethod
    def search_standards(
        db: Session,
        query: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
        sort_by: str = "relevance",
    ) -> StandardListResponse:
        """
        Search and filter Indian Standards with pagination and clause count calculation.
        """
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        skip = (page - 1) * page_size

        if query and query.strip():
            items = StandardRepository.search(
                db,
                query=query.strip(),
                category=category,
                status=status_filter,
                skip=skip,
                limit=page_size,
                sort_by=sort_by,
            )
            total = StandardRepository.search_count(
                db,
                query=query.strip(),
                category=category,
                status=status_filter,
            )
        else:
            items = StandardRepository.get_all(
                db,
                skip=skip,
                limit=page_size,
                category=category,
                status=status_filter,
                sort_by=sort_by,
            )
            total = StandardRepository.count(
                db,
                category=category,
                status=status_filter,
            )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        response_items = []
        for std in items:
            req_count = len(std.requirements) if std.requirements else 0
            response_items.append(
                StandardResponse(
                    id=std.id,
                    standard_number=std.standard_number,
                    title=std.title,
                    category=std.category,
                    scope=std.scope,
                    description=std.description,
                    version=std.version,
                    status=std.status,
                    source=std.source,
                    source_url=std.source_url,
                    publication_date=std.publication_date,
                    is_demo=std.is_demo,
                    requirements_count=req_count,
                    created_at=std.created_at,
                    updated_at=std.updated_at,
                )
            )

        return StandardListResponse(
            items=response_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    def get_standard_details(db: Session, identifier: str) -> StandardDetailResponse:
        """
        Retrieve complete specification details and clauses for a standard.
        """
        standard = StandardRepository.get_by_id_or_number(db, identifier)
        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Standard '{identifier}' not found in knowledge base.",
            )

        requirements = [
            RequirementResponse.model_validate(r) for r in (standard.requirements or [])
        ]

        return StandardDetailResponse(
            id=standard.id,
            standard_number=standard.standard_number,
            title=standard.title,
            category=standard.category,
            scope=standard.scope,
            description=standard.description,
            version=standard.version,
            status=standard.status,
            source=standard.source,
            source_url=standard.source_url,
            publication_date=standard.publication_date,
            is_demo=standard.is_demo,
            requirements_count=len(requirements),
            requirements=requirements,
            created_at=standard.created_at,
            updated_at=standard.updated_at,
        )

    @staticmethod
    def get_requirements(
        db: Session,
        identifier: str,
        category_filter: Optional[str] = None,
    ) -> List[RequirementResponse]:
        """
        Retrieve clause requirements for a standard, with optional category filtering.
        """
        standard = StandardRepository.get_by_id_or_number(db, identifier)
        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Standard '{identifier}' not found in knowledge base.",
            )

        reqs = StandardRepository.get_requirements(db, standard.id, category=category_filter)
        return [RequirementResponse.model_validate(r) for r in reqs]

    @staticmethod
    def find_potential_matches(db: Session, product: Product) -> List[Dict[str, Any]]:
        """
        Deterministic standards discovery engine connecting products to knowledge base standards.
        Bridges the product specifications to registered Standard entities in the database.
        """
        category = (product.category or "").strip().lower()
        name = (product.name or "").strip().lower()

        matches = []

        # Case 1: Water Heater / Geyser / Electrical Appliances
        if "heater" in name or "geyser" in name or "electrical" in category:
            std1 = StandardRepository.get_by_standard_number(db, "DEMO-IS-001")
            if std1:
                matches.append({
                    "standard_id": std1.id,
                    "standard_number": std1.standard_number,
                    "title": std1.title,
                    "relevance": "HIGH",
                    "reason": (
                        "Potential relevance based on product category 'Electrical Appliances' and "
                        "characteristics matching stationary storage electric water heaters."
                    ),
                    "source": std1.source,
                    "is_demo": std1.is_demo,
                })

            std2 = StandardRepository.get_by_standard_number(db, "DEMO-IS-002")
            if std2:
                matches.append({
                    "standard_id": std2.id,
                    "standard_number": std2.standard_number,
                    "title": std2.title,
                    "relevance": "MEDIUM",
                    "reason": "General horizontal electrical safety standard applicable to mains-powered domestic appliances.",
                    "source": std2.source,
                    "is_demo": std2.is_demo,
                })

        # Case 2: Electronics / IT Equipment
        elif "electronic" in category or "it" in category:
            std3 = StandardRepository.get_by_standard_number(db, "DEMO-IS-003")
            if std3:
                matches.append({
                    "standard_id": std3.id,
                    "standard_number": std3.standard_number,
                    "title": std3.title,
                    "relevance": "HIGH",
                    "reason": "Direct applicability for mains-powered information technology and digital consumer electronics.",
                    "source": std3.source,
                    "is_demo": std3.is_demo,
                })

        # Fallback: if no specific category matched, search or provide top demo standard
        if not matches:
            all_stds = StandardRepository.get_all(db, skip=0, limit=2)
            for s in all_stds:
                matches.append({
                    "standard_id": s.id,
                    "standard_number": s.standard_number,
                    "title": s.title,
                    "relevance": "MEDIUM",
                    "reason": f"Synthetic baseline demonstration standard for sector '{s.category}'.",
                    "source": s.source,
                    "is_demo": s.is_demo,
                })

        return matches
