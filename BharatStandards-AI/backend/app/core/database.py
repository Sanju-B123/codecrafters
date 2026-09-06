from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

_engine = None
_SessionFactory = None


def get_engine():
    global _engine
    if _engine is None:
        try:
            connect_args = {}
            kwargs = {}
            if settings.DATABASE_URL.startswith("sqlite"):
                connect_args = {"check_same_thread": False}
            else:
                kwargs = {
                    "pool_pre_ping": True,
                    "pool_size": 10,
                    "max_overflow": 20,
                }
            _engine = create_engine(
                settings.DATABASE_URL,
                connect_args=connect_args,
                **kwargs
            )
        except Exception as e:
            logger.warning(f"Database engine initialization deferred: {e}")
            return None
    return _engine


def init_db():
    """
    Initialize database tables defined in Base metadata, run sqlite column migrations,
    and seed initial standards, services, default admin, and default knowledge sources.
    """
    engine = get_engine()
    if engine is not None:
        Base.metadata.create_all(bind=engine)
        # Auto-migrate columns if upgrading an existing SQLite database
        try:
            with engine.connect() as conn:
                for alter_stmt in [
                    "ALTER TABLE requirements ADD COLUMN weight FLOAT DEFAULT 2.0;",
                    "ALTER TABLE requirements ADD COLUMN priority VARCHAR(50) DEFAULT 'HIGH';",
                    "ALTER TABLE requirements ADD COLUMN evidence_types JSON;",
                    "ALTER TABLE requirements ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';",
                    "ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';",
                    "ALTER TABLE knowledge_sources ADD COLUMN verification_method VARCHAR(255);",
                    "ALTER TABLE knowledge_sources ADD COLUMN verification_status VARCHAR(50) DEFAULT 'UNVERIFIED';",
                    "ALTER TABLE knowledge_sources ADD COLUMN last_checked_at TIMESTAMP;",
                    "ALTER TABLE compliance_reports ADD COLUMN standard_version VARCHAR(50);",
                    "ALTER TABLE compliance_reports ADD COLUMN overall_risk_score FLOAT;",
                    "ALTER TABLE compliance_reports ADD COLUMN risk_level VARCHAR(50);",
                    "ALTER TABLE assistant_sources ADD COLUMN provenance_type VARCHAR(50);",
                    "ALTER TABLE assistant_sources ADD COLUMN verification_status VARCHAR(50);",
                    "ALTER TABLE assistant_sources ADD COLUMN authority_level VARCHAR(50);",
                    "ALTER TABLE assistant_sources ADD COLUMN version VARCHAR(50);",
                    "ALTER TABLE assistant_sources ADD COLUMN source_provenance VARCHAR(100);",
                ]:

                    try:
                        conn.execute(text(alter_stmt))
                        conn.commit()
                    except Exception:
                        pass
        except Exception:
            pass
        logger.info("Database tables initialized successfully.")
        try:
            from app.services.standards_seed import seed_standards_knowledge_base
            from app.services.services_seed import seed_bis_services
            from app.services.admin_seed import seed_admin_and_knowledge
            from app.services.demo_seed import seed_demo_dataset
            factory = get_session_factory()
            if factory:
                with factory() as db:
                    seed_standards_knowledge_base(db)
                    seed_bis_services(db)
                    seed_admin_and_knowledge(db)
                    seed_demo_dataset(db)
        except Exception as e:
            logger.warning(f"Knowledge base and admin seeding failed or skipped: {e}")





def get_session_factory():
    global _SessionFactory
    if _SessionFactory is None:
        engine = get_engine()
        if engine:
            _SessionFactory = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=engine,
            )
    return _SessionFactory


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    Safe: raises HTTP 503 Service Unavailable if database is unreachable.
    """
    factory = get_session_factory()
    if factory is None:
        logger.error("Database connection is not configured or engine failed to start.")
        raise RuntimeError("Database service is currently unreachable.")

    db: Session = factory()
    try:
        yield db
    finally:
        db.close()
