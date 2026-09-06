"""
BharatStandards AI - Standards Knowledge Base Seed Engine
Populates high-fidelity synthetic demo standards and requirements for testing and development.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.standard import Standard, Requirement, StandardStatus, RequirementCategory


def seed_standards_knowledge_base(db: Session) -> None:
    """
    Idempotent seed function. Checks if DEMO-IS-001 already exists; if not,
    populates the synthetic demonstration standards knowledge base.
    """
    now = datetime.now(timezone.utc)
    existing = db.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()
    if existing:
        req_count = db.query(Requirement).filter(Requirement.standard_id == existing.id).count()
        if req_count >= 20:
            return
        logger.info("Upgrading DEMO-IS-001 requirements to 20 benchmark clauses...")
        db.query(Requirement).filter(Requirement.standard_id == existing.id).delete()
        db.flush()
        std1 = existing
    else:
        logger.info("Seeding synthetic BIS Standards Knowledge Base...")
        std1 = Standard(
            standard_number="DEMO-IS-001",
            title="Electric Water Heater Safety — Demonstration Standard",
            category="Electrical Appliances",
            scope=(
                "Demonstration scope for electric storage water heaters: specifies electrical safety, "
                "thermal cutoff, pressure vessel endurance, and energy efficiency for appliances operated "
                "on single-phase 230V AC mains up to 250V capacity."
            ),
            description=(
                "Synthetic benchmark standard modeling BIS Scheme-I ISI certification criteria for stationary "
                "storage type electric water heaters used in residential and commercial installations."
            ),
            version="2026-DEMO",
            status=StandardStatus.DEMO.value,
            source="Synthetic Demo Knowledge Base",
            source_url=None,
            publication_date=now,
            is_demo=True,
        )
        db.add(std1)
        db.flush()

    reqs1 = [
        # --- 15 PASS Requirements (Total Weight: 36.0) ---
        Requirement(
            standard_id=std1.id,
            clause="4.1",
            title="Electrical Insulation & Earthing Continuity",
            description=(
                "The appliance must provide reliable Class I protective earthing. The ground continuity "
                "resistance between the earthing terminal and all accessible metallic parts must not exceed 0.1 ohm."
            ),
            category=RequirementCategory.SAFETY.value,
            evidence_required="NABL accredited earth continuity lab report with milliohm calibration certificate.",
            verification_method="Earth bond resistance meter at 25A AC test current for 60 seconds.",
            weight=2.0,
            page=8,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="6.1",
            title="Dielectric Voltage Withstand & Electric Strength",
            description=(
                "Appliance insulation must withstand test voltage of 1500 V AC applied for 60 seconds between "
                "live parts and accessible enclosure without dielectric breakdown, flashover, or puncture."
            ),
            category=RequirementCategory.SAFETY.value,
            evidence_required="High-voltage dielectric test report from accredited testing facility.",
            verification_method="Calibrated HV test set with leakage trip current threshold set to 5 mA.",
            weight=3.0,
            page=12,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="7.1",
            title="Protection Against Electric Shock & Live Contact",
            description=(
                "Live electrical parts must be inaccessible to standard test probe fingers under all normal and maintenance configurations."
            ),
            category=RequirementCategory.SAFETY.value,
            evidence_required="Articulated finger probe test report with mechanical force gauge verification.",
            verification_method="Standard test finger probe inspection under 30N force.",
            weight=2.0,
            page=14,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="8.2",
            title="Input Power and Current Rating Tolerance",
            description=(
                "The actual power input at rated voltage shall not deviate from the rated wattage by more than +5% or -10%."
            ),
            category=RequirementCategory.PERFORMANCE.value,
            evidence_required="Calibrated digital power analyzer test report under steady operating conditions.",
            verification_method="Precision digital wattmeter reading at rated voltage and nominal ambient temperature.",
            weight=2.0,
            page=16,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="8.4",
            title="Hydraulic Pressure Proof Test (Pressure Vessel)",
            description=(
                "The internal water storage vessel must withstand hydrostatic pressure equal to twice rated working pressure "
                "(minimum 1.6 MPa / 16 bar) for 15 minutes without leakage, structural distortion, or weld rupture."
            ),
            category=RequirementCategory.TESTING.value,
            evidence_required="Hydrostatic burst and pressure hold laboratory certification with calibrated gauge logs.",
            verification_method="Calibrated hydrostatic pressure transducer decay test with digital logging.",
            weight=3.0,
            page=18,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="9.1",
            title="Starting and Operational Leakage Current",
            description=(
                "Leakage current between live poles and accessible enclosure during operation must not exceed 0.75 mA peak."
            ),
            category=RequirementCategory.TESTING.value,
            evidence_required="Operational leakage current test certificate across hot and cold operating cycles.",
            verification_method="True-RMS leakage current meter measuring across earth terminal during continuous run.",
            weight=2.0,
            page=20,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="10.2",
            title="Thermal Cut-out Non-Self-Resetting Interlock",
            description=(
                "A non-self-resetting thermal cut-out must operate independently of the primary thermostat to interrupt "
                "power across all poles if water temperature exceeds 90°C."
            ),
            category=RequirementCategory.SAFETY.value,
            evidence_required="Component conformity certificate (IS/IEC 60730) & dry-run runaway cutoff curve.",
            verification_method="Dry-firing and temperature runaway curve logging under simulated thermostat failure.",
            weight=3.0,
            page=22,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="11.1",
            title="Thermostat Operational Cycling & Temperature Setting",
            description=(
                "Thermostat must regulate water temperature within ±3°C of setpoint across minimum 10,000 operational cycles."
            ),
            category=RequirementCategory.TESTING.value,
            evidence_required="Thermostatic endurance cycling laboratory report and trip calibration data.",
            verification_method="Automated thermal cycling bench monitoring cut-in and cut-out trip temperatures.",
            weight=2.0,
            page=25,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="12.1",
            title="Standing Heat Loss & Energy Efficiency Rating",
            description=(
                "Standing heat loss per 24 hours at 65°C water temperature shall not exceed 0.788 kWh/24h/45°C "
                "for a 25 Litres storage volume to satisfy national energy efficiency benchmarks."
            ),
            category=RequirementCategory.PERFORMANCE.value,
            evidence_required="Calorimetric 24-hour standing energy consumption certificate from NABL laboratory.",
            verification_method="24-hour calorimetric temperature decay logging in a temperature-stabilized test chamber.",
            weight=3.0,
            page=28,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="13.3",
            title="Water Heating Time and Re-heat Recovery",
            description=(
                "Appliance must heat nominal capacity from 15°C to 60°C within specified manufacturer rated duration (±10%)."
            ),
            category=RequirementCategory.PERFORMANCE.value,
            evidence_required="Heating time performance curve and thermal efficiency calculation dossier.",
            verification_method="Calibrated thermocouple multi-point average temperature rise curve against timer.",
            weight=2.0,
            page=30,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="14.1",
            title="ISI Standard Mark & Rating Plate Marking",
            description=(
                "The marking plate must clearly display manufacturer name, model designation, rated voltage, wattage, "
                "rated storage capacity, test pressure, and the BIS Standard Mark with CM/L license number."
            ),
            category=RequirementCategory.MARKING.value,
            evidence_required="Silkscreen/metal rating label artwork, sample plate, and rubbing durability test report.",
            verification_method="Visual inspection and 15-second petroleum spirit solvent rub durability test.",
            weight=2.0,
            page=32,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="15.2",
            title="Supply Cord Anchorage & Terminal Screws",
            description=(
                "Power supply cord anchorage must relieve internal conductors from pull force of 100N and torque of 0.35 Nm."
            ),
            category=RequirementCategory.SAFETY.value,
            evidence_required="Cord strain relief pull and torque test report from accredited mechanical test lab.",
            verification_method="25 cycles of 100N axial pull and 0.35 Nm rotational torque applied to main supply flex.",
            weight=2.0,
            page=34,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="16.2",
            title="Inner Tank Corrosion Resistance & Enamelling",
            description=(
                "The inner vessel glass lining or vitreous enamelling must be continuous without pinholes and resist "
                "acid corrosion with mass loss not exceeding 5 g/m² under boiling citric acid test."
            ),
            category=RequirementCategory.MATERIAL.value,
            evidence_required="Vitreous enamel thickness gauge certificate and chemical corrosion resistance test report.",
            verification_method="Citric acid spot test and electromagnetic coating thickness gauge per ISO 28706.",
            weight=3.0,
            page=36,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="17.1",
            title="Resistance to Rusting of Outer Enclosure",
            description=(
                "The painted, powder-coated, or plastic outer casing must withstand neutral salt spray testing for 96 hours without blistering or peel."
            ),
            category=RequirementCategory.MATERIAL.value,
            evidence_required="Neutral salt spray (NSS) chamber test certificate per IS 9844.",
            verification_method="96-hour continuous 5% NaCl salt fog exposure at 35°C chamber temperature.",
            weight=2.0,
            page=38,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="18.2",
            title="Quality Manual & Factory Production Control",
            description=(
                "The manufacturing plant must operate a formal Scheme-I Quality Manual with traceability logs and routine inspection logs."
            ),
            category=RequirementCategory.DOCUMENTATION.value,
            evidence_required="Scheme-I Factory Quality Dossier, calibration certificates, and routine test logbooks.",
            verification_method="Auditor physical document review and calibration trace verification.",
            weight=3.0,
            page=41,
            source="Synthetic Demo Knowledge Base",
        ),

        # --- 3 PARTIAL Requirements (Total Weight: 6.0, 2.0 each) ---
        Requirement(
            standard_id=std1.id,
            clause="19.3",
            title="Ingress Protection Rating (IPX4 Splash-proof Verification)",
            description=(
                "Enclosure must satisfy IPX4 splash water ingress protection without moisture reaching electrical terminal blocks."
            ),
            category=RequirementCategory.TESTING.value,
            evidence_required="IPX4 oscillating spray test report with humidity preconditioning certificate.",
            verification_method="10-minute oscillating spray tube followed immediately by high-voltage dielectric check.",
            weight=2.0,
            page=43,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="20.1",
            title="Protective Packaging & Transit Drop Test",
            description=(
                "The packaged water heater must withstand free-fall drop testing from a height of 750 mm onto concrete "
                "without causing mechanical displacement of internal wiring or degradation of insulation."
            ),
            category=RequirementCategory.PACKAGING.value,
            evidence_required="Transit packaging vibration and drop test certificate.",
            verification_method="Six-sided free-fall drop test per national packaging test procedures.",
            weight=2.0,
            page=45,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="21.2",
            title="Routine Test Set Calibration Certificates & Audit Trace",
            description=(
                "All daily end-of-line test instruments (HV tester, earth bond meter, leakage meter) must possess valid NABL calibration trace."
            ),
            category=RequirementCategory.DOCUMENTATION.value,
            evidence_required="Valid annual calibration certificates for end-of-line production testing apparatus.",
            verification_method="Physical review of calibration validity stamps and NABL certificate numbers.",
            weight=2.0,
            page=48,
            source="Synthetic Demo Knowledge Base",
        ),

        # --- 2 MISSING Requirements (Total Weight: 8.0, 4.0 each, Critical/High Gaps) ---
        Requirement(
            standard_id=std1.id,
            clause="11.4",
            title="Thermal Runaway Multi-channel Calibration Logs",
            description=(
                "Verification logs from multi-channel thermal probe arrays demonstrating thermocouple response under dry-burn cutoff failure mode."
            ),
            category=RequirementCategory.TESTING.value,
            evidence_required="Multi-channel thermocouple calibration curve and data acquisition log during simulated dry-fire runaway.",
            verification_method="Continuous computerized temperature logging at 100ms sample interval during heating element de-watering.",
            weight=4.0,
            page=52,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std1.id,
            clause="19.1",
            title="Bilingual Rating Plate Proof & Statutory Warnings",
            description=(
                "Statutory advisory warnings ('DO NOT SWITCH ON WITHOUT WATER') and full electrical parameters must be legibly marked in Hindi and English."
            ),
            category=RequirementCategory.MARKING.value,
            evidence_required="Approved bilingual label engineering drawing and photographic proof of Hindi/English marking plate on appliance exterior.",
            verification_method="Bilingual typography inspection and rub durability test per statutory requirements.",
            weight=4.0,
            page=55,
            source="Synthetic Demo Knowledge Base",
        ),
    ]
    for r in reqs1:
        db.add(r)

    # 2. DEMO-IS-002: Safety of Household Electrical Appliances
    std2 = db.query(Standard).filter(Standard.standard_number == "DEMO-IS-002").first()
    if not std2:
        std2 = Standard(
            standard_number="DEMO-IS-002",
            title="Safety of Household Electrical Appliances — Demonstration Standard",
            category="Electrical Appliances",
            scope=(
                "General safety benchmark for electric mains-powered household and commercial appliances operating below 250V single-phase."
            ),
            description=(
                "Synthetic baseline standard modeling horizontal electrical safety, thermal durability, and fire resistance criteria."
            ),
            version="2026-DEMO",
            status=StandardStatus.DEMO.value,
            source="Synthetic Demo Knowledge Base",
            source_url=None,
            publication_date=now,
            is_demo=True,
        )
        db.add(std2)
        db.flush()

        reqs2 = [
        Requirement(
            standard_id=std2.id,
            clause="5.1",
            title="Protection Against Access to Live Parts",
            description="Enclosure openings must prevent test finger or test probe from contacting live electrical conductors.",
            category=RequirementCategory.SAFETY.value,
            evidence_required="IPXXB test finger insertion test report.",
            verification_method="Standard articulated test probe inspection under 30N force.",
            page=10,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std2.id,
            clause="7.2",
            title="Heating Under Normal Operational Conditions",
            description="Temperatures of appliance handles, surfaces, and internal components must not exceed specified safety limits during continuous operation.",
            category=RequirementCategory.TESTING.value,
            evidence_required="Thermocouple temperature rise test report.",
            verification_method="Multi-channel thermocouple thermal rise recording at 1.15 times rated power.",
            page=16,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std2.id,
            clause="11.4",
            title="Moisture Resistance & Ingress Protection",
            description="Enclosure must maintain specified degree of moisture resistance (IPX4 minimum) without internal water ingress reaching live electrical components.",
            category=RequirementCategory.TESTING.value,
            evidence_required="Ingress protection test certificate from NABL laboratory.",
            verification_method="Oscillating spray tube chamber test for 10 minutes followed by dielectric withstand.",
            page=24,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std2.id,
            clause="15.1",
            title="Supply Cord Anchorage & Strain Relief",
            description="Power cord anchorage must relieve conductors from strain, including twisting, and protect wire insulation from abrasion.",
            category=RequirementCategory.SAFETY.value,
            evidence_required="Cord pull and torque endurance lab report.",
            verification_method="25 pulls of 60N and 0.25 Nm torque test.",
            page=30,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std2.id,
            clause="19.3",
            title="Warning Labels & Safety Operating Instructions",
            description="Appliances must include bilingual warning markings in English and Hindi regarding safe immersion, earthing, and maintenance.",
            category=RequirementCategory.MARKING.value,
            evidence_required="User instruction manual copy and photographic evidence of label placement.",
            verification_method="Visual inspection and bilingual translation review.",
            page=38,
            source="Synthetic Demo Knowledge Base",
        ),
        ]
        for r in reqs2:
            db.add(r)

    # 3. DEMO-IS-003: Information Technology Equipment Safety & EMC
    std3 = db.query(Standard).filter(Standard.standard_number == "DEMO-IS-003").first()
    if not std3:
        std3 = Standard(
            standard_number="DEMO-IS-003",
            title="Information Technology Equipment Safety & EMC — Demonstration Standard",
            category="Electronics",
            scope=(
                "Safety, radio frequency interference suppression, and power adapter isolation for IT equipment, computers, and digital devices."
            ),
            description=(
                "Synthetic demonstration standard modeling CRO (Compulsory Registration Order) safety benchmarks for digital electronics."
            ),
            version="2026-DEMO",
            status=StandardStatus.DEMO.value,
            source="Synthetic Demo Knowledge Base",
            source_url=None,
            publication_date=now,
            is_demo=True,
        )
        db.add(std3)
        db.flush()

        reqs3 = [
        Requirement(
            standard_id=std3.id,
            clause="4.1",
            title="Electric Shock Protection in Digital & Telecom Ports",
            description="Safety extra-low voltage (SELV) circuits and external I/O ports must remain isolated from hazardous primary mains voltages.",
            category=RequirementCategory.SAFETY.value,
            evidence_required="Galvanic isolation test report.",
            verification_method="Optocoupler and transformer creepage/clearance distance verification.",
            page=12,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std3.id,
            clause="6.2",
            title="Conducted & Radiated RF Emission Limits",
            description="Electromagnetic disturbance emitted by digital switching circuitry must not exceed Class B residential emission limits.",
            category=RequirementCategory.TESTING.value,
            evidence_required="EMC laboratory emission scan report.",
            verification_method="Semi-anechoic chamber RF antenna measurement from 30 MHz to 1 GHz.",
            page=20,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std3.id,
            clause="8.3",
            title="External Power Supply Efficiency & Standby Power",
            description="External AC-DC power adapter must meet Level VI active average energy efficiency and standby power under 0.1W.",
            category=RequirementCategory.PERFORMANCE.value,
            evidence_required="Energy efficiency test certificate.",
            verification_method="Precision power analyzer 4-point load test (25%, 50%, 75%, 100%).",
            page=26,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std3.id,
            clause="10.1",
            title="Bilingual Laser & High-Energy Radiation Warnings",
            description="Optical drives or laser indicators must include Class 1 laser declaration and bilingual safety cautionary labels.",
            category=RequirementCategory.MARKING.value,
            evidence_required="Laser safety classification certificate and label artwork.",
            verification_method="Spectroradiometric optical power output measurement.",
            page=31,
            source="Synthetic Demo Knowledge Base",
        ),
        Requirement(
            standard_id=std3.id,
            clause="12.4",
            title="RoHS Hazardous Substances Declaration",
            description="Concentrations of lead, mercury, cadmium, and hexavalent chromium in homogeneous materials must comply with e-waste rules.",
            category=RequirementCategory.DOCUMENTATION.value,
            evidence_required="RoHS chemical testing report and supplier declaration of conformity.",
            verification_method="X-ray fluorescence (XRF) screening and ICP-OES chemical analysis.",
            page=37,
            source="Synthetic Demo Knowledge Base",
        ),
        ]
        for r in reqs3:
            db.add(r)

    db.commit()
    logger.info("Successfully seeded synthetic BIS Standards Knowledge Base with DEMO-IS-001, DEMO-IS-002, DEMO-IS-003.")
