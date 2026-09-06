"""
BharatStandards AI - BIS Services Demonstration Seed Engine
Populates structured, high-fidelity synthetic demonstration BIS services and guidance records.
All records are explicitly tagged as DEMO / SYNTHETIC DATA and contain NO fabricated government URLs.
"""
from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.bis_service import (
    BISService,
    ServiceCategory,
    ServiceStatus,
    ServiceUserType,
    ServiceActionType,
)


def seed_bis_services(db: Session) -> None:
    """
    Idempotently seeds synthetic demonstration BIS services into the database.
    """
    existing_count = db.query(BISService).count()
    if existing_count >= 4:
        return

    logger.info("Seeding synthetic BIS Services & Guidance records...")
    now = datetime.now(timezone.utc)

    services_data = [
        {
            "service_code": "DEMO-SERVICE-001",
            "name": "BIS Scheme-I Product Certification (ISI Mark) — Demonstration Guide",
            "description": (
                "Synthetic demonstration guidance modeling the BIS Scheme-I Product Certification process. "
                "Provides manufacturers with a structured roadmap for establishing in-house factory testing, "
                "third-party type examination, and preparatory compliance for standard conformity marks."
            ),
            "category": ServiceCategory.CERTIFICATION.value,
            "user_type": ServiceUserType.BOTH.value,
            "eligibility": (
                "Domestic and international manufacturers possessing an active manufacturing facility, "
                "calibrated laboratory equipment for routine batch testing, and a documented quality management system."
            ),
            "required_documents": [
                "Factory Quality Control Plan (QAP) & Inspection Schedule",
                "Manufacturing Facility Layout & Machinery Inventory",
                "In-House Calibrated Test Equipment Calibration Certificates",
                "Third-Party Type Test Dossier from NABL / BIS-Recognized Laboratory",
                "Critical Component Conformance Certificates (Thermostat, Thermal Cut-out, Wiring)",
                "Factory Registration / Business Incorporation Certificate",
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Map Product to Active Indian Standard",
                    "description": "Identify applicable standard clauses (e.g. DEMO-IS-001 for electric water heaters) and verify Quality Control Order (QCO) applicability.",
                    "action_type": ServiceActionType.VIEW_STANDARD.value,
                    "action_target": "/standards",
                },
                {
                    "step_number": 2,
                    "title": "Establish In-House Test Laboratory",
                    "description": "Set up mandatory testing instruments (insulation tester, dielectric bench, pressure pump) with traceable NABL calibrations.",
                    "action_type": ServiceActionType.UPLOAD_DOCUMENT.value,
                    "action_target": "/documents",
                },
                {
                    "step_number": 3,
                    "title": "Conduct Type Approval Testing",
                    "description": "Submit production batch samples to an accredited testing laboratory to obtain verified test evidence for all mandatory clauses.",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
                {
                    "step_number": 4,
                    "title": "Evaluate Compliance Readiness & Resolve Gaps",
                    "description": "Run automated compliance audit in BharatStandards AI to ensure no critical missing clauses remain before official submission.",
                    "action_type": ServiceActionType.RUN_COMPLIANCE_CHECK.value,
                    "action_target": "/compliance",
                },
                {
                    "step_number": 5,
                    "title": "Prepare Official Portal Dossier",
                    "description": "Assemble required factory documentation, test reports, and fee schedules for submission through the official statutory portal.",
                    "action_type": ServiceActionType.UPLOAD_DOCUMENT.value,
                    "action_target": "/documents",
                },
                {
                    "step_number": 6,
                    "title": "Factory Audit & Certification Grant",
                    "description": "Undergo statutory on-site inspection, independent sample verification, and receive the Certification Marks License (CM/L).",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
            ],
            "official_source_name": "Bureau of Indian Standards — Product Certification Scheme-I",
            "official_source_url": None,  # Strict: no fabricated URLs in demo records
            "is_demo": True,
            "status": ServiceStatus.DEMO.value,
        },
        {
            "service_code": "DEMO-SERVICE-002",
            "name": "Compulsory Registration Scheme (CRS) for Electronic & IT Goods — Demonstration Guide",
            "description": (
                "Synthetic demonstration guidance modeling the Self-Declaration of Conformity process under "
                "the Compulsory Registration Scheme (CRS) administered by BIS for electronics and IT products."
            ),
            "category": ServiceCategory.REGISTRATION.value,
            "user_type": ServiceUserType.INDUSTRY.value,
            "eligibility": (
                "Original Equipment Manufacturers (OEMs), brand owners, and Authorized Indian Representatives (AIR) "
                "for notified electronics and IT products seeking market authorization."
            ),
            "required_documents": [
                "Safety Test Report from BIS-Recognized Testing Laboratory (issued within 90 days)",
                "Registered Trademark Authorization Letter / Brand Owner Agreement",
                "Affidavit cum Undertaking for Self-Declaration of Conformity",
                "Authorized Indian Representative (AIR) Appointment Letter & ID Proof (for foreign OEMs)",
                "Factory Production Line Video & Manufacturing Capability Summary",
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Confirm Product Classification under CRS",
                    "description": "Verify whether the electronic device or power supply falls within the notified schedule of CRS products.",
                    "action_type": ServiceActionType.VIEW_STANDARD.value,
                    "action_target": "/standards",
                },
                {
                    "step_number": 2,
                    "title": "Lab Safety Testing",
                    "description": "Deliver test samples to a BIS-recognized laboratory for comprehensive safety, electrical, and thermal testing.",
                    "action_type": ServiceActionType.UPLOAD_DOCUMENT.value,
                    "action_target": "/documents",
                },
                {
                    "step_number": 3,
                    "title": "Review Test Report Evidence in AI Vault",
                    "description": "Upload test report to BharatStandards AI to verify all critical safety parameters conform to standard limits.",
                    "action_type": ServiceActionType.RUN_COMPLIANCE_CHECK.value,
                    "action_target": "/compliance",
                },
                {
                    "step_number": 4,
                    "title": "Portal Submission & Registration Issuance",
                    "description": "Submit online application accompanied by lab test report and affidavit to receive the R-Number registration.",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
            ],
            "official_source_name": "Bureau of Indian Standards — Compulsory Registration Portal (CRS)",
            "official_source_url": None,  # Strict: no fabricated URLs
            "is_demo": True,
            "status": ServiceStatus.DEMO.value,
        },
        {
            "service_code": "DEMO-SERVICE-003",
            "name": "NABL Accredited Laboratory Testing & Gap Resolution Guidance",
            "description": (
                "Synthetic procedural guidance to help manufacturers resolve critical non-conformances, "
                "missing laboratory evidence, and hydrostatic or electrical withstand test gaps identified during readiness audit."
            ),
            "category": ServiceCategory.TESTING.value,
            "user_type": ServiceUserType.BOTH.value,
            "eligibility": (
                "Enterprises and product developers with incomplete compliance dossiers or critical missing clauses "
                "requiring accredited laboratory testing verification."
            ),
            "required_documents": [
                "Product Technical Specification Datasheet & Circuit Schematics",
                "Target Compliance Gap Report from BharatStandards AI Audit",
                "Production Batch Sample Quantity (minimum 3 specimens)",
                "Component Specifications & Bill of Materials (BOM)",
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Identify Unresolved Compliance Gaps",
                    "description": "Pinpoint missing test evidence (e.g. Clause 8.4 Hydrostatic Burst Proof Test or Clause 12.2 Thermal Cut-off) from your gap register.",
                    "action_type": ServiceActionType.FIX_GAP.value,
                    "action_target": "/compliance",
                },
                {
                    "step_number": 2,
                    "title": "Select Accredited Test Scope",
                    "description": "Formulate test protocol specifying target clauses, temperature thresholds, and hydraulic pressure parameters.",
                    "action_type": ServiceActionType.VIEW_STANDARD.value,
                    "action_target": "/standards",
                },
                {
                    "step_number": 3,
                    "title": "Sample Dispatch & Laboratory Execution",
                    "description": "Dispatch representative production samples to an accredited testing facility for formal test execution.",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
                {
                    "step_number": 4,
                    "title": "Upload Certificate to Document Vault",
                    "description": "Upload the certified test report to your Document Vault to automatically re-evaluate and close compliance gaps.",
                    "action_type": ServiceActionType.UPLOAD_DOCUMENT.value,
                    "action_target": "/documents",
                },
            ],
            "official_source_name": "National Accreditation Board for Testing and Calibration Laboratories (NABL)",
            "official_source_url": None,  # Strict: no fabricated URLs
            "is_demo": True,
            "status": ServiceStatus.DEMO.value,
        },
        {
            "service_code": "DEMO-SERVICE-004",
            "name": "Consumer ISI Mark Verification & Appliance Safety Guide",
            "description": (
                "Synthetic consumer guidance for identifying authentic ISI certification marks, validating 7-digit "
                "CM/L license numbers, and ensuring domestic electrical appliance safety."
            ),
            "category": ServiceCategory.CONSUMER_GUIDANCE.value,
            "user_type": ServiceUserType.CONSUMER.value,
            "eligibility": (
                "Consumers, homeowners, and purchasers of electrical appliances, safety gear, or consumer goods "
                "wishing to confirm product safety and authenticity."
            ),
            "required_documents": [
                "Clear photograph of the product rating plate / nameplate showing ISI Mark and CM/L number",
                "Purchase tax invoice or retailer warranty documentation",
            ],
            "steps": [
                {
                    "step_number": 1,
                    "title": "Locate the ISI Mark on the Appliance",
                    "description": "Inspect the rating plate for the standardized ISI emblem, the Indian Standard reference (e.g. IS 302-2-21 or DEMO-IS-001), and the 7-digit CM/L license code.",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
                {
                    "step_number": 2,
                    "title": "Check Rating Plate Specifications",
                    "description": "Confirm the voltage (230V AC), wattage rating, capacity, and manufacturer name match the outer retail carton.",
                    "action_type": ServiceActionType.VIEW_STANDARD.value,
                    "action_target": "/standards",
                },
                {
                    "step_number": 3,
                    "title": "Verify License Authenticity",
                    "description": "Use the official BIS Care mobile application or portal verification tool to validate the manufacturer's active license status.",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
                {
                    "step_number": 4,
                    "title": "Report Counterfeit or Misleading Marks",
                    "description": "If the CM/L number is invalid, expired, or missing from a mandatory QCO appliance, submit a consumer grievance.",
                    "action_type": ServiceActionType.VIEW_SERVICE.value,
                    "action_target": "/services",
                },
            ],
            "official_source_name": "Bureau of Indian Standards — Consumer Affairs Department",
            "official_source_url": None,  # Strict: no fabricated URLs
            "is_demo": True,
            "status": ServiceStatus.DEMO.value,
        },
    ]

    for item in services_data:
        existing = db.query(BISService).filter(BISService.service_code == item["service_code"]).first()
        if not existing:
            svc = BISService(
                service_code=item["service_code"],
                name=item["name"],
                description=item["description"],
                category=item["category"],
                user_type=item["user_type"],
                eligibility=item["eligibility"],
                required_documents=item["required_documents"],
                steps=item["steps"],
                official_source_name=item["official_source_name"],
                official_source_url=item["official_source_url"],
                is_demo=item["is_demo"],
                status=item["status"],
                created_at=now,
                updated_at=now,
            )
            db.add(svc)

    db.commit()
    logger.info("Synthetic BIS Services & Guidance seeded successfully.")
