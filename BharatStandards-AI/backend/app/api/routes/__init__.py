"""
BharatStandards AI - API Route Registration
Consolidates all domain routers into the primary api_router.
"""
from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.products import router as products_router
from app.api.routes.standards import router as standards_router, requirements_router
from app.api.routes.documents import router as documents_router
from app.api.routes.compliance import router as compliance_router
from app.api.routes.assistant import router as assistant_router
from app.api.routes.services import router as services_router
from app.api.routes.reports import router as reports_router
from app.api.routes.activity import router as activity_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.admin import router as admin_router
from app.api.routes.knowledge_admin import router as knowledge_admin_router
from app.api.routes.ai import router as ai_router
from app.api.routes.search import router as search_router

api_router = APIRouter()

# Register core routes
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(products_router)
api_router.include_router(standards_router)
api_router.include_router(requirements_router)
api_router.include_router(documents_router)
api_router.include_router(compliance_router)
api_router.include_router(assistant_router)
api_router.include_router(ai_router)
api_router.include_router(services_router)
api_router.include_router(reports_router)
api_router.include_router(activity_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(knowledge_admin_router)
api_router.include_router(search_router)

__all__ = ["api_router"]

