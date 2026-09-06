"""
BharatStandards AI - Administration API Endpoints
Provides secure backend APIs for system metrics, health diagnostics, user management,
standards and requirements lifecycle, platform documents, knowledge sources, and BIS services.
Enforces real administrative authorization on all endpoints.
"""
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.audit import AuditLogListResponse
from app.models.user import User, UserStatus
from app.models.standard import (
    Standard,
    Requirement,
    StandardStatus,
    RequirementPriority,
    RequirementStatus,
)
from app.models.document import Document
from app.models.bis_service import BISService
from app.models.knowledge import (
    KnowledgeSource,
    KnowledgeIndex,
    KnowledgeIndexStatus,
)
from app.schemas.admin import (
    AdminDashboardMetricsResponse,
    AdminHealthResponse,
    AdminUserListItem,
    AdminUpdateUserRequest,
    AdminStandardResponse,
    AdminStandardDetailResponse,
    AdminStandardCreateRequest,
    AdminStandardUpdateRequest,
    AdminRequirementResponse,
    AdminRequirementCreateRequest,
    AdminRequirementUpdateRequest,
    AdminDocumentListItem,
    AdminKnowledgeSourceResponse,
    AdminKnowledgeSourceCreateRequest,
    AdminKnowledgeIndexResponse,
    AdminBISServiceResponse,
    AdminBISServiceCreateRequest,
    AdminBISServiceUpdateRequest,
)
from app.services.admin_permission_service import admin_permission_service
from app.services.admin_service import admin_service
from app.services.knowledge_index_service import knowledge_index_service
from app.services.audit_service import audit_service


router = APIRouter(prefix="/admin", tags=["Administration"])


# ---------------------------------------------------------
# Dashboard Metrics & Diagnostics
# ---------------------------------------------------------
@router.get("/metrics", response_model=AdminDashboardMetricsResponse, summary="Get Platform Metrics")
def get_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    return admin_service.get_dashboard_metrics(db)


@router.get("/health", response_model=AdminHealthResponse, summary="Get Real Platform Health Status")
def get_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    return admin_service.get_system_health(db)


# ---------------------------------------------------------
# User Management
# ---------------------------------------------------------
@router.get("/users", response_model=List[AdminUserListItem], summary="List Platform Users")
def list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE/SUSPENDED)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    query = db.query(User)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(s), User.email.ilike(s)))
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for u in users:
        result.append(
            AdminUserListItem(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                status=getattr(u, "status", "ACTIVE"),
                is_active=u.is_active,
                created_at=u.created_at,
                updated_at=u.updated_at,
                products_count=len(u.products) if u.products else 0,
                reports_count=len(u.compliance_reports) if u.compliance_reports else 0,
            )
        )
    return result


@router.patch("/users/{user_id}", response_model=AdminUserListItem, summary="Update User Role / Status")
def update_user(
    user_id: int,
    request: AdminUpdateUserRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Safety Guard: Ensure not demoting/suspending the last active admin
    can_modify, reason = admin_permission_service.can_demote_or_suspend(
        db=db,
        target_user_id=user_id,
        new_role=request.role,
        new_status=request.status,
    )
    if not can_modify:
        raise HTTPException(status_code=400, detail=reason)

    old_role = target_user.role
    old_status = getattr(target_user, "status", "ACTIVE")

    if request.role is not None:
        target_user.role = request.role
    if request.status is not None:
        target_user.status = request.status
        if request.status == UserStatus.SUSPENDED.value:
            target_user.is_active = False
        elif request.status == UserStatus.ACTIVE.value:
            target_user.is_active = True

    db.commit()
    db.refresh(target_user)

    # Audit Logging
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_USER_UPDATED",
        entity_type="user",
        entity_id=target_user.id,
        description=f"Admin {current_user.email} updated user {target_user.email} (Role: {old_role}->{target_user.role}, Status: {old_status}->{target_user.status})",
        metadata={"old_role": old_role, "new_role": target_user.role, "old_status": old_status, "new_status": target_user.status},
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return AdminUserListItem(
        id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        status=getattr(target_user, "status", "ACTIVE"),
        is_active=target_user.is_active,
        created_at=target_user.created_at,
        updated_at=target_user.updated_at,
        products_count=len(target_user.products) if target_user.products else 0,
        reports_count=len(target_user.compliance_reports) if target_user.compliance_reports else 0,
    )


# ---------------------------------------------------------
# Standards Management
# ---------------------------------------------------------
def _build_standard_response(db: Session, standard: Standard) -> AdminStandardResponse:
    quality_info = knowledge_index_service.calculate_quality_score(db, standard.id)
    index_entry = (
        db.query(KnowledgeIndex)
        .filter(
            KnowledgeIndex.entity_type == "standard",
            KnowledgeIndex.entity_id == standard.id,
        )
        .first()
    )
    return AdminStandardResponse(
        id=standard.id,
        standard_number=standard.standard_number,
        code=standard.standard_number,
        title=standard.title,
        category=standard.category,
        scope=standard.scope,
        description=standard.description,
        version=standard.version,
        status=standard.status,
        source=standard.source,
        source_name=standard.source,
        source_url=standard.source_url,
        publication_date=standard.publication_date,
        is_demo=standard.is_demo,
        created_at=standard.created_at,
        updated_at=standard.updated_at,
        requirements_count=len(standard.requirements) if standard.requirements else 0,
        quality_score=quality_info.get("score"),
        quality_tier=quality_info.get("tier"),
        index_status=index_entry.index_status if index_entry else KnowledgeIndexStatus.NOT_INDEXED.value,
    )


@router.get("/standards", response_model=List[AdminStandardResponse], summary="List All Standards for Admin")
def list_standards(
    search: Optional[str] = Query(None, description="Search by number, title, or category"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, DRAFT, ARCHIVED, DEMO)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    query = db.query(Standard)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Standard.standard_number.ilike(s),
                Standard.title.ilike(s),
                Standard.category.ilike(s),
            )
        )
    if status:
        query = query.filter(Standard.status == status)
    if category:
        query = query.filter(Standard.category == category)

    standards = query.order_by(Standard.standard_number.asc()).offset(skip).limit(limit).all()
    return [_build_standard_response(db, s) for s in standards]


@router.post("/standards", response_model=AdminStandardResponse, status_code=status.HTTP_201_CREATED, summary="Create Standard")
def create_standard(
    request: AdminStandardCreateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    existing = db.query(Standard).filter(Standard.standard_number == request.standard_number.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Standard '{request.standard_number}' already exists.")

    std = Standard(
        standard_number=request.standard_number.strip(),
        title=request.title.strip(),
        category=request.category.strip(),
        scope=request.scope,
        description=request.description,
        version=request.version,
        status=request.status,
        source=request.source,
        source_url=request.source_url,
        publication_date=request.publication_date,
        is_demo=request.is_demo,
    )
    db.add(std)
    db.flush()

    # Automatically initialize index record
    knowledge_index_service.index_standard(db, std.id)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_STANDARD_CREATED",
        entity_type="standard",
        entity_id=std.id,
        description=f"Admin {current_user.email} created standard {std.standard_number}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return _build_standard_response(db, std)


@router.get("/standards/{standard_id}", response_model=AdminStandardDetailResponse, summary="Get Standard Detail")
def get_standard_detail(
    standard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    standard = db.query(Standard).filter(Standard.id == standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found.")

    base_resp = _build_standard_response(db, standard)
    quality_info = knowledge_index_service.calculate_quality_score(db, standard.id)

    reqs_resp = [
        AdminRequirementResponse(
            id=r.id,
            standard_id=r.standard_id,
            clause=r.clause,
            title=r.title,
            description=r.description,
            category=r.category,
            priority=getattr(r, "priority", RequirementPriority.HIGH.value),
            evidence_types=getattr(r, "evidence_types", ["test_report"]),
            status=getattr(r, "status", RequirementStatus.ACTIVE.value),
            evidence_required=r.evidence_required,
            verification_method=r.verification_method,
            weight=r.weight,
            page=r.page,
            source=r.source,
            source_url=r.source_url,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in standard.requirements
    ]

    return AdminStandardDetailResponse(
        **base_resp.model_dump(),
        requirements=reqs_resp,
        quality_breakdown=quality_info.get("breakdown"),
    )


@router.patch("/standards/{standard_id}", response_model=AdminStandardResponse, summary="Update Standard")
def update_standard(
    standard_id: int,
    request: AdminStandardUpdateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    standard = db.query(Standard).filter(Standard.id == standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found.")

    update_dict = request.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(standard, field, val)

    db.commit()
    db.refresh(standard)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_STANDARD_UPDATED",
        entity_type="standard",
        entity_id=standard.id,
        description=f"Admin {current_user.email} updated standard {standard.standard_number}",
        metadata={"fields_updated": list(update_dict.keys())},
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return _build_standard_response(db, standard)


@router.delete("/standards/{standard_id}", summary="Archive or Delete Standard")
def delete_standard(
    standard_id: int,
    req: Request,
    hard: bool = Query(False, description="Set True for permanent deletion instead of non-destructive archival"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    standard = db.query(Standard).filter(Standard.id == standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found.")

    std_num = standard.standard_number
    if hard:
        # Remove from knowledge index
        knowledge_index_service.remove_from_index(db, "standard", standard.id)
        db.delete(standard)
        db.commit()
        audit_service.log_event(
            db=db,
            user_id=current_user.id,
            action="ADMIN_STANDARD_DELETED",
            entity_type="standard",
            entity_id=standard_id,
            description=f"Admin {current_user.email} permanently deleted standard {std_num}",
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent"),
        )
        return {"message": f"Standard '{std_num}' permanently deleted."}
    else:
        # Non-destructive archival
        standard.status = StandardStatus.ARCHIVED.value
        db.commit()
        audit_service.log_event(
            db=db,
            user_id=current_user.id,
            action="ADMIN_STANDARD_ARCHIVED",
            entity_type="standard",
            entity_id=standard.id,
            description=f"Admin {current_user.email} archived standard {std_num}",
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent"),
        )
        return {"message": f"Standard '{std_num}' archived successfully."}


@router.post("/standards/{standard_id}/index", response_model=AdminKnowledgeIndexResponse, summary="Sync Standard with Knowledge Index")
def sync_standard_index(
    standard_id: int,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    standard = db.query(Standard).filter(Standard.id == standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found.")

    index_entry = knowledge_index_service.index_standard(db, standard.id)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_STANDARD_INDEXED",
        entity_type="standard",
        entity_id=standard.id,
        description=f"Admin {current_user.email} re-indexed standard {standard.standard_number} in RAG index",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return AdminKnowledgeIndexResponse.model_validate(index_entry)


# ---------------------------------------------------------
# Clauses / Requirements Management
# ---------------------------------------------------------
@router.post("/standards/{standard_id}/requirements", response_model=AdminRequirementResponse, status_code=status.HTTP_201_CREATED, summary="Add Requirement Clause")
def create_requirement(
    standard_id: int,
    request: AdminRequirementCreateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    standard = db.query(Standard).filter(Standard.id == standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found.")

    existing = (
        db.query(Requirement)
        .filter(Requirement.standard_id == standard_id, Requirement.clause == request.clause.strip())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Clause '{request.clause}' already exists for this standard.")

    req_obj = Requirement(
        standard_id=standard_id,
        clause=request.clause.strip(),
        title=request.title.strip(),
        description=request.description.strip(),
        category=request.category,
        priority=request.priority,
        evidence_types=request.evidence_types or ["test_report"],
        status=RequirementStatus.ACTIVE.value,
        evidence_required=request.evidence_required,
        verification_method=request.verification_method,
        weight=request.weight,
        page=request.page,
        source=request.source or standard.source,
        source_url=request.source_url or standard.source_url,
    )
    db.add(req_obj)
    db.flush()

    # Index requirement clause
    knowledge_index_service.index_requirement(db, req_obj.id)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_REQUIREMENT_CREATED",
        entity_type="requirement",
        entity_id=req_obj.id,
        description=f"Admin {current_user.email} added clause {req_obj.clause} to {standard.standard_number}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return AdminRequirementResponse.model_validate(req_obj)


@router.patch("/requirements/{requirement_id}", response_model=AdminRequirementResponse, summary="Update Requirement Clause")
def update_requirement(
    requirement_id: int,
    request: AdminRequirementUpdateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    req_obj = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not req_obj:
        raise HTTPException(status_code=404, detail="Requirement not found.")

    update_dict = request.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(req_obj, field, val)

    db.commit()
    db.refresh(req_obj)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_REQUIREMENT_UPDATED",
        entity_type="requirement",
        entity_id=req_obj.id,
        description=f"Admin {current_user.email} updated requirement {req_obj.clause}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return AdminRequirementResponse.model_validate(req_obj)


@router.delete("/requirements/{requirement_id}", summary="Delete Requirement Clause")
def delete_requirement(
    requirement_id: int,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    req_obj = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not req_obj:
        raise HTTPException(status_code=404, detail="Requirement not found.")

    clause_name = req_obj.clause
    knowledge_index_service.remove_from_index(db, "requirement", req_obj.id)
    db.delete(req_obj)
    db.commit()

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_REQUIREMENT_DELETED",
        entity_type="requirement",
        entity_id=requirement_id,
        description=f"Admin {current_user.email} deleted clause {clause_name}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return {"message": f"Clause '{clause_name}' deleted successfully."}


# ---------------------------------------------------------
# Platform Wide Documents
# ---------------------------------------------------------
@router.get("/documents", response_model=List[AdminDocumentListItem], summary="List Platform Documents")
def list_documents(
    status: Optional[str] = Query(None, description="Filter by status (PROCESSED, PENDING, FAILED)"),
    document_type: Optional[str] = Query(None, description="Filter by doc type"),
    search: Optional[str] = Query(None, description="Search by filename"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    query = db.query(Document)
    if status:
        query = query.filter(Document.status == status)
    if document_type:
        query = query.filter(Document.file_type == document_type)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.filename.ilike(search_term),
                Document.original_filename.ilike(search_term),
            )
        )

    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for d in documents:
        result.append(
            AdminDocumentListItem(
                id=d.id,
                product_id=d.product_id,
                product_name=d.product.name if d.product else None,
                user_id=d.user_id,
                user_email=d.user.email if d.user else None,
                filename=d.filename,
                file_type=d.file_type,
                file_size_bytes=getattr(d, "file_size", 0),
                document_type=getattr(d, "file_type", "PDF"),
                status=d.status,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
        )
    return result


# ---------------------------------------------------------
# Knowledge Sources
# ---------------------------------------------------------
@router.get("/knowledge-sources", response_model=List[AdminKnowledgeSourceResponse], summary="List Knowledge Sources")
def list_knowledge_sources(
    source_type: Optional[str] = Query(None, description="OFFICIAL, DEMO, USER_PROVIDED"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    query = db.query(KnowledgeSource)
    if source_type:
        query = query.filter(KnowledgeSource.source_type == source_type)

    sources = query.order_by(KnowledgeSource.created_at.asc()).all()
    return [AdminKnowledgeSourceResponse.model_validate(s) for s in sources]


@router.post("/knowledge-sources", response_model=AdminKnowledgeSourceResponse, status_code=status.HTTP_201_CREATED, summary="Add Knowledge Source")
def create_knowledge_source(
    request: AdminKnowledgeSourceCreateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    source = KnowledgeSource(
        source_type=request.source_type,
        name=request.name.strip(),
        url=request.url,
        description=request.description,
        authority_level=request.authority_level,
        is_verified=request.is_verified,
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_KNOWLEDGE_SOURCE_CREATED",
        entity_type="knowledge_source",
        entity_id=source.id,
        description=f"Admin {current_user.email} added knowledge source {source.name}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return AdminKnowledgeSourceResponse.model_validate(source)


# ---------------------------------------------------------
# BIS Services Management
# ---------------------------------------------------------
def _build_bis_service_response(s: BISService) -> AdminBISServiceResponse:
    return AdminBISServiceResponse(
        id=s.id,
        service_code=s.service_code,
        title=s.name,
        description=s.description,
        category=s.category,
        user_type=s.user_type,
        status=s.status,
        action_type="OPEN_OFFICIAL_SOURCE",
        portal_name=s.official_source_name,
        portal_url=s.official_source_url,
        help_text=s.eligibility,
        estimated_timeline="2-4 Weeks",
        applicable_standards=None,
        is_active=(s.status == "ACTIVE"),
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get("/bis-services", response_model=List[AdminBISServiceResponse], summary="List All BIS Services (Admin)")
def list_bis_services(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    query = db.query(BISService)
    if category:
        query = query.filter(BISService.category == category)
    if status:
        query = query.filter(BISService.status == status)

    services = query.order_by(BISService.service_code.asc()).all()
    return [_build_bis_service_response(s) for s in services]


@router.post("/bis-services", response_model=AdminBISServiceResponse, status_code=status.HTTP_201_CREATED, summary="Create BIS Service")
def create_bis_service(
    request: AdminBISServiceCreateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    existing = db.query(BISService).filter(BISService.service_code == request.service_code.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Service with code '{request.service_code}' already exists.")

    service = BISService(
        service_code=request.service_code.strip(),
        name=request.title.strip(),
        description=request.description.strip(),
        category=request.category,
        user_type=request.user_type,
        eligibility=request.help_text or "All eligible manufacturers and stakeholders",
        status=request.status,
        official_source_name=request.portal_name,
        official_source_url=request.portal_url,
    )
    db.add(service)
    db.commit()
    db.refresh(service)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_SERVICE_CREATED",
        entity_type="bis_service",
        entity_id=service.id,
        description=f"Admin {current_user.email} created BIS service {service.service_code}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return _build_bis_service_response(service)


@router.patch("/bis-services/{service_id}", response_model=AdminBISServiceResponse, summary="Update BIS Service")
def update_bis_service(
    service_id: int,
    request: AdminBISServiceUpdateRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    service = db.query(BISService).filter(BISService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="BIS Service not found.")

    if request.title is not None:
        service.name = request.title.strip()
    if request.description is not None:
        service.description = request.description.strip()
    if request.category is not None:
        service.category = request.category
    if request.user_type is not None:
        service.user_type = request.user_type
    if request.status is not None:
        service.status = request.status
    if request.portal_name is not None:
        service.official_source_name = request.portal_name
    if request.portal_url is not None:
        service.official_source_url = request.portal_url
    if request.help_text is not None:
        service.eligibility = request.help_text

    db.commit()
    db.refresh(service)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_SERVICE_UPDATED",
        entity_type="bis_service",
        entity_id=service.id,
        description=f"Admin {current_user.email} updated BIS service {service.service_code}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return _build_bis_service_response(service)



@router.delete("/bis-services/{service_id}", summary="Delete BIS Service")
def delete_bis_service(
    service_id: int,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    service = db.query(BISService).filter(BISService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="BIS Service not found.")

    code = service.service_code
    db.delete(service)
    db.commit()

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="ADMIN_SERVICE_DELETED",
        entity_type="bis_service",
        entity_id=service_id,
        description=f"Admin {current_user.email} deleted BIS service {code}",
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
    )

    return {"message": f"Service '{code}' deleted successfully."}


# ---------------------------------------------------------
# Administrative System Audit Stream
# ---------------------------------------------------------
@router.get("/audit", response_model=AuditLogListResponse, summary="Get Platform Administrative Audit Logs")
def get_admin_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    search: Optional[str] = Query(None, description="Search event description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronologically ordered system-wide audit records across all accounts and services.
    Strictly restricted to users with ADMIN authorization.
    """
    admin_permission_service.require_admin(current_user)

    items, total = audit_service.get_logs(
        db=db,
        user_id=None,  # All users
        action=action,
        entity_type=entity_type,
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

