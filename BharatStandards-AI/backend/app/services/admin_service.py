"""
BharatStandards AI - Admin Management Service
Provides system analytics, real dashboard statistics, health diagnostics,
and administrative knowledge governance logic.
"""
from datetime import datetime, timezone, timedelta
import time
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User, UserRole, UserStatus
from app.models.product import Product
from app.models.standard import Standard, Requirement, StandardStatus
from app.models.document import Document
from app.models.compliance import ComplianceReport, Gap, GapPriority, ComplianceResult, ComplianceStatus
from app.models.bis_service import BISService
from app.models.audit_log import AuditLog
from app.models.knowledge import KnowledgeSource, KnowledgeIndex, KnowledgeIndexStatus
from app.models.assistant import AIQueryLog


class AdminService:
    @staticmethod
    def get_dashboard_metrics(db: Session) -> dict:
        """
        Calculates real aggregated platform counts and velocity metrics.
        Never returns synthetic placeholder numbers.
        """
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)

        # Totals
        total_users = db.query(User).count()
        total_admins = db.query(User).filter(User.role == UserRole.ADMIN.value).count()
        suspended_users = db.query(User).filter(User.status == UserStatus.SUSPENDED.value).count()

        total_products = db.query(Product).count()
        total_standards = db.query(Standard).count()
        archived_standards = (
            db.query(Standard)
            .filter(Standard.status == StandardStatus.ARCHIVED.value)
            .count()
        )
        total_requirements = db.query(Requirement).count()
        total_documents = db.query(Document).count()
        total_reports = db.query(ComplianceReport).count()
        total_services = db.query(BISService).count()
        total_audit_events = db.query(AuditLog).count()

        # Knowledge indexing stats
        indexed_items = (
            db.query(KnowledgeIndex)
            .filter(KnowledgeIndex.index_status == KnowledgeIndexStatus.INDEXED.value)
            .count()
        )
        unindexed_items = (
            db.query(KnowledgeIndex)
            .filter(KnowledgeIndex.index_status != KnowledgeIndexStatus.INDEXED.value)
            .count()
        )

        # Velocity metrics in last 7 days
        recent_users = db.query(User).filter(User.created_at >= seven_days_ago).count()
        recent_reports = db.query(ComplianceReport).filter(ComplianceReport.created_at >= seven_days_ago).count()
        recent_audits = db.query(AuditLog).filter(AuditLog.created_at >= seven_days_ago).count()

        # Top Standards (most commonly evaluated)
        top_standards_rows = (
            db.query(
                Standard.standard_number,
                Standard.title,
                func.count(ComplianceReport.id).label("report_count"),
            )
            .join(ComplianceReport, ComplianceReport.standard_id == Standard.id, isouter=True)
            .group_by(Standard.id, Standard.standard_number, Standard.title)
            .order_by(text("report_count DESC"))
            .limit(5)
            .all()
        )
        top_standards = [
            {"code": r[0], "title": r[1], "evaluations": r[2]}
            for r in top_standards_rows
        ]


        # Top Frequent Compliance Gaps
        top_gaps_rows = (
            db.query(
                Gap.description,
                Gap.priority,
                func.count(Gap.id).label("gap_count"),
            )
            .group_by(Gap.description, Gap.priority)
            .order_by(text("gap_count DESC"))
            .limit(5)
            .all()
        )
        top_gaps = [
            {"description": r[0], "priority": r[1], "count": r[2]}
            for r in top_gaps_rows
        ]

        # Daily activity velocity over last 7 days
        daily_velocity = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            day_events = (
                db.query(AuditLog)
                .filter(AuditLog.created_at >= day_start, AuditLog.created_at < day_end)
                .count()
            )
            day_reports = (
                db.query(ComplianceReport)
                .filter(ComplianceReport.created_at >= day_start, ComplianceReport.created_at < day_end)
                .count()
            )
            daily_velocity.append(
                {
                    "date": day_start.strftime("%Y-%m-%d"),
                    "label": day_start.strftime("%b %d"),
                    "events": day_events,
                    "reports": day_reports,
                }
            )

        # AI Telemetry and Analytics (Step 17 Requirement #48)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        ai_total_queries = db.query(AIQueryLog).count()
        ai_requests_today = db.query(AIQueryLog).filter(AIQueryLog.created_at >= today_start).count()
        avg_latency_val = db.query(func.avg(AIQueryLog.latency_ms)).filter(AIQueryLog.created_at >= today_start).scalar()
        avg_response_time_ms = round(float(avg_latency_val), 1) if avg_latency_val is not None else 0.0
        low_confidence_responses = db.query(AIQueryLog).filter(AIQueryLog.confidence == "LOW").count()
        retrieval_failures = db.query(AIQueryLog).filter(AIQueryLog.retrieval_count == 0).count()
        ai_errors = db.query(AIQueryLog).filter(AIQueryLog.is_error == True).count()

        # Compliance & Risk Analytics (Step 18 Requirement #11)
        avg_score_val = db.query(func.avg(ComplianceReport.score)).scalar()
        average_readiness_score = round(float(avg_score_val), 1) if avg_score_val is not None else 0.0

        avg_risk_val = db.query(func.avg(ComplianceReport.overall_risk_score)).filter(ComplianceReport.overall_risk_score.isnot(None)).scalar()
        average_risk_score = round(float(avg_risk_val), 1) if avg_risk_val is not None else 0.0

        crit_gaps = db.query(Gap).filter(Gap.priority == GapPriority.CRITICAL.value).count()
        high_gaps = db.query(Gap).filter(Gap.priority == GapPriority.HIGH.value).count()
        med_gaps = db.query(Gap).filter(Gap.priority == GapPriority.MEDIUM.value).count()
        low_gaps = db.query(Gap).filter(Gap.priority == GapPriority.LOW.value).count()

        # Most common failing categories
        failing_categories_rows = (
            db.query(
                Requirement.category,
                func.count(ComplianceResult.id).label("fail_count"),
            )
            .join(ComplianceResult, ComplianceResult.requirement_id == Requirement.id)
            .filter(ComplianceResult.status.in_([ComplianceStatus.MISSING.value, ComplianceStatus.PARTIAL.value]))
            .group_by(Requirement.category)
            .order_by(text("fail_count DESC"))
            .limit(5)
            .all()
        )
        common_failing_categories = [
            {"category": r[0] or "General", "failure_count": r[1]}
            for r in failing_categories_rows
        ]

        compliance_analytics = {
            "total_evaluations": total_reports,
            "average_readiness_score": average_readiness_score,
            "average_risk_score": average_risk_score,
            "critical_gaps_count": crit_gaps,
            "high_gaps_count": high_gaps,
            "medium_gaps_count": med_gaps,
            "low_gaps_count": low_gaps,
            "common_failing_categories": common_failing_categories,
        }

        return {
            "totals": {
                "users": total_users,
                "admins": total_admins,
                "suspended_users": suspended_users,
                "products": total_products,
                "standards": total_standards,
                "archived_standards": archived_standards,
                "requirements": total_requirements,
                "documents": total_documents,
                "reports": total_reports,
                "bis_services": total_services,
                "audit_events": total_audit_events,
                "indexed_items": indexed_items,
                "unindexed_items": unindexed_items,
            },
            "recent_7d": {
                "new_users": recent_users,
                "new_reports": recent_reports,
                "audit_events": recent_audits,
            },
            "ai_analytics": {
                "total_queries": ai_total_queries,
                "requests_today": ai_requests_today,
                "avg_response_time_ms": avg_response_time_ms,
                "low_confidence_responses": low_confidence_responses,
                "retrieval_failures": retrieval_failures,
                "ai_errors": ai_errors,
                "has_data": ai_total_queries > 0,
            },
            "compliance_analytics": compliance_analytics,
            "top_standards": top_standards,
            "top_gaps": top_gaps,
            "daily_velocity": daily_velocity,
        }

    @staticmethod
    def get_system_health(db: Session) -> dict:
        """
        Performs genuine operational diagnostics across platform subsystems.
        NEVER exposes secrets, environment tokens, or passwords.
        """
        # 1. Database Check
        db_start = time.time()
        try:
            db.execute(text("SELECT 1"))
            db_latency_ms = round((time.time() - db_start) * 1000, 2)
            db_status = "HEALTHY"
            db_details = f"Connection active. Query latency: {db_latency_ms}ms"
        except Exception as e:
            db_status = "UNAVAILABLE"
            db_latency_ms = -1
            db_details = f"Database probe failed: {str(e)[:100]}"

        # 2. API Gateway Check
        api_status = "HEALTHY"
        api_details = f"BharatStandards API runtime active (Env: {settings.APP_ENV})"

        # 3. Document Processing Pipeline Check
        try:
            import pypdf
            doc_status = "HEALTHY"
            doc_details = "PDF & text extraction engines online."
        except Exception:
            doc_status = "DEGRADED"
            doc_details = "PDF parsing modules operating in basic text mode."

        # 4. AI & Embedding Provider Status (Safe, masked)
        has_ai_key = bool(
            getattr(settings, "OPENAI_API_KEY", None)
            and not settings.OPENAI_API_KEY.startswith("mock")
        )
        ai_provider_status = "HEALTHY" if has_ai_key else "DEGRADED"
        ai_details = (
            f"Provider: OpenAI (model: {getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')})"
            if has_ai_key
            else "Provider operating with deterministic fallback mode (No API Key configured)"
        )

        embedding_provider_status = "HEALTHY" if has_ai_key else "DEGRADED"
        embedding_details = (
            "Semantic embedding engine online (text-embedding-3-small)"
            if has_ai_key
            else "Basic TF-IDF heuristic retrieval mode"
        )

        subsystems = {
            "database": {
                "status": db_status,
                "latency_ms": db_latency_ms,
                "details": db_details,
            },
            "api_gateway": {
                "status": api_status,
                "details": api_details,
            },
            "document_processing": {
                "status": doc_status,
                "details": doc_details,
            },
            "ai_reasoning_engine": {
                "status": ai_provider_status,
                "details": ai_details,
            },
            "vector_embedding_service": {
                "status": embedding_provider_status,
                "details": embedding_details,
            },
        }

        # 6. MongoDB Persistence Subsystem Check
        try:
            from app.core.mongodb import ping_mongodb
            mongo_ping = ping_mongodb()
            mongo_status = "HEALTHY" if mongo_ping.get("status") == "connected" else "DEGRADED"
            mongo_details = (
                f"Engine: {mongo_ping.get('mode')} | Collections: {mongo_ping.get('collections_count', 0)} "
                f"| Records: {mongo_ping.get('total_documents', 0)}"
            )
            mongo_latency = mongo_ping.get("latency_ms", 0.0)
        except Exception as me:
            mongo_status = "DEGRADED"
            mongo_details = f"MongoDB probe fallback: {str(me)[:100]}"
            mongo_latency = -1

        subsystems["mongodb"] = {
            "status": mongo_status,
            "latency_ms": mongo_latency,
            "details": mongo_details,
        }

        overall_status = "HEALTHY"
        if any(s["status"] == "UNAVAILABLE" for s in subsystems.values()):
            overall_status = "UNAVAILABLE"
        elif any(s["status"] == "DEGRADED" for s in subsystems.values()):
            overall_status = "DEGRADED"

        return {
            "overall_status": overall_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "subsystems": subsystems,
        }


admin_service = AdminService()
