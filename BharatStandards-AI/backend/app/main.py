from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.routes import api_router
from app.api.routes.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    """
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")
    logger.info(f"Configured CORS origins: {settings.CORS_ORIGINS}")
    try:
        from app.core.database import init_db
        import app.models  # Ensure all SQLAlchemy models are registered
        init_db()

        # Initialize MongoDB persistence layer and real-time sync listeners
        from app.core.mongodb import init_mongodb, close_mongo_client
        from app.core.mongo_sync import register_mongo_sync_listeners
        from app.services.mongodb_sync import sync_all_sql_to_mongo

        init_mongodb()
        register_mongo_sync_listeners()
        sync_all_sql_to_mongo()
    except Exception as e:
        logger.warning(f"Database initialization deferred or failed: {e}")
    yield

    logger.info(f"Shutting down {settings.APP_NAME}...")
    try:
        from app.core.mongodb import close_mongo_client
        close_mongo_client()
    except Exception:
        pass


def create_application() -> FastAPI:
    """
    Application factory initializing FastAPI with middleware and routers.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        description="India's Intelligent Standards & BIS Compliance Copilot API",
        version="1.0.0",
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
        allow_origin_regex=r"https:\/\/.*\.netlify\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Enforce standard security response headers
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # Expose root /health endpoint per specification
    app.include_router(health_router)

    # Expose versioned API routes under API prefix (/api)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_application()
