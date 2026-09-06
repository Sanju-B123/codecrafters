"""
BharatStandards AI - Compliance Report Service
Manages report compilation, historical tracking, human-readable report numbering (BSA-YYYY-NNNNNN),
and single-source-of-truth aggregation from ComplianceReport records.
"""
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.report import Report
from app.models.compliance import ComplianceReport, GapPriority, ComplianceStatus
from app.models.product import Product
from app.models.standard import Standard
from app.models.document import Document
from app.models.user import User
from app.schemas.report import (
    ReportBriefResponse,
    ReportDetailResponse,
    ReportProductInfo,
    ReportStandardInfo,
    ReportAssessmentItem,
    ReportGapItem,
    ReportActionPlanItem,
    ReportSourceItem,
    ReportHistoryItem,
)
from app.services.pdf_report_service import PDFReportService, DISCLAIMER_TEXT


class ReportService:
    """
    Service coordinating compliance report compilation, validation, and PDF generation.
    """

    @classmethod
    def generate_report(
        cls,
        compliance_report_id: int,
        user_id: int,
        db: Session,
    ) -> ReportDetailResponse:
        """
        Create a new formal Compliance Readiness Report derived from an existing compliance assessment.
        Ensures 100% data consistency with the compliance engine results.
        """
        comp = db.query(ComplianceReport).filter(ComplianceReport.id == compliance_report_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compliance assessment with ID {compliance_report_id} not found.",
            )

        # Strict multi-tenant isolation
        if comp.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to generate reports for this compliance audit.",
            )

        now = datetime.now(timezone.utc)
        current_year = now.year

        # Sequential human-readable report number e.g. BSA-2026-000001
        count = db.query(Report).count() + 1
        report_number = f"BSA-{current_year}-{count:06d}"

        product_name = comp.product.name if comp.product else "Product"
        title = f"Compliance Readiness Dossier: {product_name}"

        report = Report(
            user_id=user_id,
            compliance_report_id=comp.id,
            report_number=report_number,
            title=title,
            status="COMPLETED",
            generated_at=now,
            created_at=now,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return cls.get_report_details(report.id, user_id, db)

    @classmethod
    def get_user_reports(
        cls,
        user_id: int,
        db: Session,
        product_id: Optional[int] = None,
    ) -> List[ReportBriefResponse]:
        """
        List chronological reports owned by the authenticated user.
        """
        query = db.query(Report).filter(Report.user_id == user_id)
        if product_id:
            query = query.join(ComplianceReport).filter(ComplianceReport.product_id == product_id)

        reports = query.order_by(desc(Report.generated_at)).all()
        briefs = []

        for r in reports:
            comp = r.compliance_report
            if not comp:
                continue

            product = comp.product
            standard = comp.standard

            briefs.append(
                ReportBriefResponse(
                    id=r.id,
                    report_number=r.report_number,
                    title=r.title,
                    compliance_report_id=r.compliance_report_id,
                    product_id=comp.product_id,
                    product_name=product.name if product else "N/A",
                    standard_id=comp.standard_id,
                    standard_number=standard.standard_number if standard else "IS",
                    standard_title=standard.title if standard else "N/A",
                    readiness_score=comp.score,
                    status=r.status,
                    total_requirements=comp.total_requirements,
                    passed_count=comp.passed_count,
                    partial_count=comp.partial_count,
                    missing_count=comp.missing_count,
                    is_demo=standard.is_demo if standard else True,
                    generated_at=r.generated_at,
                    created_at=r.created_at,
                )
            )

        return briefs

    @classmethod
    def get_report_details(
        cls,
        report_id: int,
        user_id: int,
        db: Session,
    ) -> ReportDetailResponse:
        """
        Compile complete structured report dossier.
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {report_id} not found.",
            )

        if report.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to access this compliance report.",
            )

        comp = report.compliance_report
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated compliance assessment record is missing.",
            )

        product = comp.product
        standard = comp.standard

        # 1. Product Metadata
        prod_info = ReportProductInfo(
            id=product.id if product else 0,
            name=product.name if product else "N/A",
            manufacturer=product.manufacturer if product else None,
            model_number=product.model_number if product else None,
            category=product.category if product else "N/A",
            description=product.description if product else None,
            intended_use=product.intended_use if product else None,
            technical_details=product.technical_details if product else None,
        )

        # 2. Standard Metadata
        std_info = ReportStandardInfo(
            id=standard.id if standard else 0,
            standard_number=standard.standard_number if standard else "IS",
            title=standard.title if standard else "N/A",
            category=standard.category if standard else "N/A",
            version=standard.version if standard else "2026",
            status=standard.status if standard else "ACTIVE",
            scope=standard.scope if standard else None,
            description=standard.description if standard else None,
            source=standard.source if standard else "Bureau of Indian Standards",
        )

        # 3. Requirement Assessments
        assessments: List[ReportAssessmentItem] = []
        for res in comp.results:
            req = res.requirement
            doc_name = None
            page = None
            snippet = None

            if res.evidence:
                try:
                    ev = json.loads(res.evidence)
                    if isinstance(ev, dict):
                        doc_name = ev.get("document_name")
                        page = ev.get("page")
                        snippet = ev.get("snippet")
                except Exception:
                    snippet = res.evidence

            assessments.append(
                ReportAssessmentItem(
                    clause=req.clause if req else "N/A",
                    title=req.title if req else "Requirement",
                    category=req.category if req else "General",
                    status=res.status,
                    confidence=res.confidence,
                    evidence=res.evidence,
                    reason=res.reason,
                    recommended_action=res.recommended_action,
                    weight=res.weight,
                    document_name=doc_name,
                    page=page,
                    snippet=snippet,
                )
            )

        # 4. Gaps Register
        gaps: List[ReportGapItem] = []
        for g in comp.gaps:
            req = g.requirement
            gaps.append(
                ReportGapItem(
                    priority=g.priority,
                    clause=req.clause if req else "N/A",
                    requirement_title=req.title if req else "Gap",
                    problem=g.description,
                    current_evidence=g.evidence,
                    recommended_action=g.recommended_action,
                )
            )

        # 5. Prioritized Action Plan
        action_plan: List[ReportActionPlanItem] = []
        # Sort gaps by priority: CRITICAL -> HIGH -> MEDIUM -> LOW
        priority_weights = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        sorted_gaps = sorted(comp.gaps, key=lambda x: priority_weights.get(x.priority, 4))

        for g in sorted_gaps:
            req = g.requirement
            action_plan.append(
                ReportActionPlanItem(
                    priority=g.priority,
                    action=g.recommended_action,
                    related_requirement=f"Clause {req.clause}: {req.title}" if req else "Mandatory Clause",
                    reason=g.description,
                    target_route="/documents" if g.priority == GapPriority.CRITICAL.value else f"/compliance/{comp.id}",
                )
            )

        # General final step
        action_plan.append(
            ReportActionPlanItem(
                priority="LOW",
                action="Consult Scheme-I Licensing Roadmap on BIS Services Portal",
                related_requirement="Formal Certification Filing",
                reason="Once all empirical evidence gaps are closed, review statutory application prerequisites.",
                target_route="/services",
            )
        )

        # 6. Sources Lineage
        sources: List[ReportSourceItem] = []
        # Official standard source
        sources.append(
            ReportSourceItem(
                source_type="OFFICIAL_STANDARD",
                name=f"{standard.standard_number}: {standard.title}" if standard else "Indian Standard",
                reference=standard.source or "Bureau of Indian Standards",
                details=f"Version: {standard.version or '2026'} • Category: {standard.category or 'Electrical'}",
                url=standard.source_url,
            )
        )

        # User documents sources
        user_docs = db.query(Document).filter(
            Document.user_id == user_id,
            Document.product_id == comp.product_id,
        ).all()

        for d in user_docs:
            sources.append(
                ReportSourceItem(
                    source_type="USER_DOCUMENT",
                    name=d.original_filename,
                    reference=f"Vault Document ID #{d.id}",
                    details=f"Pages: {d.page_count or 1} • Size: {round((d.file_size or 0) / 1024, 1)} KB • Status: {d.status}",
                    url=None,
                )
            )

        if not user_docs and standard and standard.is_demo:
            sources.append(
                ReportSourceItem(
                    source_type="SYNTHETIC_DEMO",
                    name="EWH-Safety-Test-Report-2026.pdf",
                    reference="Synthetic Benchmark Laboratory Dossier",
                    details="Pre-calibrated demonstration evidence matching DEMO-IS-001 clauses.",
                    url=None,
                )
            )

        # 7. Assessment History for Product
        historical_comps = (
            db.query(ComplianceReport)
            .filter(ComplianceReport.product_id == comp.product_id, ComplianceReport.user_id == user_id)
            .order_by(ComplianceReport.created_at.asc())
            .all()
        )
        history: List[ReportHistoryItem] = []
        for idx, h in enumerate(historical_comps, start=1):
            matching_rep = db.query(Report).filter(Report.compliance_report_id == h.id).first()
            history.append(
                ReportHistoryItem(
                    version=idx,
                    report_id=matching_rep.id if matching_rep else None,
                    report_number=matching_rep.report_number if matching_rep else None,
                    compliance_report_id=h.id,
                    readiness_score=h.score,
                    passed_count=h.passed_count,
                    partial_count=h.partial_count,
                    missing_count=h.missing_count,
                    generated_at=h.created_at,
                    status=h.status,
                )
            )

        summary_text = (
            f"{comp.passed_count} of {comp.total_requirements} assessed requirements have verified supporting evidence. "
            f"Product currently achieves {comp.score}% compliance readiness. Closing {comp.missing_count} critical missing "
            f"clause(s) will elevate readiness toward formal Scheme-I application filing."
        )

        crit_count = sum(1 for g in comp.gaps if g.priority == GapPriority.CRITICAL.value)
        high_count = sum(1 for g in comp.gaps if g.priority == GapPriority.HIGH.value)

        # Risk assessment intelligence
        from app.services.risk_engine import ComplianceRiskEngine
        risk_summary = ComplianceRiskEngine.calculate_risk(comp.id, db, force_refresh=False)
        top_risks_data = [t.model_dump() for t in risk_summary.top_risks]

        return ReportDetailResponse(
            id=report.id,
            report_number=report.report_number,
            title=report.title,
            compliance_report_id=comp.id,
            generated_at=report.generated_at,
            status=report.status,
            is_demo=standard.is_demo if standard else True,
            readiness_score=comp.score,
            passed_count=comp.passed_count,
            partial_count=comp.partial_count,
            missing_count=comp.missing_count,
            total_requirements=comp.total_requirements,
            critical_gaps_count=crit_count,
            high_gaps_count=high_count,
            summary=summary_text,
            disclaimer=DISCLAIMER_TEXT,
            product=prod_info,
            standard=std_info,
            overall_risk_score=risk_summary.overall_risk_score,
            risk_level=risk_summary.risk_level,
            top_risks=top_risks_data,
            assessments=assessments,
            gaps=gaps,
            action_plan=action_plan,
            sources=sources,
            history=history,
        )

    @classmethod
    def generate_pdf(
        cls,
        report_id: int,
        user_id: int,
        db: Session,
    ) -> Tuple[bytes, str]:
        """
        Generate raw PDF bytes and filename for export.
        """
        details = cls.get_report_details(report_id, user_id, db)
        pdf_bytes = PDFReportService.generate_pdf(details.model_dump())
        filename = f"{details.report_number}.pdf"
        return pdf_bytes, filename

    @classmethod
    def delete_report(
        cls,
        report_id: int,
        user_id: int,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Permanently delete a compliance report owned by the user.
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {report_id} not found.",
            )

        if report.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to delete this report.",
            )

        db.delete(report)
        db.commit()
        return {"message": f"Report {report.report_number} deleted successfully."}
