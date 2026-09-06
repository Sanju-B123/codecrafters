"""
BharatStandards AI - What-If Scenario Analysis Service
Simulates resolving specific compliance gaps and recalculates projected readiness scores
and risk reduction in-memory without modifying canonical database records.
"""
from typing import Any, Dict, List, Set
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.compliance import (
    ComplianceReport,
    ComplianceResult,
    ComplianceStatus,
)
from app.models.standard import Requirement
from app.schemas.compliance import WhatIfRemainingGap, WhatIfResponse
from app.services.audit_service import audit_service
from app.services.risk_engine import ComplianceRiskEngine


class WhatIfAnalysisService:
    """
    In-memory scenario simulator for compliance readiness and risk reduction.
    """

    @classmethod
    def simulate_resolved_gaps(
        cls,
        compliance_report_id: int,
        resolved_requirement_ids: List[int],
        user_id: int,
        db: Session,
    ) -> WhatIfResponse:
        """
        Simulate marked requirements transitioning to PASS (fully resolved).
        Computes projected readiness score and projected risk score using identical formulas.
        Strictly immutable: does not write or commit any changes to the database.
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

        # Multi-tenant ownership check
        if report.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not own this compliance assessment.",
            )

        # Ensure current risk is calculated
        risk_summary = ComplianceRiskEngine.calculate_risk(compliance_report_id, db, force_refresh=False)
        current_risk = risk_summary.overall_risk_score
        current_score = report.score

        resolved_set: Set[int] = set(resolved_requirement_ids)
        results = (
            db.query(ComplianceResult)
            .filter(ComplianceResult.report_id == compliance_report_id)
            .all()
        )

        total_weight = 0.0
        simulated_earned_weight = 0.0
        simulated_weighted_risk = 0.0

        remaining_gaps: List[WhatIfRemainingGap] = []

        for res in results:
            req = res.requirement or db.query(Requirement).filter(Requirement.id == res.requirement_id).first()
            if not req:
                continue

            weight = req.weight or 2.0
            total_weight += weight

            # If simulated as resolved:
            if res.requirement_id in resolved_set:
                # PASS determination: score factor 1.0, risk factor 0.0
                simulated_factor = 1.0
                simulated_clause_risk = 0.0
            else:
                # Retain existing determination
                if res.status == ComplianceStatus.PASS.value:
                    simulated_factor = 1.0
                elif res.status == ComplianceStatus.PARTIAL.value:
                    simulated_factor = 0.5
                else:
                    simulated_factor = 0.0

                # Retrieve or calculate clause risk
                clause_risk_score, _, _, _ = ComplianceRiskEngine.calculate_clause_risk(res, req)
                simulated_clause_risk = clause_risk_score

                if res.status != ComplianceStatus.PASS.value:
                    remaining_gaps.append(
                        WhatIfRemainingGap(
                            requirement_id=req.id,
                            clause=req.clause,
                            title=req.title,
                            priority=req.priority or "HIGH",
                            risk_score=clause_risk_score,
                        )
                    )

            simulated_earned_weight += weight * simulated_factor
            simulated_weighted_risk += simulated_clause_risk * weight

        # Canonical readiness score calculation (identical to ComplianceService)
        estimated_score = round((simulated_earned_weight / total_weight) * 100, 1) if total_weight > 0 else 0.0
        # Canonical risk score calculation (identical to ComplianceRiskEngine)
        estimated_risk = round((simulated_weighted_risk / total_weight), 1) if total_weight > 0 else 0.0

        original_risk_level = ComplianceRiskEngine.get_risk_level(current_risk)
        projected_risk_level = ComplianceRiskEngine.get_risk_level(estimated_risk)
        delta_score = round(max(0.0, estimated_score - current_score), 1)
        delta_risk = round(max(0.0, current_risk - estimated_risk), 1)

        # Audit event
        audit_service.log_event(
            db=db,
            user_id=user_id,
            action="WHAT_IF_ANALYSIS_RUN",
            entity_type="ComplianceReport",
            entity_id=report.id,
            description=(
                f"What-If scenario simulated for report #{report.id}: "
                f"{len(resolved_set)} gaps resolved. Projected score {current_score}% -> {estimated_score}%, "
                f"risk {current_risk} -> {estimated_risk}."
            ),
            metadata={
                "report_id": report.id,
                "resolved_count": len(resolved_set),
                "current_score": current_score,
                "estimated_score": estimated_score,
                "current_risk": current_risk,
                "estimated_risk": estimated_risk,
            },
        )

        return WhatIfResponse(
            compliance_report_id=report.id,
            report_id=report.id,
            original_score=current_score,
            current_score=current_score,
            projected_score=estimated_score,
            estimated_score=estimated_score,
            projected_score_delta=delta_score,
            potential_score_improvement=delta_score,
            original_risk_score=current_risk,
            current_risk=current_risk,
            original_risk_level=original_risk_level,
            projected_risk_score=estimated_risk,
            estimated_risk=estimated_risk,
            projected_risk_level=projected_risk_level,
            projected_risk_delta=delta_risk,
            potential_risk_reduction=delta_risk,
            simulated_resolved_count=len(resolved_set),
            resolved_count=len(resolved_set),
            remaining_gaps=remaining_gaps,
        )

    # Alias for developer ergonomics
    simulate_what_if = simulate_resolved_gaps

