"""
BharatStandards AI - SIH Demonstration Dataset Seed Engine
Populates a high-fidelity synthetic demo product, documents, compliance results,
risk intelligence, and demo accounts for SIH evaluation.
All demo data is strictly marked as SYNTHETIC / DEMO DATA.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile
from app.models.product import Product
from app.models.standard import Standard
from app.models.document import Document, DocumentStatus
from app.models.compliance import ComplianceReport
from app.models.report import Report
from app.services.compliance_service import ComplianceService
from app.services.risk_engine import ComplianceRiskEngine
from app.services.report_service import ReportService
from app.services.audit_service import audit_service


def seed_demo_dataset(db: Session) -> None:
    """
    Idempotently seeds the benchmark SIH presentation dataset:
    - Demo User: demo@bharatstandards.ai / DemoUser123!
    - Demo Product: Domestic Electric Water Heater (DEWH-25L-2026)
    - Demo Documents: Laboratory Test Report & Technical Installation Manual
    - Demo Compliance Assessment against DEMO-IS-001 (78% readiness, 39 risk)
    - Demo Generated Compliance Audit Dossier Report
    """
    try:
        # 1. Seed or retrieve Demo User
        demo_email = "demo@bharatstandards.ai"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            demo_user = User(
                name="Demo Compliance Officer",
                email=demo_email,
                password_hash=get_password_hash("DemoUser123!"),
                role=UserRole.INDUSTRY.value,
                status=UserStatus.ACTIVE.value,
                is_active=True,
            )
            db.add(demo_user)
            db.flush()

            profile = Profile(
                user_id=demo_user.id,
                organization="Bharat ElectroCorp Ltd. (DEMO)",
                designation="Lead Compliance & Quality Engineer",
                industry="Electrical & Thermal Consumer Appliances",
                location="Pune, Maharashtra, India",
                phone="+91-9876543210",
            )
            db.add(profile)
            db.commit()
            logger.info("Seeded demo user 'demo@bharatstandards.ai'.")
        else:
            logger.info("Demo user 'demo@bharatstandards.ai' already exists.")

        # 2. Retrieve benchmark standard DEMO-IS-001
        benchmark_std = db.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()
        if not benchmark_std:
            logger.warning("DEMO-IS-001 standard not found; skipping product demo seed.")
            return

        # 3. Seed or retrieve Demo Product
        prod_name = "Domestic Electric Water Heater"
        demo_product = (
            db.query(Product)
            .filter(Product.user_id == demo_user.id, Product.name == prod_name)
            .first()
        )
        if not demo_product:
            demo_product = Product(
                user_id=demo_user.id,
                name=prod_name,
                category="Electrical Appliances",
                manufacturer="Bharat ElectroCorp Ltd.",
                model_number="DEWH-25L-2026",
                description=(
                    "Stationary residential storage electric water heater (25L capacity, 2000W heating element, "
                    "230V AC single-phase). Fitted with immersion heating unit, dual thermostat cut-offs, "
                    "and enamel-lined pressure vessel."
                ),
                intended_use="Domestic sanitary hot water supply for residential bathrooms and kitchens.",
                technical_details=(
                    "Voltage: 230V AC, 50Hz\n"
                    "Rated Power: 2000W\n"
                    "Tank Capacity: 25 Litres\n"
                    "Working Pressure: 0.8 MPa (8 bar)\n"
                    "Insulation: High-density CFC-free polyurethane foam (PUF)\n"
                    "Safety: Dual thermal cutoff, pressure relief safety valve (PRV), IPX4 splash proof.\n"
                    "Target Market: Domestic Indian Market (Scheme-I ISI Mark Certification)"
                ),
                status="READY",
            )
            db.add(demo_product)
            db.commit()
            db.refresh(demo_product)
            logger.info(f"Seeded demo product #{demo_product.id}: '{prod_name}'.")

            audit_service.log_event(
                db=db,
                user_id=demo_user.id,
                action="PRODUCT_CREATED",
                entity_type="product",
                entity_id=demo_product.id,
                description=f"Seeded synthetic presentation product '{prod_name}'",
            )
        else:
            logger.info(f"Demo product #{demo_product.id} already exists.")

        # 4. Seed Synthetic Evidence Documents
        doc_count = db.query(Document).filter(Document.product_id == demo_product.id).count()
        if doc_count == 0:
            doc1 = Document(
                user_id=demo_user.id,
                product_id=demo_product.id,
                filename="dewh_test_report_nabl_2026.pdf",
                original_filename="NABL Laboratory Test Report - DEWH 25L (2026).pdf",
                storage_path="/storage/documents/dewh_test_report_nabl_2026.pdf",
                file_size=2450000,
                file_type="PDF",
                mime_type="application/pdf",
                status=DocumentStatus.PROCESSED.value,
                page_count=12,
            )
            doc2 = Document(
                user_id=demo_user.id,
                product_id=demo_product.id,
                filename="dewh_user_installation_manual_2026.pdf",
                original_filename="Installation & Technical User Manual - DEWH 25L.pdf",
                storage_path="/storage/documents/dewh_user_installation_manual_2026.pdf",
                file_size=1180000,
                file_type="PDF",
                mime_type="application/pdf",
                status=DocumentStatus.PROCESSED.value,
                page_count=24,
            )
            db.add_all([doc1, doc2])
            db.commit()
            logger.info("Seeded 2 synthetic demo documents for Domestic Electric Water Heater.")

        # 5. Seed Compliance Assessment & Report
        comp_report = (
            db.query(ComplianceReport)
            .filter(
                ComplianceReport.product_id == demo_product.id,
                ComplianceReport.standard_id == benchmark_std.id,
            )
            .first()
        )
        if not comp_report:
            logger.info("Running automated initial compliance check for demo product...")
            comp_report = ComplianceService.run_compliance_check(
                product_id=demo_product.id,
                standard_id=benchmark_std.id,
                user_id=demo_user.id,
                db=db,
            )

        # 6. Seed Compliance Dossier Report Record
        existing_dossier = (
            db.query(Report)
            .filter(Report.compliance_report_id == comp_report.id)
            .first()
        )
        if not existing_dossier:
            logger.info("Generating initial compliance dossier report for demo product...")
            try:
                ReportService.generate_report(
                    compliance_report_id=comp_report.id,
                    user_id=demo_user.id,
                    db=db,
                )
            except Exception as rep_err:
                logger.warning(f"Demo report generation deferred: {rep_err}")

        logger.info("SIH demonstration dataset successfully verified and seeded.")
    except Exception as e:
        logger.error(f"Error seeding SIH demo dataset: {e}")
        db.rollback()
