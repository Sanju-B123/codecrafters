"""
BharatStandards AI - Service Recommendation Engine
Deterministic recommendation engine mapping Product specifications, Indian Standards,
and Compliance Readiness gaps to actionable BIS services and procedural guidance.
"""
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.bis_service import (
    BISService,
    ServiceCategory,
    ServiceStatus,
    ServiceUserType,
    ServiceActionType,
)
from app.models.product import Product
from app.models.compliance import ComplianceReport, ComplianceStatus, GapPriority
from app.models.user import User
from app.schemas.bis_service import (
    ActionItem,
    BISServiceResponse,
    ServiceRecommendationResponse,
    ComplianceNextStepsResponse,
    ServiceListResponse,
)


class ServiceRecommendationService:
    """
    Deterministic guidance and recommendation engine.
    Applies explainable, rule-based matching based on product classification,
    regulatory standards, and verified gap severities.
    """

    @staticmethod
    def get_services(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        user_type: Optional[str] = None,
        service_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> ServiceListResponse:
        """
        List and filter BIS Services catalogue with pagination.
        """
        query = db.query(BISService)

        if search:
            search_clean = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    BISService.name.ilike(search_clean),
                    BISService.description.ilike(search_clean),
                    BISService.service_code.ilike(search_clean),
                    BISService.eligibility.ilike(search_clean),
                )
            )

        if category and category.upper() != "ALL":
            query = query.filter(BISService.category == category.upper())

        if user_type and user_type.upper() != "ALL":
            ut = user_type.upper()
            if ut in [ServiceUserType.INDUSTRY.value, ServiceUserType.CONSUMER.value]:
                # BOTH applies to both Industry and Consumer
                query = query.filter(
                    or_(BISService.user_type == ut, BISService.user_type == ServiceUserType.BOTH.value)
                )

        if service_status and service_status.upper() != "ALL":
            query = query.filter(BISService.status == service_status.upper())

        total = query.count()
        pages = (total + page_size - 1) // page_size if total > 0 else 1
        items = (
            query.order_by(BISService.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return ServiceListResponse(
            items=[BISServiceResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    def get_service_by_id(db: Session, service_id: int) -> BISServiceResponse:
        """
        Retrieve a single BIS service record by ID.
        """
        service = db.query(BISService).filter(BISService.id == service_id).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BIS Service with ID {service_id} not found.",
            )
        return BISServiceResponse.model_validate(service)

    @staticmethod
    def get_recommendations_for_user(
        db: Session,
        user: User,
        limit: int = 5,
    ) -> List[ServiceRecommendationResponse]:
        """
        Role-aware general recommendations.
        For consumers: prioritize consumer authentication & safety verification guidance.
        For industry: prioritize Scheme-I ISI certification and testing guidance.
        """
        role = (user.role or "industry").lower()
        recommendations = []

        if role == "consumer":
            consumer_services = (
                db.query(BISService)
                .filter(
                    or_(
                        BISService.user_type == ServiceUserType.CONSUMER.value,
                        BISService.user_type == ServiceUserType.BOTH.value,
                    )
                )
                .limit(limit)
                .all()
            )
            for svc in consumer_services:
                recommendations.append(
                    ServiceRecommendationResponse(
                        service=BISServiceResponse.model_validate(svc),
                        match_reason="Recommended for consumer product safety verification and mark authenticity checking.",
                        priority="INFORMATIONAL",
                        suggested_actions=[
                            ActionItem(
                                action_type=ServiceActionType.VIEW_SERVICE.value,
                                label="View Consumer Guide",
                                target=f"/services/{svc.id}",
                                description="Learn how to inspect rating plates and verify authentic certification marks.",
                                priority="LOW",
                            )
                        ],
                        is_demo=svc.is_demo,
                    )
                )
        else:
            # Industry user
            industry_services = (
                db.query(BISService)
                .filter(
                    or_(
                        BISService.user_type == ServiceUserType.INDUSTRY.value,
                        BISService.user_type == ServiceUserType.BOTH.value,
                    )
                )
                .limit(limit)
                .all()
            )
            for svc in industry_services:
                priority = "HIGH" if svc.category in [ServiceCategory.CERTIFICATION.value, ServiceCategory.TESTING.value] else "MEDIUM"
                recommendations.append(
                    ServiceRecommendationResponse(
                        service=BISServiceResponse.model_validate(svc),
                        match_reason=f"Recommended for {svc.category.lower().replace('_', ' ')} preparation and standard conformity.",
                        priority=priority,
                        suggested_actions=[
                            ActionItem(
                                action_type=ServiceActionType.VIEW_SERVICE.value,
                                label="View Guidance Roadmap",
                                target=f"/services/{svc.id}",
                                description="Review prerequisite documents, testing milestones, and typical steps.",
                                priority=priority,
                            )
                        ],
                        is_demo=svc.is_demo,
                    )
                )

        return recommendations

    @staticmethod
    def get_recommendations_for_product(
        db: Session,
        user: User,
        product_id: int,
    ) -> List[ServiceRecommendationResponse]:
        """
        Product-aware service recommendations.
        Verifies product ownership strictly. Correlates product category and latest audit results.
        """
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found.",
            )

        # Strict multi-tenant isolation
        if product.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view recommendations for this product.",
            )

        # Retrieve latest completed compliance report if one exists
        latest_report = (
            db.query(ComplianceReport)
            .filter(ComplianceReport.product_id == product_id, ComplianceReport.user_id == user.id)
            .order_by(ComplianceReport.created_at.desc())
            .first()
        )

        recommendations = []
        product_category = (product.category or "").lower()
        has_critical_gaps = latest_report and (latest_report.missing_count > 0 or latest_report.partial_count > 0)

        # 1. If compliance audit has open gaps, NABL Testing guidance is highest priority
        if has_critical_gaps:
            testing_svc = db.query(BISService).filter(BISService.service_code == "DEMO-SERVICE-003").first()
            if testing_svc:
                recommendations.append(
                    ServiceRecommendationResponse(
                        service=BISServiceResponse.model_validate(testing_svc),
                        match_reason=(
                            f"Audit identified {latest_report.missing_count} missing and "
                            f"{latest_report.partial_count} partial requirement(s). "
                            "Laboratory testing is required to generate verifiable test evidence."
                        ),
                        priority="CRITICAL" if latest_report.missing_count > 0 else "HIGH",
                        suggested_actions=[
                            ActionItem(
                                action_type=ServiceActionType.FIX_GAP.value,
                                label="Review Audit Gaps",
                                target=f"/compliance/{latest_report.id}",
                                description="Inspect missing clauses in the compliance gap register.",
                                priority="CRITICAL",
                            ),
                            ActionItem(
                                action_type=ServiceActionType.UPLOAD_DOCUMENT.value,
                                label="Upload Lab Evidence",
                                target="/documents",
                                description="Upload accredited test reports to close open gaps.",
                                priority="HIGH",
                            ),
                        ],
                        is_demo=testing_svc.is_demo,
                    )
                )

        # 2. Category-based certification scheme guidance
        if any(term in product_category for term in ["water heater", "appliance", "electrical"]):
            scheme1_svc = db.query(BISService).filter(BISService.service_code == "DEMO-SERVICE-001").first()
            if scheme1_svc:
                recommendations.append(
                    ServiceRecommendationResponse(
                        service=BISServiceResponse.model_validate(scheme1_svc),
                        match_reason="Domestic electrical storage water heaters are governed by mandatory BIS Scheme-I (ISI Mark) conformity.",
                        priority="HIGH",
                        suggested_actions=[
                            ActionItem(
                                action_type=ServiceActionType.VIEW_SERVICE.value,
                                label="View Scheme-I Roadmap",
                                target=f"/services/{scheme1_svc.id}",
                                description="Review factory quality assurance and licensing requirements.",
                                priority="HIGH",
                            ),
                            ActionItem(
                                action_type=ServiceActionType.RUN_COMPLIANCE_CHECK.value,
                                label="Run Compliance Assessment",
                                target="/compliance",
                                description="Audit technical documentation against DEMO-IS-001 requirements.",
                                priority="MEDIUM",
                            ),
                        ],
                        is_demo=scheme1_svc.is_demo,
                    )
                )
        elif any(term in product_category for term in ["electronic", "it", "computer", "display", "audio"]):
            crs_svc = db.query(BISService).filter(BISService.service_code == "DEMO-SERVICE-002").first()
            if crs_svc:
                recommendations.append(
                    ServiceRecommendationResponse(
                        service=BISServiceResponse.model_validate(crs_svc),
                        match_reason="Electronics and IT equipment fall under the Compulsory Registration Scheme (CRS).",
                        priority="HIGH",
                        suggested_actions=[
                            ActionItem(
                                action_type=ServiceActionType.VIEW_SERVICE.value,
                                label="View CRS Registration Guide",
                                target=f"/services/{crs_svc.id}",
                                description="Explore self-declaration and safety testing workflow.",
                                priority="HIGH",
                            )
                        ],
                        is_demo=crs_svc.is_demo,
                    )
                )
        else:
            # General fallback: Scheme-I and Testing
            general_services = db.query(BISService).filter(BISService.user_type != ServiceUserType.CONSUMER.value).limit(2).all()
            for s in general_services:
                recommendations.append(
                    ServiceRecommendationResponse(
                        service=BISServiceResponse.model_validate(s),
                        match_reason=f"Recommended guidance for {product.name}.",
                        priority="MEDIUM",
                        suggested_actions=[
                            ActionItem(
                                action_type=ServiceActionType.VIEW_SERVICE.value,
                                label="View Guidance",
                                target=f"/services/{s.id}",
                                description="Explore conformity procedures.",
                                priority="MEDIUM",
                            )
                        ],
                        is_demo=s.is_demo,
                    )
                )

        return recommendations

    @staticmethod
    def get_recommendations_for_compliance_report(
        db: Session,
        user: User,
        report_id: int,
    ) -> ComplianceNextStepsResponse:
        """
        Compliance-gap driven next steps and relevant BIS services.
        Strictly verifies compliance report ownership.
        Returns prioritized actions:
        1. Resolve missing evidence (critical clauses)
        2. Review partial requirements (component certificates / calibrations)
        3. Consult relevant official guidance (Scheme-I certification roadmap)
        """
        report = db.query(ComplianceReport).filter(ComplianceReport.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compliance Report with ID {report_id} not found.",
            )

        # Strict multi-tenant isolation
        if report.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view recommendations for this compliance report.",
            )

        product = report.product
        prioritized_actions: List[ActionItem] = []

        # 1. Resolve missing evidence
        if report.missing_count > 0:
            missing_clauses = [
                f"Clause {g.requirement.clause}"
                for g in report.gaps
                if g.priority == GapPriority.CRITICAL.value and g.requirement
            ][:2]
            clause_str = ", ".join(missing_clauses) if missing_clauses else "mandatory clauses"
            prioritized_actions.append(
                ActionItem(
                    action_type=ServiceActionType.UPLOAD_DOCUMENT.value,
                    label="Resolve Missing Evidence",
                    target="/documents",
                    description=f"Upload accredited test reports or burst test proof for {clause_str}.",
                    priority="CRITICAL",
                )
            )

        # 2. Review partial requirements
        if report.partial_count > 0:
            prioritized_actions.append(
                ActionItem(
                    action_type=ServiceActionType.FIX_GAP.value,
                    label="Review Partial Requirements",
                    target=f"/compliance/{report.id}",
                    description="Upload component safety compliance certificates and calibration records to achieve full PASS status.",
                    priority="HIGH",
                )
            )

        # 3. Consult relevant official guidance
        prioritized_actions.append(
            ActionItem(
                action_type=ServiceActionType.VIEW_SERVICE.value,
                label="Consult Relevant Official Guidance",
                target="/services",
                description="Review statutory Scheme-I ISI mark requirements and factory inspection protocols.",
                priority="MEDIUM",
            )
        )

        # Fetch relevant services
        service_recommendations = ServiceRecommendationService.get_recommendations_for_product(
            db=db,
            user=user,
            product_id=report.product_id,
        )

        return ComplianceNextStepsResponse(
            report_id=report.id,
            product_id=report.product_id,
            product_name=product.name if product else "Product",
            readiness_score=report.score,
            status=report.status,
            prioritized_actions=prioritized_actions,
            recommended_services=service_recommendations,
            summary=(
                f"Product readiness is {report.score}%. "
                f"Closing {report.missing_count} missing requirement(s) and {report.partial_count} partial requirement(s) "
                "is recommended before formal BIS licensing submission."
            ),
        )
