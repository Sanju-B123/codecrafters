"""
BharatStandards AI - Compliance Recalculation Service
Coordinates re-assessment through the canonical ComplianceService and immediately
triggers risk recalculation via ComplianceRiskEngine without duplicating audit logic.
"""
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.compliance import ComplianceReport
from app.schemas.compliance import RiskRecalculateResponse
from app.services.compliance_service import ComplianceService
from app.services.risk_engine import ComplianceRiskEngine


class ComplianceRecalculationService:
    """
    Coordinates end-to-end compliance re-assessment and risk cache invalidation.
    """

    @classmethod
    def recalculate(
        cls,
        compliance_report_id: int,
        user_id: int,
        db: Session,
    ) -> RiskRecalculateResponse:
        """
        1. Verify report ownership.
        2. Re-run compliance assessment using canonical ComplianceService.
        3. Force recalculation of clause risks and product risk summary.
        4. Return summary response.
        """
        report = (
            db.query(ComplianceReport)
            .filter(ComplianceReport.id == compliance_report_id)
            .first()
        )
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compliance report #{compliance_report_id} not found.",
            )

        if report.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not own this compliance assessment.",
            )

        # 1. Re-run compliance readiness check (updates results and report)
        updated_report = ComplianceService.run_compliance_check(
            product_id=report.product_id,
            standard_id=report.standard_id,
            user_id=user_id,
            db=db,
        )

        # 2. Force recalculation in ComplianceRiskEngine
        risk_summary = ComplianceRiskEngine.calculate_risk(
            compliance_report_id=updated_report.id,
            db=db,
            force_refresh=True,
        )

        return RiskRecalculateResponse(
            compliance_report_id=updated_report.id,
            overall_risk_score=risk_summary.overall_risk_score,
            risk_level=risk_summary.risk_level,
            recalculated_at=datetime.now(timezone.utc),
            message="Compliance assessment and risk profile successfully recalculated.",
            risk_summary=risk_summary,
        )
