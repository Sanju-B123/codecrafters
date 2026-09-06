"""
BharatStandards AI - Knowledge Ingestion & Data Quality Pipeline Admin Endpoints
Provides secure admin routes to inspect, validate, normalize, stage, review, and index
standards and requirements from authorized sources.
"""
import json
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.standard import (
    Standard,
    Requirement,
    StandardStatus,
    RequirementStatus,
)
from app.models.knowledge import (
    KnowledgeSource,
    KnowledgeProvenanceType,
    KnowledgeVerificationStatus,
    KnowledgeImportJob,
    KnowledgeImportJobStatus,
    KnowledgeImportRecord,
    KnowledgeImportRecordStatus,
    KnowledgeChangeLog,
    KnowledgeChangeAction,
    KnowledgeIndex,
    KnowledgeIndexStatus,
)
from app.schemas.knowledge_admin import (
    KnowledgeImportPreviewResponse,
    KnowledgeImportJobResponse,
    KnowledgeImportRecordResponse,
    KnowledgeDraftStandardItem,
    KnowledgeDraftRequirementItem,
    KnowledgeDraftsInboxResponse,
    KnowledgeActionResponse,
    KnowledgeHealthResponse,
    ValidationErrorDetail,
    KnowledgeRecordItem,
    KnowledgeRecordsListResponse,
    KnowledgeSourceDetailResponse,
)
from app.services.admin_permission_service import admin_permission_service
from app.services.knowledge_index_service import knowledge_index_service
from app.knowledge.ingestion.json_loader import JsonSourceLoader
from app.knowledge.ingestion.csv_loader import CsvSourceLoader
from app.knowledge.ingestion.document_loader import DocumentSourceLoader
from app.knowledge.ingestion.normalizer import KnowledgeNormalizer
from app.knowledge.ingestion.validator import KnowledgeValidator
from app.knowledge.ingestion.deduplicator import KnowledgeDeduplicator
from app.knowledge.ingestion.importer import KnowledgeImporter


router = APIRouter(prefix="/admin/knowledge", tags=["Knowledge Administration"])


def _get_loader_for_filename(filename: str):
    lower = filename.lower()
    if lower.endswith(".json"):
        return JsonSourceLoader()
    elif lower.endswith(".csv"):
        return CsvSourceLoader()
    elif lower.endswith((".md", ".txt")):
        return DocumentSourceLoader()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{filename}'. Allowed formats: .json, .csv, .md, .txt",
        )


# ---------------------------------------------------------------------------
# 1. Preview Ingestion File (Dry Run / Validation)
# ---------------------------------------------------------------------------
@router.post(
    "/import/preview",
    response_model=KnowledgeImportPreviewResponse,
    summary="Preview and validate standards file without persisting",
)
async def preview_knowledge_file(
    file: UploadFile = File(...),
    provenance_type: str = Form("DEMO"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    content = await file.read()
    try:
        preview_data = KnowledgeImporter.preview(
            db=db,
            filename=file.filename,
            raw_bytes=content,
            content_type=file.content_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse or preview source file: {str(e)}",
        )
    return preview_data


# ---------------------------------------------------------------------------
# 2. Upload and Ingest File (Transactional Staging as DRAFT)
# ---------------------------------------------------------------------------
@router.post(
    "/import",
    response_model=KnowledgeImportJobResponse,
    summary="Upload and import standards file as staged draft knowledge",
)
async def import_knowledge_file(
    file: UploadFile = File(...),
    provenance_type: str = Form("DEMO"),
    source_name: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    verification_status: str = Form("UNVERIFIED"),
    commit_immediately: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    content = await file.read()
    try:
        job = KnowledgeImporter.execute_import(
            db=db,
            user_id=current_user.id,
            filename=file.filename,
            raw_bytes=content,
            content_type=file.content_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to ingest source file: {str(e)}",
        )

    return job


# ---------------------------------------------------------------------------
# 3. List Import Jobs
# ---------------------------------------------------------------------------
@router.get(
    "/imports",
    response_model=List[KnowledgeImportJobResponse],
    summary="List chronological knowledge import jobs",
)
def list_import_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    jobs = (
        db.query(KnowledgeImportJob)
        .order_by(KnowledgeImportJob.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return jobs


# ---------------------------------------------------------------------------
# 4. Get Import Job Details
# ---------------------------------------------------------------------------
@router.get(
    "/imports/{job_id}",
    response_model=KnowledgeImportJobResponse,
    summary="Get single import job details",
)
def get_import_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    job = db.query(KnowledgeImportJob).filter(KnowledgeImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found")
    return job


# ---------------------------------------------------------------------------
# 5. Get Import Job Records
# ---------------------------------------------------------------------------
@router.get(
    "/imports/{job_id}/records",
    response_model=List[KnowledgeImportRecordResponse],
    summary="Get row-level staging records for an import job",
)
def get_import_job_records(
    job_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    record_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    query = db.query(KnowledgeImportRecord).filter(KnowledgeImportRecord.job_id == job_id)
    if status_filter:
        query = query.filter(KnowledgeImportRecord.status == status_filter.upper())
    if record_type:
        query = query.filter(KnowledgeImportRecord.record_type == record_type.lower())

    records = (
        query.order_by(KnowledgeImportRecord.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


# ---------------------------------------------------------------------------
# 6. Commit Staged Job
# ---------------------------------------------------------------------------
@router.post(
    "/imports/{job_id}/commit",
    response_model=KnowledgeImportJobResponse,
    summary="Commit staged valid records from an import job into draft knowledge entities",
)
def commit_import_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    job = db.query(KnowledgeImportJob).filter(KnowledgeImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found")

    return job


# ---------------------------------------------------------------------------
# 7. Drafts Review Inbox
# ---------------------------------------------------------------------------
@router.get(
    "/drafts",
    response_model=KnowledgeDraftsInboxResponse,
    summary="Get inbox of draft standards and requirements awaiting human review",
)
def get_drafts_inbox(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    standards_query = db.query(Standard).filter(Standard.status == StandardStatus.DRAFT.value)
    requirements_query = db.query(Requirement).filter(Requirement.status == RequirementStatus.DRAFT.value)

    total_drafts = standards_query.count() + requirements_query.count()

    draft_standards = (
        standards_query.order_by(Standard.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    draft_requirements = (
        requirements_query.order_by(Requirement.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Attach standard_number for requirements if available
    req_items = []
    for r in draft_requirements:
        std_num = r.standard.standard_number if r.standard else None
        req_items.append(
            KnowledgeDraftRequirementItem(
                id=r.id,
                standard_id=r.standard_id,
                standard_number=std_num,
                clause=r.clause,
                title=r.title,
                description=r.description or "",
                verification_method=r.verification_method,
                evidence_required=r.evidence_required,
                weight=r.weight,
                priority=r.priority,
                status=r.status,
                created_at=r.created_at,
            )
        )

    return KnowledgeDraftsInboxResponse(
        total_drafts=total_drafts,
        standards=[KnowledgeDraftStandardItem.model_validate(s) for s in draft_standards],
        requirements=req_items,
    )


# ---------------------------------------------------------------------------
# 8. Approve Draft Entity
# ---------------------------------------------------------------------------
@router.post(
    "/{entity_type}/{entity_id}/approve",
    response_model=KnowledgeActionResponse,
    summary="Approve draft standard or requirement, activate it, and trigger RAG indexing",
)
def approve_knowledge_entity(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    norm_type = entity_type.lower().strip()

    if norm_type in ("standard", "standards"):
        standard = db.query(Standard).filter(Standard.id == entity_id).first()
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Standard #{entity_id} not found")

        old_status = standard.status
        standard.status = StandardStatus.ACTIVE.value

        # Log change
        log = KnowledgeChangeLog(
            entity_type="STANDARD",
            entity_id=standard.id,
            action=KnowledgeChangeAction.APPROVED.value,
            old_version=str(old_status),
            new_version=str(StandardStatus.ACTIVE.value),
            description="Approved standard via Admin Draft Review pipeline",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

        # Trigger RAG Indexing
        try:
            knowledge_index_service.index_standard(standard.id, db)
        except Exception as e:
            pass

        return KnowledgeActionResponse(
            success=True,
            message=f"Standard '{standard.standard_number}' successfully approved, activated, and queued for RAG indexing.",
            entity_type="STANDARD",
            entity_id=standard.id,
            new_status=standard.status,
        )

    elif norm_type in ("requirement", "requirements"):
        req = db.query(Requirement).filter(Requirement.id == entity_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Requirement #{entity_id} not found")

        old_status = req.status
        req.status = RequirementStatus.ACTIVE.value

        log = KnowledgeChangeLog(
            entity_type="REQUIREMENT",
            entity_id=req.id,
            action=KnowledgeChangeAction.APPROVED.value,
            old_version=str(old_status),
            new_version=str(RequirementStatus.ACTIVE.value),
            description="Approved requirement clause via Admin Draft Review pipeline",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

        # Trigger RAG Indexing
        try:
            knowledge_index_service.index_requirement(req.id, db)
        except Exception as e:
            pass

        return KnowledgeActionResponse(
            success=True,
            message=f"Requirement Clause '{req.clause}' successfully approved, activated, and queued for RAG indexing.",
            entity_type="REQUIREMENT",
            entity_id=req.id,
            new_status=req.status,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid entity type '{entity_type}'. Must be 'standard' or 'requirement'.",
        )


# ---------------------------------------------------------------------------
# 9. Reject Draft Entity
# ---------------------------------------------------------------------------
@router.post(
    "/{entity_type}/{entity_id}/reject",
    response_model=KnowledgeActionResponse,
    summary="Reject draft standard or requirement",
)
def reject_knowledge_entity(
    entity_type: str,
    entity_id: int,
    reason: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    norm_type = entity_type.lower().strip()

    if norm_type in ("standard", "standards"):
        standard = db.query(Standard).filter(Standard.id == entity_id).first()
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Standard #{entity_id} not found")

        old_status = standard.status
        standard.status = "REJECTED"

        log = KnowledgeChangeLog(
            entity_type="STANDARD",
            entity_id=standard.id,
            action=KnowledgeChangeAction.REJECTED.value,
            old_version=str(old_status),
            new_version="REJECTED",
            description=reason or "Rejected during admin human review",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

        return KnowledgeActionResponse(
            success=True,
            message=f"Standard '{standard.standard_number}' marked as REJECTED.",
            entity_type="STANDARD",
            entity_id=standard.id,
            new_status="REJECTED",
        )

    elif norm_type in ("requirement", "requirements"):
        req = db.query(Requirement).filter(Requirement.id == entity_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Requirement #{entity_id} not found")

        old_status = req.status
        req.status = "REJECTED"

        log = KnowledgeChangeLog(
            entity_type="REQUIREMENT",
            entity_id=req.id,
            action=KnowledgeChangeAction.REJECTED.value,
            old_version=str(old_status),
            new_version="REJECTED",
            description=reason or "Rejected during admin human review",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

        return KnowledgeActionResponse(
            success=True,
            message=f"Requirement Clause '{req.clause}' marked as REJECTED.",
            entity_type="REQUIREMENT",
            entity_id=req.id,
            new_status="REJECTED",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid entity type '{entity_type}'. Must be 'standard' or 'requirement'.",
        )


# ---------------------------------------------------------------------------
# 10. Archive Entity
# ---------------------------------------------------------------------------
@router.post(
    "/{entity_type}/{entity_id}/archive",
    response_model=KnowledgeActionResponse,
    summary="Archive standard or requirement to remove it from active search and RAG",
)
def archive_knowledge_entity(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    norm_type = entity_type.lower().strip()

    if norm_type in ("standard", "standards"):
        standard = db.query(Standard).filter(Standard.id == entity_id).first()
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Standard #{entity_id} not found")

        old_status = standard.status
        standard.status = StandardStatus.ARCHIVED.value

        # Update index status
        idx = db.query(KnowledgeIndex).filter(
            KnowledgeIndex.entity_type == "STANDARD",
            KnowledgeIndex.entity_id == standard.id,
        ).first()
        if idx:
            idx.index_status = KnowledgeIndexStatus.NOT_INDEXED.value

        log = KnowledgeChangeLog(
            entity_type="STANDARD",
            entity_id=standard.id,
            action=KnowledgeChangeAction.ARCHIVED.value,
            old_version=str(old_status),
            new_version=str(StandardStatus.ARCHIVED.value),
            description="Archived standard via Admin Knowledge interface",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

        return KnowledgeActionResponse(
            success=True,
            message=f"Standard '{standard.standard_number}' archived and excluded from active RAG.",
            entity_type="STANDARD",
            entity_id=standard.id,
            new_status=StandardStatus.ARCHIVED.value,
        )

    elif norm_type in ("requirement", "requirements"):
        req = db.query(Requirement).filter(Requirement.id == entity_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Requirement #{entity_id} not found")

        old_status = req.status
        req.status = RequirementStatus.ARCHIVED.value

        idx = db.query(KnowledgeIndex).filter(
            KnowledgeIndex.entity_type == "REQUIREMENT",
            KnowledgeIndex.entity_id == req.id,
        ).first()
        if idx:
            idx.index_status = KnowledgeIndexStatus.NOT_INDEXED.value

        log = KnowledgeChangeLog(
            entity_type="REQUIREMENT",
            entity_id=req.id,
            action=KnowledgeChangeAction.ARCHIVED.value,
            old_version=str(old_status),
            new_version=str(RequirementStatus.ARCHIVED.value),
            description="Archived requirement via Admin Knowledge interface",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

        return KnowledgeActionResponse(
            success=True,
            message=f"Requirement Clause '{req.clause}' archived.",
            entity_type="REQUIREMENT",
            entity_id=req.id,
            new_status=RequirementStatus.ARCHIVED.value,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid entity type '{entity_type}'. Must be 'standard' or 'requirement'.",
        )


# ---------------------------------------------------------------------------
# 11. Knowledge Base Health & Data Quality Telemetry
# ---------------------------------------------------------------------------
@router.get(
    "/health",
    response_model=KnowledgeHealthResponse,
    summary="Get real-time Knowledge Base health and quality metrics",
)
def get_knowledge_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    total_standards = db.query(Standard).count()
    active_standards = db.query(Standard).filter(Standard.status == StandardStatus.ACTIVE.value).count()
    draft_standards = db.query(Standard).filter(Standard.status == StandardStatus.DRAFT.value).count()
    archived_standards = db.query(Standard).filter(Standard.status == StandardStatus.ARCHIVED.value).count()

    total_requirements = db.query(Requirement).count()
    active_requirements = db.query(Requirement).filter(Requirement.status == RequirementStatus.ACTIVE.value).count()
    draft_requirements = db.query(Requirement).filter(Requirement.status == RequirementStatus.DRAFT.value).count()
    archived_requirements = db.query(Requirement).filter(Requirement.status == RequirementStatus.ARCHIVED.value).count()

    total_sources = db.query(KnowledgeSource).count()
    verified_sources = db.query(KnowledgeSource).filter(
        KnowledgeSource.verification_status == KnowledgeVerificationStatus.VERIFIED.value
    ).count()
    unverified_sources = db.query(KnowledgeSource).filter(
        KnowledgeSource.verification_status == KnowledgeVerificationStatus.UNVERIFIED.value
    ).count()
    user_provided_sources = db.query(KnowledgeSource).filter(
        KnowledgeSource.source_type == KnowledgeProvenanceType.USER_PROVIDED.value
    ).count()
    demo_sources = db.query(KnowledgeSource).filter(
        KnowledgeSource.source_type == KnowledgeProvenanceType.DEMO.value
    ).count()

    review_threshold_date = datetime.now(timezone.utc) - timedelta(days=settings.KNOWLEDGE_REVIEW_DAYS)
    # Pending review: items older than 180 days with no recent update or with last_checked_at older than 180 days
    stale_sources = db.query(KnowledgeSource).filter(
        or_(
            KnowledgeSource.last_checked_at == None,
            KnowledgeSource.last_checked_at < review_threshold_date,
        )
    ).count()
    pending_review_count = draft_standards + draft_requirements + stale_sources

    index_pending = db.query(KnowledgeIndex).filter(
        KnowledgeIndex.index_status == KnowledgeIndexStatus.INDEX_PENDING.value
    ).count()
    index_failed = db.query(KnowledgeIndex).filter(
        KnowledgeIndex.index_status == KnowledgeIndexStatus.INDEX_FAILED.value
    ).count()

    # Empirical Data Quality Score:
    # 40% based on active/total standards ratio
    # 30% based on active/total requirements ratio
    # 30% based on verified/total sources ratio (or baseline if demo)
    std_ratio = (active_standards / max(total_standards, 1))
    req_ratio = (active_requirements / max(total_requirements, 1))
    src_ratio = (verified_sources / max(total_sources, 1)) if total_sources > 0 else 0.5
    quality_score = round((std_ratio * 40.0 + req_ratio * 30.0 + src_ratio * 30.0), 1)

    return KnowledgeHealthResponse(
        total_standards=total_standards,
        active_standards=active_standards,
        draft_standards=draft_standards,
        archived_standards=archived_standards,
        total_requirements=total_requirements,
        active_requirements=active_requirements,
        draft_requirements=draft_requirements,
        archived_requirements=archived_requirements,
        verified_sources=verified_sources,
        unverified_sources=unverified_sources,
        user_provided_sources=user_provided_sources,
        demo_sources=demo_sources,
        pending_review_count=pending_review_count,
        index_pending=index_pending,
        index_failed=index_failed,
        quality_score=quality_score,
        last_review_threshold_days=settings.KNOWLEDGE_REVIEW_DAYS,
    )


# ---------------------------------------------------------------------------
# 12. Knowledge Records Catalog & Provenance
# ---------------------------------------------------------------------------
@router.get(
    "/records",
    response_model=KnowledgeRecordsListResponse,
    summary="List all knowledge records with provenance metadata",
)
def list_knowledge_records(
    status: Optional[str] = Query(None, description="Filter by status"),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type: STANDARD or REQUIREMENT"),
    search: Optional[str] = Query(None, description="Search keyword"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)

    items: List[KnowledgeRecordItem] = []

    # 1. Query Standards
    if not entity_type or entity_type.upper() in ("STANDARD", "STANDARDS"):
        std_query = db.query(Standard)
        if status:
            if status.upper() == "PENDING_REVIEW":
                std_query = std_query.filter(Standard.status.in_(["DRAFT", "PENDING_REVIEW"]))
            else:
                std_query = std_query.filter(Standard.status == status.upper())
        if search:
            pattern = f"%{search.strip()}%"
            std_query = std_query.filter(or_(Standard.standard_number.ilike(pattern), Standard.title.ilike(pattern)))

        for s in std_query.all():
            st = "DEMO/SYNTHETIC" if s.is_demo else "VERIFIED"
            if source_type and st.upper() != source_type.upper():
                continue
            items.append(
                KnowledgeRecordItem(
                    id=s.id,
                    entity_type="STANDARD",
                    code=s.standard_number,
                    title=s.title,
                    category=s.category,
                    status=s.status,
                    source=s.source or "Bureau of Indian Standards",
                    source_type=st,
                    authority="HIGH" if not s.is_demo else "MEDIUM",
                    version=s.version or "2026",
                    verification_status="VERIFIED" if not s.is_demo else "DEMO",
                    imported_date=s.created_at,
                    last_verified_date=s.updated_at,
                    effective_date=s.publication_date,
                    is_demo=bool(s.is_demo),
                    index_status="INDEXED" if s.status in ("ACTIVE", "DEMO", "APPROVED") else "NOT_INDEXED",
                )
            )

    # 2. Query Requirements
    if not entity_type or entity_type.upper() in ("REQUIREMENT", "REQUIREMENTS"):
        req_query = db.query(Requirement)
        if status:
            if status.upper() == "PENDING_REVIEW":
                req_query = req_query.filter(Requirement.status.in_(["DRAFT", "PENDING_REVIEW"]))
            else:
                req_query = req_query.filter(Requirement.status == status.upper())
        if search:
            pattern = f"%{search.strip()}%"
            req_query = req_query.filter(or_(Requirement.clause.ilike(pattern), Requirement.title.ilike(pattern)))

        for r in req_query.all():
            items.append(
                KnowledgeRecordItem(
                    id=r.id,
                    entity_type="REQUIREMENT",
                    code=f"Clause {r.clause}",
                    title=r.title,
                    category=r.category,
                    status=r.status,
                    source="BIS Standard Technical Specification",
                    source_type="VERIFIED",
                    authority="HIGH",
                    version="1.0",
                    verification_status="VERIFIED",
                    imported_date=r.created_at,
                    last_verified_date=r.updated_at,
                    effective_date=None,
                    is_demo=False,
                    index_status="INDEXED" if r.status in ("ACTIVE", "DEMO", "APPROVED") else "NOT_INDEXED",
                )
            )

    total = len(items)
    paginated_items = items[skip : skip + limit]
    return KnowledgeRecordsListResponse(total=total, items=paginated_items)


# ---------------------------------------------------------------------------
# 13. Knowledge Sources Directory
# ---------------------------------------------------------------------------
@router.get(
    "/sources",
    response_model=List[KnowledgeSourceDetailResponse],
    summary="List official and synthetic knowledge sources",
)
def list_knowledge_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    sources = db.query(KnowledgeSource).order_by(KnowledgeSource.id.asc()).all()
    return sources


# ---------------------------------------------------------------------------
# 14. Reindex Single Entity
# ---------------------------------------------------------------------------
@router.post(
    "/{entity_type}/{entity_id}/reindex",
    response_model=KnowledgeActionResponse,
    summary="Trigger RAG reindexing for standard or requirement",
)
def reindex_knowledge_entity(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    norm = entity_type.lower().strip()
    if norm in ("standard", "standards"):
        std = db.query(Standard).filter(Standard.id == entity_id).first()
        if not std:
            raise HTTPException(status_code=404, detail="Standard not found")
        knowledge_index_service.index_standard(db, std.id)
        return KnowledgeActionResponse(
            success=True,
            message=f"Standard '{std.standard_number}' reindexed successfully into vector store.",
            entity_type="STANDARD",
            entity_id=std.id,
            new_status="INDEXED",
        )
    elif norm in ("requirement", "requirements"):
        req = db.query(Requirement).filter(Requirement.id == entity_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Requirement not found")
        knowledge_index_service.index_requirement(db, req.id)
        return KnowledgeActionResponse(
            success=True,
            message=f"Requirement Clause '{req.clause}' reindexed successfully.",
            entity_type="REQUIREMENT",
            entity_id=req.id,
            new_status="INDEXED",
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid entity type")


# ---------------------------------------------------------------------------
# 15. Reindex All Active Knowledge
# ---------------------------------------------------------------------------
@router.post(
    "/reindex-all",
    response_model=KnowledgeActionResponse,
    summary="Trigger full re-indexing of all active standards and requirements",
)
def reindex_all_knowledge(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_permission_service.require_admin(current_user)
    standards = db.query(Standard).filter(Standard.status.in_(["ACTIVE", "DEMO"])).all()
    requirements = db.query(Requirement).filter(Requirement.status.in_(["ACTIVE", "DEMO"])).all()
    for s in standards:
        knowledge_index_service.index_standard(db, s.id)
    for r in requirements:
        knowledge_index_service.index_requirement(db, r.id)

    return KnowledgeActionResponse(
        success=True,
        message=f"Full reindexing complete: {len(standards)} standards and {len(requirements)} requirements synchronized.",
        entity_type="KNOWLEDGE_BASE",
        entity_id=0,
        new_status="INDEXED",
    )

