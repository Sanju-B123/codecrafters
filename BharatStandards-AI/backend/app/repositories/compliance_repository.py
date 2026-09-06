"""
BharatStandards AI - Compliance Repository
Handles database persistence and user-isolated retrieval for Compliance Reports,
Clause Results, and Gap Analysis items.
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.compliance import ComplianceReport, ComplianceResult, Gap


class ComplianceRepository:
    """
    Data access layer for Compliance Reports with strict tenant/user ownership enforcement.
    """

    @staticmethod
    def create_report(
        report: ComplianceReport,
        results: List[ComplianceResult],
        gaps: List[Gap],
        db: Session,
    ) -> ComplianceReport:
        """
        Atomically persist a compliance report along with its results and gap items.
        """
        db.add(report)
        db.flush()

        for res in results:
            res.report_id = report.id
            db.add(res)

        for gap in gaps:
            gap.report_id = report.id
            db.add(gap)

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_report(report_id: int, user_id: int, db: Session) -> Optional[ComplianceReport]:
        """
        Retrieve a single report ensuring the authenticated user owns it.
        Eagerly loads product and standard metadata.
        """
        return (
            db.query(ComplianceReport)
            .options(
                joinedload(ComplianceReport.product),
                joinedload(ComplianceReport.standard),
            )
            .filter(
                ComplianceReport.id == report_id,
                ComplianceReport.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def get_results(report_id: int, user_id: int, db: Session) -> List[ComplianceResult]:
        """
        Retrieve all requirement result items for a report, validating report ownership.
        """
        report = ComplianceRepository.get_report(report_id, user_id, db)
        if not report:
            return []

        return (
            db.query(ComplianceResult)
            .options(joinedload(ComplianceResult.requirement))
            .filter(ComplianceResult.report_id == report_id)
            .order_by(ComplianceResult.id.asc())
            .all()
        )

    @staticmethod
    def get_gaps(report_id: int, user_id: int, db: Session) -> List[Gap]:
        """
        Retrieve all gaps identified in a report, validating report ownership.
        """
        report = ComplianceRepository.get_report(report_id, user_id, db)
        if not report:
            return []

        return (
            db.query(Gap)
            .options(joinedload(Gap.requirement))
            .filter(Gap.report_id == report_id)
            .order_by(Gap.id.asc())
            .all()
        )

    @staticmethod
    def get_latest_report(
        product_id: int,
        user_id: int,
        db: Session,
        standard_id: Optional[int] = None,
    ) -> Optional[ComplianceReport]:
        """
        Fetch the most recent completed compliance report for a specific product.
        """
        query = (
            db.query(ComplianceReport)
            .options(
                joinedload(ComplianceReport.product),
                joinedload(ComplianceReport.standard),
            )
            .filter(
                ComplianceReport.product_id == product_id,
                ComplianceReport.user_id == user_id,
            )
        )
        if standard_id:
            query = query.filter(ComplianceReport.standard_id == standard_id)

        return query.order_by(ComplianceReport.created_at.desc()).first()

    @staticmethod
    def get_report_history(
        user_id: int,
        db: Session,
        product_id: Optional[int] = None,
    ) -> List[ComplianceReport]:
        """
        Retrieve chronological compliance assessment history for the user.
        """
        query = (
            db.query(ComplianceReport)
            .options(
                joinedload(ComplianceReport.product),
                joinedload(ComplianceReport.standard),
            )
            .filter(ComplianceReport.user_id == user_id)
        )
        if product_id:
            query = query.filter(ComplianceReport.product_id == product_id)

        return query.order_by(ComplianceReport.created_at.desc()).all()
