"""
BharatStandards AI - Products API Route Endpoints
Handles CRUD operations, ownership authorization, and mock standards analysis.
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.logging import logger
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductAnalysisResponse,
)
from app.services.analysis_service import MockProductAnalysisService
from app.services.audit_service import audit_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
def get_products(
    search: Optional[str] = Query(None, description="Search term across name, model, manufacturer"),
    category: Optional[str] = Query(None, description="Filter by sector category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all registered products owned by the authenticated user.
    Strict tenant isolation: only queries current_user's products.
    """
    query = db.query(Product).filter(Product.user_id == current_user.id)

    if category:
        query = query.filter(Product.category.ilike(f"%{category.strip()}%"))
    if status_filter:
        query = query.filter(Product.status == status_filter.strip())
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Product.name.ilike(search_pattern))
            | (Product.model_number.ilike(search_pattern))
            | (Product.manufacturer.ilike(search_pattern))
        )

    products = query.order_by(Product.created_at.desc()).all()
    return ProductListResponse(items=products, total=len(products))


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new product in DRAFT status associated with the authenticated user.
    """
    product = Product(
        user_id=current_user.id,
        name=product_in.name.strip(),
        category=product_in.category.strip(),
        description=product_in.description.strip() if product_in.description else None,
        intended_use=product_in.intended_use.strip() if product_in.intended_use else None,
        manufacturer=product_in.manufacturer.strip() if product_in.manufacturer else None,
        model_number=product_in.model_number.strip() if product_in.model_number else None,
        technical_details=product_in.technical_details.strip() if product_in.technical_details else None,
        status=ProductStatus.DRAFT.value,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    logger.info(f"User {current_user.id} registered new product {product.id}: '{product.name}'")
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="PRODUCT_CREATED",
        entity_type="product",
        entity_id=product.id,
        description=f"Product '{product.name}' created",
        metadata={"product_name": product.name, "category": product.category, "status": product.status},
    )
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve single product details.
    Enforces strict ownership isolation: returns 404 if product does not belong to user.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update product specifications.
    Enforces strict ownership isolation: returns 404 if product does not belong to user.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(product, field, value.value if hasattr(value, "value") else str(value))
        elif value is not None and isinstance(value, str):
            setattr(product, field, value.strip())
        else:
            setattr(product, field, value)

    db.commit()
    db.refresh(product)
    logger.info(f"User {current_user.id} updated product {product.id}")
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="PRODUCT_UPDATED",
        entity_type="product",
        entity_id=product.id,
        description=f"Product '{product.name}' updated",
        metadata={"product_name": product.name, "status": product.status},
    )
    return product


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete a product and its associated data.
    Enforces strict ownership isolation: returns 404 if product does not belong to user.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )

    product_name = product.name
    db.delete(product)
    db.commit()
    logger.info(f"User {current_user.id} deleted product {product_id}")
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="PRODUCT_DELETED",
        entity_type="product",
        entity_id=product_id,
        description=f"Product '{product_name}' deleted",
    )
    return {"message": "Product successfully deleted."}


@router.post("/{product_id}/analyze", response_model=ProductAnalysisResponse)
def analyze_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiate mock standards discovery analysis for the product.
    Updates product status to READY and persists synthetic standards analysis.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )

    # Perform domain-aware synthetic analysis
    analysis_result = MockProductAnalysisService.analyze(product)

    # Persist analysis and transition status to READY
    product.status = ProductStatus.READY.value
    product.analysis_data = json.dumps(analysis_result)
    db.commit()
    db.refresh(product)

    logger.info(f"Mock standards analysis completed for product {product_id}")
    return analysis_result


@router.get("/{product_id}/analysis", response_model=ProductAnalysisResponse)
def get_product_analysis(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve stored analysis results for a product.
    If no analysis has been executed yet, automatically runs the initial mock analysis.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )

    if product.analysis_data:
        try:
            return json.loads(product.analysis_data)
        except Exception:
            pass

    analysis_result = MockProductAnalysisService.analyze(product)
    product.status = ProductStatus.READY.value
    product.analysis_data = json.dumps(analysis_result)
    db.commit()
    db.refresh(product)
    return analysis_result


@router.get(
    "/{product_id}/services",
    summary="Get Product-Aware BIS Guidance & Services",
)
def get_product_services(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve deterministic BIS services and guided recommendations tailored to
    a specific product and its active compliance gap analysis.
    """
    from app.services.service_recommendation_service import ServiceRecommendationService
    return ServiceRecommendationService.get_recommendations_for_product(
        db=db,
        user=current_user,
        product_id=product_id,
    )

