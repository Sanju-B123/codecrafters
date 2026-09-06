"""
BharatStandards AI - Admin and Knowledge Sources Seeding Service
Creates the initial administrative administrator and baseline knowledge sources.
"""
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile
from app.models.knowledge import (
    KnowledgeSource,
    KnowledgeSourceType,
    KnowledgeAuthorityLevel,
    KnowledgeIndex,
    KnowledgeIndexStatus,
)
from app.models.standard import Standard, Requirement
from app.services.audit_service import audit_service


def seed_admin_and_knowledge(db: Session) -> None:
    """
    Ensure at least one active administrator and baseline knowledge sources exist.
    """
    try:
        # 1. Seed Default Admin User if none exists
        admin_user = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if not admin_user:
            admin_email = "admin@bharatstandards.ai"
            existing_user = db.query(User).filter(User.email == admin_email).first()
            if existing_user:
                existing_user.role = UserRole.ADMIN.value
                existing_user.status = UserStatus.ACTIVE.value
                db.commit()
                logger.info(f"Existing user '{admin_email}' promoted to ADMIN.")
            else:
                new_admin = User(
                    name="System Administrator",
                    email=admin_email,
                    password_hash=get_password_hash("Admin@123456"),
                    role=UserRole.ADMIN.value,
                    status=UserStatus.ACTIVE.value,
                    is_active=True,
                )
                db.add(new_admin)
                db.flush()

                profile = Profile(
                    user_id=new_admin.id,
                    organization="BharatStandards Compliance Directorate",
                    designation="Lead Systems Auditor",
                    industry="Regulatory Standards",
                    location="New Delhi, India",
                )
                db.add(profile)
                db.commit()
                logger.info(f"Default admin user '{admin_email}' seeded successfully.")

        # 2. Seed Default Knowledge Sources if empty
        ks_count = db.query(KnowledgeSource).count()
        if ks_count == 0:
            sources_data = [
                {
                    "source_type": KnowledgeSourceType.OFFICIAL.value,
                    "name": "Bureau of Indian Standards (BIS) Official e-Sale Portal",
                    "url": "https://www.standardsbis.in",
                    "description": "Primary authoritative repository for published Indian Standards (IS), Amendments, and Special Publications.",
                    "authority_level": KnowledgeAuthorityLevel.HIGH.value,
                    "is_verified": True,
                },
                {
                    "source_type": KnowledgeSourceType.OFFICIAL.value,
                    "name": "Manakonline - BIS Conformity Assessment Portal",
                    "url": "https://www.manakonline.in",
                    "description": "Official BIS online portal for e-CRS, product certification (ISI Mark Scheme-I), and recognized test laboratories.",
                    "authority_level": KnowledgeAuthorityLevel.HIGH.value,
                    "is_verified": True,
                },
                {
                    "source_type": KnowledgeSourceType.OFFICIAL.value,
                    "name": "Ministry of Consumer Affairs - QCO Gazette Notifications",
                    "url": "https://consumeraffairs.nic.in",
                    "description": "Official Gazette notifications for mandatory Quality Control Orders (QCO) enforcing compulsory certification.",
                    "authority_level": KnowledgeAuthorityLevel.HIGH.value,
                    "is_verified": True,
                },
                {
                    "source_type": KnowledgeSourceType.DEMO.value,
                    "name": "Synthetic Industry Compliance Guidelines (DEMO / SYNTHETIC DATA)",
                    "url": "https://demo.bharatstandards.ai/guidelines",
                    "description": "Synthetic compliance advisory blueprints used for prototype simulation and testing purposes.",
                    "authority_level": KnowledgeAuthorityLevel.MEDIUM.value,
                    "is_verified": False,
                },
            ]

            for src in sources_data:
                db.add(KnowledgeSource(**src))
            db.commit()
            logger.info("Default Knowledge Sources seeded.")

        # 3. Seed Knowledge Indices for existing standards and clauses if needed
        unindexed_standards = (
            db.query(Standard)
            .outerjoin(
                KnowledgeIndex,
                (KnowledgeIndex.entity_type == "standard") & (KnowledgeIndex.entity_id == Standard.id),
            )
            .filter(KnowledgeIndex.id == None)
            .all()
        )
        for std in unindexed_standards:
            db.add(
                KnowledgeIndex(
                    entity_type="standard",
                    entity_id=std.id,
                    index_status=KnowledgeIndexStatus.INDEXED.value,
                    embedding_model="text-embedding-3-small",
                )
            )
        db.commit()

    except Exception as e:
        db.rollback()
        logger.warning(f"Admin and knowledge base seeding failed: {e}")
