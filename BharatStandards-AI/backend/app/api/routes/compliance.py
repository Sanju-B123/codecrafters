"""
BharatStandards AI - Compliance API Routes
Exposes REST endpoints for executing compliance readiness checks, retrieving results,
gap prioritization, and report histories.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.compliance import ComplianceReport
from app.models.user import User
from app.schemas.compliance import (
    ComplianceCheckRequest,
    ComplianceReportDetailResponse,
    ComplianceReportResponse,
    ComplianceReportSummaryResponse,
    ComplianceResultResponse,
    GapResponse,
    ComplianceRiskItem,
    ProductRiskSummaryResponse,
    RiskActionPlanItem,
    WhatIfRequest,
    WhatIfResponse,
    RiskRecalculateResponse,
)
from app.services.compliance_service import ComplianceService
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/compliance", tags=["Compliance Engine"])


def _augment_report(report: ComplianceReport) -> ComplianceReportResponse:
    """Helper to attach product and standard display titles to response."""
    return ComplianceReportResponse(
        id=report.id,
        product_id=report.product_id,
        standard_id=report.standard_id,
        score=report.score,
        status=report.status,
        total_requirements=report.total_requirements,
        passed_count=report.passed_count,
        partial_count=report.partial_count,
        missing_count=report.missing_count,
        summary=report.summary,
        scoring_methodology=report.scoring_methodology,
        created_at=report.created_at,
        updated_at=report.updated_at,
        product_name=report.product.name if report.product else None,
        standard_number=report.standard.standard_number if report.standard else None,
        standard_title=report.standard.title if report.standard else None,
        overall_risk_score=report.overall_risk_score,
        risk_level=report.risk_level,
    )


@router.post(
    "/check",
    response_model=ComplianceReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Compliance Readiness Audit",
)
def run_compliance_check(
    payload: ComplianceCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run an explainable, deterministic compliance evaluation comparing Product specifications,
    applicable standard requirements, and uploaded technical evidence.
    """
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="COMPLIANCE_STARTED",
        entity_type="compliance_report",
        entity_id=None,
        description=f"Compliance assessment initiated for product {payload.product_id} against standard {payload.standard_id}",
        metadata={"product_id": payload.product_id, "standard_id": payload.standard_id},
    )
    report = ComplianceService.run_compliance_check(
        product_id=payload.product_id,
        standard_id=payload.standard_id,
        user_id=current_user.id,
        db=db,
    )
    product_name = report.product.name if report.product else f"Product {report.product_id}"
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="COMPLIANCE_COMPLETED",
        entity_type="compliance_report",
        entity_id=report.id,
        description=f"Compliance assessment completed for '{product_name}' with readiness score {report.score}%",
        metadata={
            "product_id": report.product_id,
            "standard_id": report.standard_id,
            "score": report.score,
            "passed": report.passed_count,
            "partial": report.partial_count,
            "missing": report.missing_count,
        },
    )

    has_gaps = (report.missing_count > 0) or (report.partial_count > 0)
    notif_type = "COMPLIANCE_GAP" if has_gaps else "COMPLIANCE_COMPLETED"
    notif_title = f"Compliance Readiness: {report.score}%"
    notif_msg = (
        f"Assessment completed for '{product_name}'. Identified {report.missing_count + report.partial_count} gaps or partial requirements."
        if has_gaps
        else f"Assessment completed for '{product_name}'. All evaluated requirements met."
    )
    notification_service.create_notification(
        db=db,
        user_id=current_user.id,
        type=notif_type,
        title=notif_title,
        message=notif_msg,
        entity_type="compliance_report",
        entity_id=report.id,
    )
    return _augment_report(report)


@router.get(
    "",
    response_model=List[ComplianceReportResponse],
    summary="List User Compliance Assessment History",
)
def list_compliance_reports(
    product_id: Optional[int] = Query(None, description="Filter assessments by product ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronological compliance assessment reports owned by the authenticated user.
    """
    reports = ComplianceService.get_user_reports_history(
        user_id=current_user.id,
        db=db,
        product_id=product_id,
    )
    return [_augment_report(r) for r in reports]


@router.get(
    "/product/{product_id}/latest",
    response_model=Optional[ComplianceReportResponse],
    summary="Get Latest Compliance Report for a Product",
)
def get_latest_product_compliance(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent completed compliance assessment for a product.
    """
    report = ComplianceService.get_latest_product_report(
        product_id=product_id,
        user_id=current_user.id,
        db=db,
    )
    if not report:
        return None
    return _augment_report(report)


@router.get(
    "/{report_id}",
    response_model=ComplianceReportDetailResponse,
    summary="Get Comprehensive Compliance Report Details",
)
def get_compliance_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a full compliance report including all evaluated clause requirements,
    traceable evidence citations, reasons, and prioritized gap registers.
    """
    report = ComplianceService.get_report_details(report_id, current_user.id, db)
    results = ComplianceService.get_report_results(report_id, current_user.id, db)
    gaps = ComplianceService.get_report_gaps(report_id, current_user.id, db)

    base = _augment_report(report)
    return ComplianceReportDetailResponse(
        **base.model_dump(),
        results=[ComplianceResultResponse.model_validate(r) for r in results],
        gaps=[GapResponse.model_validate(g) for g in gaps],
    )


@router.get(
    "/{report_id}/results",
    response_model=List[ComplianceResultResponse],
    summary="Get Clause Requirement Results",
)
def get_compliance_results(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve clause-by-clause evaluation results (PASS, PARTIAL, MISSING) for a report.
    """
    results = ComplianceService.get_report_results(report_id, current_user.id, db)
    return [ComplianceResultResponse.model_validate(r) for r in results]


@router.get(
    "/{report_id}/gaps",
    response_model=List[GapResponse],
    summary="Get Compliance Gap Register",
)
def get_compliance_gaps(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve non-conformance and documentation gaps ranked by priority.
    """
    gaps = ComplianceService.get_report_gaps(report_id, current_user.id, db)
    return [GapResponse.model_validate(g) for g in gaps]


@router.get(
    "/{report_id}/summary",
    response_model=ComplianceReportSummaryResponse,
    summary="Get Compliance Executive Summary",
)
def get_compliance_summary(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve high-level summary metrics, scores, and gap severity distribution.
    """
    return ComplianceService.get_report_summary(report_id, current_user.id, db)


@router.get(
    "/{report_id}/recommended-services",
    summary="Get Prioritized Actions & Relevant BIS Services for Compliance Gaps",
)
def get_compliance_recommended_services(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve prioritized next steps and relevant BIS services derived from a completed
    compliance readiness audit, resolving critical missing clauses.
    """
    from app.services.service_recommendation_service import ServiceRecommendationService
    return ServiceRecommendationService.get_recommendations_for_compliance_report(
        db=db,
        user=current_user,
        report_id=report_id,
    )


@router.get(
    "/{report_id}/report",
    summary="Get or Generate Compliance Readiness Report Dossier",
)
def get_or_generate_compliance_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve existing or generate a new structured Compliance Readiness Report
    directly from a compliance audit ID.
    """
    from app.models.report import Report
    from app.services.report_service import ReportService

    existing_rep = (
        db.query(Report)
        .filter(Report.compliance_report_id == report_id, Report.user_id == current_user.id)
        .order_by(Report.generated_at.desc())
        .first()
    )
    if existing_rep:
        return ReportService.get_report_details(existing_rep.id, current_user.id, db)

    # Automatically generate report
    return ReportService.generate_report(report_id, current_user.id, db)


@router.get(
    "/{report_id}/risk",
    response_model=ProductRiskSummaryResponse,
    summary="Get Explainable Compliance Risk Overview",
)
def get_compliance_risk_summary(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve an explainable risk summary, overall 0-100 risk score, risk level,
    top 5 risks with factor breakdowns, and prioritized action recommendations.
    """
    report = db.query(ComplianceReport).filter(ComplianceReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance report not found.")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this compliance assessment.")

    from app.services.risk_engine import ComplianceRiskEngine
    return ComplianceRiskEngine.calculate_risk(compliance_report_id=report_id, db=db, force_refresh=False)


@router.get(
    "/{report_id}/risks",
    response_model=List[ComplianceRiskItem],
    summary="Get Detailed Clause-Level Risk Items",
)
def get_compliance_clause_risks(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all clause-by-clause risk assessments with factor contribution breakdowns.
    """
    report = db.query(ComplianceReport).filter(ComplianceReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance report not found.")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this compliance assessment.")

    from app.services.risk_engine import ComplianceRiskEngine
    return ComplianceRiskEngine.get_clause_risks(compliance_report_id=report_id, db=db)


@router.get(
    "/{report_id}/risk/actions",
    response_model=List[RiskActionPlanItem],
    summary="Get Prioritized Risk Action Plan",
)
def get_compliance_risk_actions(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve prioritized action plan ranked by potential risk reduction.
    """
    report = db.query(ComplianceReport).filter(ComplianceReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance report not found.")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this compliance assessment.")

    from app.services.risk_engine import ComplianceRiskEngine
    summary = ComplianceRiskEngine.calculate_risk(compliance_report_id=report_id, db=db, force_refresh=False)
    return summary.recommended_actions


@router.post(
    "/{report_id}/what-if",
    response_model=WhatIfResponse,
    summary="Simulate What-If Scenario for Resolved Gaps",
)
def run_what_if_analysis(
    report_id: int,
    payload: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Simulate resolving specific compliance requirements in-memory.
    Computes projected readiness score and projected risk reduction without mutating database records.
    """
    from app.services.what_if_service import WhatIfAnalysisService
    return WhatIfAnalysisService.simulate_resolved_gaps(
        compliance_report_id=report_id,
        resolved_requirement_ids=payload.resolved_requirement_ids,
        user_id=current_user.id,
        db=db,
    )


@router.post(
    "/{report_id}/recalculate-risk",
    response_model=RiskRecalculateResponse,
    summary="Force Recalculation of Compliance & Risk Profile",
)
def recalculate_compliance_risk(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Invalidates risk cache, re-executes compliance assessment, and re-evaluates risk profile.
    """
    from app.services.compliance_recalculation_service import ComplianceRecalculationService
    return ComplianceRecalculationService.recalculate(
        compliance_report_id=report_id,
        user_id=current_user.id,
        db=db,
    )



