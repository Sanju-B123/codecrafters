"""
BharatStandards AI - Compliance Reports API Routes
Exposes REST endpoints for generating structured readiness dossiers,
retrieving detailed reports, downloading PDF exports, and managing report histories.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.report import (
    ReportBriefResponse,
    ReportDetailResponse,
    ReportGenerateRequest,
)
from app.services.report_service import ReportService
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/reports", tags=["Compliance Reports & Export"])


@router.get(
    "",
    response_model=List[ReportBriefResponse],
    summary="List User Compliance Reports",
)
def list_reports(
    product_id: Optional[int] = Query(None, description="Filter reports by product ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronological compliance readiness reports owned by the authenticated user.
    """
    return ReportService.get_user_reports(
        user_id=current_user.id,
        db=db,
        product_id=product_id,
    )


@router.post(
    "/generate",
    response_model=ReportDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Compliance Readiness Report",
)
def generate_report(
    payload: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a formal, structured compliance readiness report derived from an existing
    evaluated compliance assessment.
    """
    report = ReportService.generate_report(
        compliance_report_id=payload.compliance_report_id,
        user_id=current_user.id,
        db=db,
    )
    product_name = report.product.name if report.product else f"Product {report.product_id}"
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="REPORT_GENERATED",
        entity_type="report",
        entity_id=report.id,
        description=f"Compliance readiness report '{report.report_number}' generated for '{product_name}'",
        metadata={
            "report_number": report.report_number,
            "readiness_score": report.readiness_score,
            "product_name": product_name,
        },
    )
    notification_service.create_notification(
        db=db,
        user_id=current_user.id,
        type="REPORT_READY",
        title=f"Report Dossier Ready: {report.report_number}",
        message=f"Compliance readiness dossier is ready for '{product_name}'.",
        entity_type="report",
        entity_id=report.id,
    )
    return report


@router.get(
    "/{id}",
    response_model=ReportDetailResponse,
    summary="Get Detailed Compliance Report Dossier",
)
def get_report(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve complete structured report dossier including cover, executive summary,
    clause assessments, gap register, action plan, and historical versions.
    """
    return ReportService.get_report_details(
        report_id=id,
        user_id=current_user.id,
        db=db,
    )


@router.get(
    "/{id}/download",
    summary="Download Compliance Readiness Dossier as PDF",
)
def download_pdf(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate and stream a presentation-ready multi-page PDF export of the compliance report.
    """
    pdf_bytes, filename = ReportService.generate_pdf(
        report_id=id,
        user_id=current_user.id,
        db=db,
    )
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="REPORT_DOWNLOADED",
        entity_type="report",
        entity_id=id,
        description=f"Compliance readiness report PDF downloaded ({filename})",
        metadata={"filename": filename},
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


@router.delete(
    "/{id}",
    summary="Delete Compliance Report",
)
def delete_report(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete a compliance report owned by the authenticated user.
    """
    return ReportService.delete_report(
        report_id=id,
        user_id=current_user.id,
        db=db,
    )
