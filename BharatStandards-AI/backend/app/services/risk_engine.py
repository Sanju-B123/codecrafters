"""
BharatStandards AI - Compliance Risk Engine
Transforms compliance assessment results into an explainable, transparent risk-prioritization system.
Calculates clause-level and product-level risk scores (0-100), factor contribution breakdowns,
top risks, and prioritized action plans based on potential risk reduction.
"""
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logging import logger
from app.models.compliance import (
    ComplianceReport,
    ComplianceResult,
    ComplianceRisk,
    ComplianceStatus,
    ConfidenceLevel,
    GapPriority,
    RiskFactor,
)
from app.models.standard import Requirement, RequirementPriority
from app.schemas.compliance import (
    ComplianceRiskItem,
    ProductRiskSummaryResponse,
    RiskActionPlanItem,
    RiskFactorDetail,
    TopRiskItem,
)
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service


class ComplianceRiskEngine:
    """
    Core engine for explainable compliance risk scoring and prioritization.
    """

    @classmethod
    def get_risk_level(cls, score: float) -> str:
        """
        Map a 0-100 risk score to an explainable risk level using configurable thresholds.
        0-20: LOW
        21-50: MEDIUM
        51-75: HIGH
        76-100: CRITICAL
        """
        if score >= settings.RISK_CRITICAL_THRESHOLD:
            return GapPriority.CRITICAL.value
        elif score >= settings.RISK_HIGH_THRESHOLD:
            return GapPriority.HIGH.value
        elif score >= settings.RISK_MEDIUM_THRESHOLD:
            return GapPriority.MEDIUM.value
        return GapPriority.LOW.value

    @classmethod
    def calculate_clause_risk(
        cls,
        result: ComplianceResult,
        requirement: Requirement,
    ) -> Tuple[float, str, List[RiskFactorDetail], List[str]]:
        """
        Compute an explainable 0-100 risk score for a single clause requirement.
        Returns:
            (risk_score, risk_level, factor_details, reasons_list)
        """
        # 1. Requirement Priority Factor (CRITICAL=100, HIGH=75, MEDIUM=50, LOW=25)
        raw_pri = (requirement.priority or "HIGH").upper()
        if raw_pri == RequirementPriority.CRITICAL.value:
            pri_value = 100.0
        elif raw_pri == RequirementPriority.HIGH.value:
            pri_value = 75.0
        elif raw_pri == RequirementPriority.MEDIUM.value:
            pri_value = 50.0
        else:
            pri_value = 25.0
        pri_contrib = round(pri_value * settings.WEIGHT_REQUIREMENT_PRIORITY, 2)

        # 2. Compliance Status Factor (MISSING=100, PARTIAL=50, PASS=0)
        status_str = (result.status or ComplianceStatus.MISSING.value).upper()
        if status_str == ComplianceStatus.PASS.value:
            stat_value = 0.0
        elif status_str == ComplianceStatus.PARTIAL.value:
            stat_value = 50.0
        else:
            stat_value = 100.0
        stat_contrib = round(stat_value * settings.WEIGHT_COMPLIANCE_STATUS, 2)

        # 3. Evidence Availability Factor
        evidence_present = bool(result.evidence and result.evidence.strip() and result.evidence != "None")
        if status_str == ComplianceStatus.PASS.value:
            evi_value = 0.0
            evi_label = "Sufficient verified evidence"
        elif status_str == ComplianceStatus.PARTIAL.value:
            evi_value = 40.0 if evidence_present else 60.0
            evi_label = "Partial evidence documented" if evidence_present else "Incomplete supporting records"
        else:
            evi_value = 80.0 if evidence_present else 100.0
            evi_label = "Unverified/Non-conforming records" if evidence_present else "No supporting evidence found"
        evi_contrib = round(evi_value * settings.WEIGHT_EVIDENCE, 2)

        # 4. Evidence Confidence Factor
        conf_str = (result.confidence or ConfidenceLevel.HIGH.value).upper()
        if status_str == ComplianceStatus.PASS.value:
            if conf_str == ConfidenceLevel.HIGH.value:
                conf_value = 0.0
            elif conf_str == ConfidenceLevel.MEDIUM.value:
                conf_value = 15.0
            else:
                conf_value = 35.0
        elif status_str == ComplianceStatus.PARTIAL.value:
            if conf_str == ConfidenceLevel.HIGH.value:
                conf_value = 30.0
            elif conf_str == ConfidenceLevel.MEDIUM.value:
                conf_value = 55.0
            else:
                conf_value = 80.0
        else:
            if conf_str == ConfidenceLevel.HIGH.value:
                conf_value = 60.0
            elif conf_str == ConfidenceLevel.MEDIUM.value:
                conf_value = 80.0
            else:
                conf_value = 100.0  # High uncertainty on missing evidence increases review priority
        conf_contrib = round(conf_value * settings.WEIGHT_CONFIDENCE, 2)

        # Total score
        total_score = round(min(100.0, max(0.0, pri_contrib + stat_contrib + evi_contrib + conf_contrib)), 1)
        risk_level = cls.get_risk_level(total_score)

        factors = [
            RiskFactorDetail(
                factor_type="REQUIREMENT_PRIORITY",
                factor_value=raw_pri,
                weight=settings.WEIGHT_REQUIREMENT_PRIORITY,
                contribution=pri_contrib,
            ),
            RiskFactorDetail(
                factor_type="COMPLIANCE_STATUS",
                factor_value=status_str,
                weight=settings.WEIGHT_COMPLIANCE_STATUS,
                contribution=stat_contrib,
            ),
            RiskFactorDetail(
                factor_type="EVIDENCE_AVAILABILITY",
                factor_value=evi_label,
                weight=settings.WEIGHT_EVIDENCE,
                contribution=evi_contrib,
            ),
            RiskFactorDetail(
                factor_type="EVIDENCE_CONFIDENCE",
                factor_value=conf_str,
                weight=settings.WEIGHT_CONFIDENCE,
                contribution=conf_contrib,
            ),
        ]

        reasons = [
            f"Requirement priority: {raw_pri} (+{pri_contrib:.1f})",
            f"Status: {status_str} (+{stat_contrib:.1f})",
            f"Evidence: {evi_label} (+{evi_contrib:.1f})",
            f"Confidence: {conf_str} (+{conf_contrib:.1f})",
        ]

        return total_score, risk_level, factors, reasons

    @classmethod
    def calculate_risk(
        cls,
        compliance_report_id: int,
        db: Session,
        force_refresh: bool = False,
    ) -> ProductRiskSummaryResponse:
        """
        Execute or retrieve explainable risk assessment for a compliance report.
        Caches result in database. If force_refresh is True, recalculates all clauses.
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

        # Check Cache
        existing_risks = (
            db.query(ComplianceRisk)
            .filter(ComplianceRisk.compliance_report_id == compliance_report_id)
            .all()
        )
        if existing_risks and not force_refresh and report.overall_risk_score is not None:
            return cls._build_summary_from_cached(report, existing_risks, db)

        # Full Recalculation
        # 1. Clean existing records if any
        if existing_risks:
            for r in existing_risks:
                db.delete(r)
            db.flush()

        # 2. Load all clause evaluation results
        results = (
            db.query(ComplianceResult)
            .filter(ComplianceResult.report_id == compliance_report_id)
            .all()
        )
        if not results:
            empty_summary = ProductRiskSummaryResponse(
                product_id=report.product_id,
                compliance_report_id=report.id,
                overall_risk_score=0.0,
                risk_level=GapPriority.LOW.value,
                critical_count=0,
                high_count=0,
                medium_count=0,
                low_count=0,
                top_risks=[],
                recommended_actions=[],
                calculated_at=datetime.now(timezone.utc),
            )
            report.overall_risk_score = 0.0
            report.risk_level = GapPriority.LOW.value
            db.commit()
            return empty_summary

        total_weight = 0.0
        weighted_risk_sum = 0.0
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0

        created_risk_items: List[Dict[str, Any]] = []

        for res in results:
            req = res.requirement or db.query(Requirement).filter(Requirement.id == res.requirement_id).first()
            if not req:
                continue

            weight = req.weight or 2.0
            total_weight += weight

            risk_score, risk_level, factor_details, reasons = cls.calculate_clause_risk(res, req)
            weighted_risk_sum += risk_score * weight

            if res.status != ComplianceStatus.PASS.value:
                if risk_level == GapPriority.CRITICAL.value:
                    critical_count += 1
                elif risk_level == GapPriority.HIGH.value:
                    high_count += 1
                elif risk_level == GapPriority.MEDIUM.value:
                    medium_count += 1
                else:
                    low_count += 1

            # Persist ComplianceRisk
            risk_record = ComplianceRisk(
                compliance_report_id=report.id,
                requirement_id=req.id,
                risk_score=risk_score,
                risk_level=risk_level,
                status=res.status,
                reasons=json.dumps(reasons),
                calculated_at=datetime.now(timezone.utc),
            )
            db.add(risk_record)
            db.flush()

            # Persist RiskFactor details
            for f in factor_details:
                factor_record = RiskFactor(
                    risk_id=risk_record.id,
                    factor_type=f.factor_type,
                    factor_value=f.factor_value,
                    weight=f.weight,
                    contribution=f.contribution,
                )
                db.add(factor_record)

            created_risk_items.append({
                "record": risk_record,
                "requirement": req,
                "result": res,
                "score": risk_score,
                "level": risk_level,
                "factors": factor_details,
                "reasons": reasons,
                "weight": weight,
            })

        overall_risk_score = round(weighted_risk_sum / total_weight, 1) if total_weight > 0 else 0.0
        overall_risk_level = cls.get_risk_level(overall_risk_score)

        report.overall_risk_score = overall_risk_score
        report.risk_level = overall_risk_level
        report.updated_at = datetime.now(timezone.utc)
        db.commit()

        # Build Top Risks (Top 5 non-pass items ordered by score desc, weight desc)
        non_pass_items = [item for item in created_risk_items if item["result"].status != ComplianceStatus.PASS.value]
        non_pass_items.sort(key=lambda x: (x["score"], x["weight"]), reverse=True)

        top_risks: List[TopRiskItem] = []
        for it in non_pass_items[:5]:
            req = it["requirement"]
            top_risks.append(
                TopRiskItem(
                    requirement_id=req.id,
                    clause=req.clause,
                    title=req.title,
                    risk_score=it["score"],
                    risk_level=it["level"],
                    status=it["result"].status,
                    reason=it["reasons"][0] if it["reasons"] else "Requires verification evidence",
                    recommended_action=it["result"].recommended_action or f"Upload test evidence for Clause {req.clause}",
                    factors=it["factors"],
                )
            )

        # Build Prioritized Action Plan
        action_plan: List[RiskActionPlanItem] = []
        for it in non_pass_items:
            req = it["requirement"]
            pot_reduction = round((it["score"] * it["weight"]) / total_weight, 1) if total_weight > 0 else 0.0
            action_plan.append(
                RiskActionPlanItem(
                    action=it["result"].recommended_action or f"Resolve Clause {req.clause} ({req.title}) documentation",
                    priority=it["level"],
                    related_requirement_id=req.id,
                    clause=req.clause,
                    risk_reduction_potential=pot_reduction,
                    reason=f"Clause {req.clause} is marked {it['result'].status} with {it['level']} risk level.",
                )
            )

        # Sort Action Plan: CRITICAL -> HIGH -> MEDIUM -> LOW, then highest reduction first
        priority_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        action_plan.sort(key=lambda x: (priority_rank.get(x.priority, 4), -x.risk_reduction_potential))

        # Notification check: Alert if high or critical risks exist without duplicate spam
        if critical_count > 0 or high_count > 0:
            cls._send_risk_notification_if_needed(report, critical_count, high_count, db)

        # Audit logging
        action_name = "RISK_RECALCULATED" if force_refresh else "RISK_CALCULATED"
        audit_service.log_event(
            db=db,
            user_id=report.user_id,
            action=action_name,
            entity_type="ComplianceReport",
            entity_id=report.id,
            description=f"Risk assessment {action_name.lower()} for report #{report.id}: Score {overall_risk_score} ({overall_risk_level})",
            metadata={
                "report_id": report.id,
                "product_id": report.product_id,
                "overall_risk_score": overall_risk_score,
                "risk_level": overall_risk_level,
                "critical_count": critical_count,
                "high_count": high_count,
            },
        )

        return ProductRiskSummaryResponse(
            product_id=report.product_id,
            compliance_report_id=report.id,
            overall_risk_score=overall_risk_score,
            risk_level=overall_risk_level,
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            top_risks=top_risks,
            recommended_actions=action_plan,
            calculated_at=datetime.now(timezone.utc),
        )

    @classmethod
    def _build_summary_from_cached(
        cls,
        report: ComplianceReport,
        risks: List[ComplianceRisk],
        db: Session,
    ) -> ProductRiskSummaryResponse:
        """
        Reconstruct summary from existing cached database risk records.
        """
        results = {res.requirement_id: res for res in report.results}
        total_weight = sum(res.weight or 2.0 for res in report.results) or 1.0

        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0

        risk_data_items: List[Dict[str, Any]] = []

        for r in risks:
            req = r.requirement or db.query(Requirement).filter(Requirement.id == r.requirement_id).first()
            res = results.get(r.requirement_id)
            if not req or not res:
                continue

            if r.status != ComplianceStatus.PASS.value:
                if r.risk_level == GapPriority.CRITICAL.value:
                    critical_count += 1
                elif r.risk_level == GapPriority.HIGH.value:
                    high_count += 1
                elif r.risk_level == GapPriority.MEDIUM.value:
                    medium_count += 1
                else:
                    low_count += 1

            factor_details = [
                RiskFactorDetail(
                    factor_type=f.factor_type,
                    factor_value=f.factor_value,
                    weight=f.weight,
                    contribution=f.contribution,
                )
                for f in r.factors
            ]
            reasons = json.loads(r.reasons) if r.reasons else []

            risk_data_items.append({
                "record": r,
                "requirement": req,
                "result": res,
                "score": r.risk_score,
                "level": r.risk_level,
                "factors": factor_details,
                "reasons": reasons,
                "weight": res.weight or 2.0,
            })

        non_pass_items = [it for it in risk_data_items if it["result"].status != ComplianceStatus.PASS.value]
        non_pass_items.sort(key=lambda x: (x["score"], x["weight"]), reverse=True)

        top_risks: List[TopRiskItem] = []
        for it in non_pass_items[:5]:
            req = it["requirement"]
            top_risks.append(
                TopRiskItem(
                    requirement_id=req.id,
                    clause=req.clause,
                    title=req.title,
                    risk_score=it["score"],
                    risk_level=it["level"],
                    status=it["result"].status,
                    reason=it["reasons"][0] if it["reasons"] else "Requires verification evidence",
                    recommended_action=it["result"].recommended_action or f"Upload test evidence for Clause {req.clause}",
                    factors=it["factors"],
                )
            )

        action_plan: List[RiskActionPlanItem] = []
        for it in non_pass_items:
            req = it["requirement"]
            pot_reduction = round((it["score"] * it["weight"]) / total_weight, 1) if total_weight > 0 else 0.0
            action_plan.append(
                RiskActionPlanItem(
                    action=it["result"].recommended_action or f"Resolve Clause {req.clause} ({req.title}) documentation",
                    priority=it["level"],
                    related_requirement_id=req.id,
                    clause=req.clause,
                    risk_reduction_potential=pot_reduction,
                    reason=f"Clause {req.clause} is marked {it['result'].status} with {it['level']} risk level.",
                )
            )

        priority_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        action_plan.sort(key=lambda x: (priority_rank.get(x.priority, 4), -x.risk_reduction_potential))

        return ProductRiskSummaryResponse(
            product_id=report.product_id,
            compliance_report_id=report.id,
            overall_risk_score=report.overall_risk_score or 0.0,
            risk_level=report.risk_level or GapPriority.LOW.value,
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            top_risks=top_risks,
            recommended_actions=action_plan,
            calculated_at=risks[0].calculated_at if risks else datetime.now(timezone.utc),
        )

    @classmethod
    def get_clause_risks(
        cls,
        compliance_report_id: int,
        db: Session,
    ) -> List[ComplianceRiskItem]:
        """
        List all clause-level risk items for a compliance report.
        """
        # Ensure calculated
        cls.calculate_risk(compliance_report_id, db, force_refresh=False)

        risks = (
            db.query(ComplianceRisk)
            .filter(ComplianceRisk.compliance_report_id == compliance_report_id)
            .all()
        )
        report = db.query(ComplianceReport).filter(ComplianceReport.id == compliance_report_id).first()
        total_weight = sum(res.weight or 2.0 for res in report.results) if report else 1.0

        items: List[ComplianceRiskItem] = []
        for r in risks:
            req = r.requirement or db.query(Requirement).filter(Requirement.id == r.requirement_id).first()
            if not req:
                continue
            weight = req.weight or 2.0
            pot_reduction = round((r.risk_score * weight) / total_weight, 1) if total_weight > 0 else 0.0

            factors = [
                RiskFactorDetail(
                    factor_type=f.factor_type,
                    factor_value=f.factor_value,
                    weight=f.weight,
                    contribution=f.contribution,
                )
                for f in r.factors
            ]
            reasons = json.loads(r.reasons) if r.reasons else []

            res = next((res for res in report.results if res.requirement_id == r.requirement_id), None)
            rec_action = res.recommended_action if res else f"Verify compliance for Clause {req.clause}"

            items.append(
                ComplianceRiskItem(
                    id=r.id,
                    requirement_id=req.id,
                    clause=req.clause,
                    title=req.title,
                    risk_score=r.risk_score,
                    risk_level=r.risk_level,
                    status=r.status,
                    reasons=reasons,
                    factors=factors,
                    recommended_action=rec_action,
                    potential_risk_reduction=pot_reduction,
                )
            )

        items.sort(key=lambda x: x.risk_score, reverse=True)
        return items

    @classmethod
    def get_requirement_risk(
        cls,
        db: Session,
        requirement_id: int,
        product_id: int,
        user: Any,
    ) -> ComplianceRiskItem:
        """
        Retrieve clause-level risk assessment for a specific requirement and product.
        """
        from app.models.product import Product

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product #{product_id} not found",
            )
        if getattr(user, "role", None) != "admin" and product.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this product's compliance risk data",
            )

        req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement #{requirement_id} not found",
            )

        report = (
            db.query(ComplianceReport)
            .filter(ComplianceReport.product_id == product_id)
            .order_by(ComplianceReport.id.desc())
            .first()
        )
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No compliance report found for this product. Please run a compliance assessment first.",
            )

        # Ensure risk is calculated
        cls.calculate_risk(report.id, db, force_refresh=False)

        risk = (
            db.query(ComplianceRisk)
            .filter(
                ComplianceRisk.compliance_report_id == report.id,
                ComplianceRisk.requirement_id == requirement_id,
            )
            .first()
        )
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Risk assessment not found for Clause {req.clause} in latest report",
            )

        total_weight = sum(res.weight or 2.0 for res in report.results) if report.results else 1.0
        weight = req.weight or 2.0
        pot_reduction = round((risk.risk_score * weight) / total_weight, 1) if total_weight > 0 else 0.0

        factors = [
            RiskFactorDetail(
                factor_type=f.factor_type,
                factor_value=f.factor_value,
                weight=f.weight,
                contribution=f.contribution,
            )
            for f in risk.factors
        ]
        reasons = json.loads(risk.reasons) if risk.reasons else []
        res = next((res for res in report.results if res.requirement_id == req.id), None)
        rec_action = res.recommended_action if res else f"Verify compliance for Clause {req.clause}"

        return ComplianceRiskItem(
            id=risk.id,
            requirement_id=req.id,
            clause=req.clause,
            title=req.title,
            risk_score=risk.risk_score,
            risk_level=risk.risk_level,
            status=risk.status,
            reasons=reasons,
            factors=factors,
            recommended_action=rec_action,
            potential_risk_reduction=pot_reduction,
        )

    @classmethod
    def _send_risk_notification_if_needed(
        cls,
        report: ComplianceReport,
        critical_count: int,
        high_count: int,
        db: Session,
    ) -> None:
        """
        Send a notification to the product owner when critical or high risks are detected.
        Avoids spamming by checking for existing unread notifications for this report.
        """
        from app.models.notification import Notification

        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == report.user_id,
                Notification.entity_type == "ComplianceReport",
                Notification.entity_id == report.id,
                Notification.is_read == False,
            )
            .first()
        )
        if existing:
            return

        msg = (
            f"Your compliance assessment contains high-priority gaps: "
            f"{critical_count} critical and {high_count} high risk issues require attention."
        )
        notification_service.create_notification(
            db=db,
            user_id=report.user_id,
            title="High Priority Compliance Risks Detected",
            message=msg,
            type="WARNING",
            entity_type="ComplianceReport",
            entity_id=report.id,
        )
