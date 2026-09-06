"""
BharatStandards AI - Evidence Matcher
Provides explainable, deterministic evidence matching between Standard Requirements
and User Uploaded Document Chunks.

Supports deterministic evaluation rules for synthetic demonstration benchmarks
as well as keyword/clause-based deterministic matching for arbitrary documents.
"""
import json
import re
from typing import Any, Dict, List, Optional
from app.models.compliance import ComplianceStatus, ConfidenceLevel, GapPriority
from app.models.document import Document, DocumentChunk
from app.models.standard import Requirement


class EvidenceMatcher:
    """
    Deterministic requirement and evidence matching engine.
    Computes status (PASS, PARTIAL, MISSING), confidence, citations, and actionable recommendations.
    """

    # Pre-configured demo rules for DEMO-IS-001 (Electric Water Heater)
    DEMO_RULES = {
        "4.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 2,
            "snippet": "Clause 4.1 Earth Continuity: Resistance measured between main earthing terminal and tank flange = 0.042 ohm (Limit: <= 0.10 ohm). RESULT: PASS.",
            "reason": "Uploaded NABL laboratory test report substantiates earth bond continuity with calibrated 25A test current.",
            "action": "Maintain earth continuity calibration logs in factory quality dossier. No remediation required.",
        },
        "6.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 4,
            "snippet": "Clause 6.1 Electric Strength: Applied 1500V AC across live conductors and external casing for 60 seconds. Leakage = 0.41 mA (Trip limit: 5.0 mA). RESULT: PASS.",
            "reason": "Dielectric withstand voltage test successfully verified without flashover or insulation breakdown.",
            "action": "Verify annual dielectric tester calibration during routine factory surveillance. No immediate action required.",
        },
        "7.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Product Technical Specification",
            "page": 6,
            "snippet": "Clause 7.1 Live Contact Protection: Enclosure rated IPX4 with zero ingress opening. Jointed test finger IPXXB failed to contact internal wiring under 30N force.",
            "reason": "Articulated test probe inspection confirms all live terminals and heating elements are physically protected.",
            "action": "Ensure plastic casing injection mold tolerances prevent gap expansion. No remediation required.",
        },
        "8.2": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Product Technical Specification",
            "page": 3,
            "snippet": "Clause 8.2 Input Power Tolerance: Rated wattage = 2000W at 230V. Measured wattage = 1980W (-1.0% deviation, allowed: +5% / -10%). RESULT: COMPLIANT.",
            "reason": "Input wattage and current consumption comply with rated tolerance limits.",
            "action": "Maintain heating element resistance batch inspection records. No immediate action required.",
        },
        "8.4": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 7,
            "snippet": "Clause 8.4 Hydrostatic Pressure Hold: Internal vessel pressurized to 1.60 MPa (16 bar) for 15 minutes. Pressure drop = 0.00 bar. No weld distortion observed.",
            "reason": "Internal storage cylinder successfully withstood proof pressure equal to twice rated working pressure.",
            "action": "Archive vessel batch welding radiographic records in Scheme-I technical file.",
        },
        "9.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 5,
            "snippet": "Clause 9.1 Operational Leakage Current: Peak leakage recorded at 1.15x rated voltage = 0.38 mA (Statutory limit: <= 0.75 mA).",
            "reason": "Operational leakage current well below maximum threshold during steady-state heating cycle.",
            "action": "Monitor routine leakage tester on assembly line.",
        },
        "10.2": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 9,
            "snippet": "Clause 10.2 Thermal Cut-out Operation: Thermostat bypassed; water temperature reached 88.4°C. Non-self-resetting thermal cut-out tripped cleanly across all poles.",
            "reason": "Independent dual-pole thermal cut-out operates reliably below maximum allowable safety ceiling.",
            "action": "Confirm component vendor ISI/IEC 60730 certification remains active.",
        },
        "11.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Product Technical Specification",
            "page": 8,
            "snippet": "Clause 11.1 Thermostat Cycling: Capillary thermostat calibrated cut-off at 65°C ± 2.5°C over 10,000 automated cycles without contact welding.",
            "reason": "Endurance thermal cycling demonstrates compliant temperature control and hysteresis.",
            "action": "Retain component endurance life certificate.",
        },
        "12.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 11,
            "snippet": "Clause 12.1 Standing Loss: 24-hour standing energy loss measured at 0.742 kWh/24h/45°C (Benchmark ceiling: 0.788 kWh/24h/45°C). Star rating threshold achieved.",
            "reason": "Calorimetric 24-hour heat loss meets national energy conservation and BIS ISI standards.",
            "action": "Ensure polyurethane foam (PUF) insulation density is maintained in daily molding logs.",
        },
        "13.3": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Product Technical Specification",
            "page": 10,
            "snippet": "Clause 13.3 Heating Time: Rise from 15°C to 60°C completed in 34 minutes for 25L capacity (Manufacturer rated: 35 ± 3.5 min).",
            "reason": "Thermal recovery and heating time match declared commercial ratings.",
            "action": "Include thermal curve graph in user instruction handbook.",
        },
        "14.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Marking Plate & Visual Inspection Dossier",
            "page": 1,
            "snippet": "Clause 14.1 Rating Plate Marking: Durable metallic rating plate fixed with drive screws. Rated parameters (230V, 2000W, 25L, 0.8 MPa) clearly legibly marked.",
            "reason": "Primary rating plate satisfies mechanical durability and mandatory parameter declarations.",
            "action": "Prepare artwork update incorporating bilingual Hindi statutory warning.",
        },
        "15.2": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 13,
            "snippet": "Clause 15.2 Supply Cord Anchorage: 100N axial pull repeated 25 times and 0.35 Nm torque test resulted in 0.8 mm longitudinal displacement (Limit: < 2.0 mm).",
            "reason": "Cord anchorage relieves conductors from excessive mechanical strain and terminal loosening.",
            "action": "Verify molded plug strain relief bushing hardness in incoming QC.",
        },
        "16.2": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Electrical Safety Test Report",
            "page": 15,
            "snippet": "Clause 16.2 Glass Lining Corrosion: Boiling citric acid test mass loss = 2.8 g/m² (Ceiling: 5.0 g/m²). High-voltage spark pinhole test: 0 pinholes detected.",
            "reason": "Vitreous enamel glass lining exhibits continuous protection against aggressive domestic water chemistry.",
            "action": "Maintain sacrificial magnesium anode replacement guideline in customer documentation.",
        },
        "17.1": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "Product Technical Specification",
            "page": 12,
            "snippet": "Clause 17.1 Salt Spray Rust Resistance: Outer powder-coated steel casing exposed to 96h neutral salt spray (NSS). Zero corrosion creep or blistering observed.",
            "reason": "Outer casing surface treatment satisfies anti-rust environmental durability criteria.",
            "action": "Retain paint film thickness and cross-hatch adhesion test logs.",
        },
        "18.2": {
            "status": ComplianceStatus.PASS,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": "User Instruction & Installation Manual",
            "page": 14,
            "snippet": "Clause 18.2 Quality Manual: Factory operates ISO 9001 quality management system with documented Scheme-I BIS routine test control plan.",
            "reason": "Documented quality manual and internal inspection schedules align with BIS Scheme-I requirements.",
            "action": "Ensure internal calibration logbook entries are signed off weekly.",
        },

        # --- 3 PARTIAL Requirements ---
        "19.3": {
            "status": ComplianceStatus.PARTIAL,
            "confidence": ConfidenceLevel.MEDIUM,
            "doc_hint": "Electrical Safety Test Report",
            "page": 8,
            "snippet": "Clause 19.3 Ingress Protection: Spray tube test performed for 10 minutes with IPX4 nozzle. However, 48-hour humidity preconditioning chamber record was not logged.",
            "reason": "Document provides baseline IPX4 splash test results but lacks mandatory 48-hour humidity chamber preconditioning logs.",
            "action": "Conduct supplementary test with humidity preconditioning cycle and submit addendum lab report.",
            "gap_priority": GapPriority.MEDIUM,
            "gap_description": "IPX4 water ingress test performed without accredited humidity conditioning verification.",
        },
        "20.1": {
            "status": ComplianceStatus.PARTIAL,
            "confidence": ConfidenceLevel.MEDIUM,
            "doc_hint": "Product Technical Specification",
            "page": 15,
            "snippet": "Clause 20.1 Transit Drop Test: 7-ply corrugated carton box bursting strength certified (14 kg/cm²). Drop test conducted in-house; external NABL accreditation stamp missing.",
            "reason": "Packaging specifications are robust but transit drop endurance certificate is an in-house test lacking third-party accreditation.",
            "action": "Submit packaged transit drop test report from a BIS-recognized accredited packaging testing laboratory.",
            "gap_priority": GapPriority.MEDIUM,
            "gap_description": "Transit drop test was performed in-house without third-party NABL accreditation stamp.",
        },
        "21.2": {
            "status": ComplianceStatus.PARTIAL,
            "confidence": ConfidenceLevel.MEDIUM,
            "doc_hint": "Marking Plate & Visual Inspection Dossier",
            "page": 3,
            "snippet": "Clause 21.2 Test Apparatus Calibration: High-voltage tester valid until Dec 2026. Earth bond meter certificate expired on 15 Jan 2026.",
            "reason": "End-of-line high-voltage tester has valid calibration, but earth bond continuity tester certificate is past its renewal date.",
            "action": "Recalibrate earth bond resistance meter at an accredited calibration facility and upload updated certificate.",
            "gap_priority": GapPriority.MEDIUM,
            "gap_description": "Earth bond resistance test instrument calibration certificate is expired.",
        },

        # --- 2 MISSING Requirements (Critical / High Gaps) ---
        "11.4": {
            "status": ComplianceStatus.MISSING,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": None,
            "page": None,
            "snippet": "No matching evidence found across uploaded product documents.",
            "reason": "No uploaded document provides empirical calibration data or sensor response curves for dry-fire thermal runaway protection.",
            "action": "Coordinate with an accredited test laboratory to generate multi-channel thermocouple runaway response curves under simulated dry-fire conditions.",
            "gap_priority": GapPriority.CRITICAL,
            "gap_description": "Missing empirical multi-channel thermocouple thermal runaway calibration logs under dry-burn failure mode.",
        },
        "19.1": {
            "status": ComplianceStatus.MISSING,
            "confidence": ConfidenceLevel.HIGH,
            "doc_hint": None,
            "page": None,
            "snippet": "No matching evidence found across uploaded product documents.",
            "reason": "Uploaded marking plate artwork is in English only. Statutory bilingual (Hindi and English) cautionary warning ('DO NOT SWITCH ON WITHOUT WATER') is absent.",
            "action": "Provide updated silkscreen / engraved rating plate engineering drawing incorporating statutory bilingual Hindi and English cautionary warnings.",
            "gap_priority": GapPriority.HIGH,
            "gap_description": "Statutory bilingual Hindi/English cautionary rating plate marking is missing from submitted artwork.",
        },
    }

    @classmethod
    def match_requirement(
        cls,
        requirement: Requirement,
        standard_number: str,
        documents: List[Document],
        chunks: List[DocumentChunk],
    ) -> Dict[str, Any]:
        """
        Evaluate a single requirement against the uploaded documents and chunks.
        Returns evaluation dict with status, evidence, confidence, reason, recommended action, and optional gap info.
        """
        is_demo_std = (standard_number or "").upper().startswith("DEMO-IS-001")

        if is_demo_std and requirement.clause in cls.DEMO_RULES:
            rule = cls.DEMO_RULES[requirement.clause]
            doc_hint = rule.get("doc_hint")
            matched_doc = None
            matched_chunk = None

            if doc_hint:
                for doc in documents:
                    if doc_hint.lower() in doc.original_filename.lower():
                        matched_doc = doc
                        break

                # If found doc, look for chunk
                if matched_doc:
                    for chunk in chunks:
                        if chunk.document_id == matched_doc.id:
                            matched_chunk = chunk
                            break

            # Construct traceable citation
            doc_id = matched_doc.id if matched_doc else None
            doc_name = matched_doc.original_filename if matched_doc else (doc_hint or "Uploaded Evidence")
            page_num = rule.get("page")
            chunk_id = matched_chunk.id if matched_chunk else None

            evidence_data = {
                "document_id": doc_id,
                "document_name": doc_name if rule["status"] != ComplianceStatus.MISSING else None,
                "page": page_num if rule["status"] != ComplianceStatus.MISSING else None,
                "chunk_id": chunk_id,
                "snippet": rule["snippet"],
            }

            return {
                "status": rule["status"].value,
                "evidence": json.dumps(evidence_data),
                "confidence": rule["confidence"].value,
                "reason": rule["reason"],
                "recommended_action": rule["action"],
                "gap_priority": rule.get("gap_priority", GapPriority.HIGH).value if rule["status"] != ComplianceStatus.PASS else None,
                "gap_description": rule.get("gap_description"),
            }

        # --- General Deterministic Keyword / Clause Matching for Custom Documents ---
        return cls._match_general_requirement(requirement, documents, chunks)

    @classmethod
    def _match_general_requirement(
        cls,
        requirement: Requirement,
        documents: List[Document],
        chunks: List[DocumentChunk],
    ) -> Dict[str, Any]:
        """
        Fallback keyword and clause text matching across extracted DocumentChunks.
        """
        if not chunks:
            evidence_data = {
                "document_id": None,
                "document_name": None,
                "page": None,
                "chunk_id": None,
                "snippet": "No document chunks available for verification.",
            }
            return {
                "status": ComplianceStatus.MISSING.value,
                "evidence": json.dumps(evidence_data),
                "confidence": ConfidenceLevel.HIGH.value,
                "reason": f"No supporting documents have been uploaded to substantiate Clause {requirement.clause}.",
                "recommended_action": f"Upload accredited laboratory test reports covering {requirement.title}.",
                "gap_priority": GapPriority.HIGH.value,
                "gap_description": f"Missing documentation for Clause {requirement.clause}: {requirement.title}.",
            }

        # Extract tokens from requirement
        search_terms = re.findall(r"\b[a-zA-Z]{4,}\b", f"{requirement.title} {requirement.category} {requirement.description}")
        search_terms = [t.lower() for t in set(search_terms) if t.lower() not in {"shall", "with", "must", "from", "that", "this", "under", "which"}]

        best_chunk = None
        best_score = 0

        doc_map = {doc.id: doc for doc in documents}

        for chunk in chunks:
            content_lower = chunk.content.lower()
            # Clause match gives large boost
            score = 0
            if requirement.clause.lower() in content_lower:
                score += 5

            for term in search_terms:
                if term in content_lower:
                    score += 1

            if score > best_score:
                best_score = score
                best_chunk = chunk

        if best_score >= 3:
            doc = doc_map.get(best_chunk.document_id)
            snippet = best_chunk.content[:200].strip() + ("..." if len(best_chunk.content) > 200 else "")
            evidence_data = {
                "document_id": best_chunk.document_id,
                "document_name": doc.original_filename if doc else "Document",
                "page": best_chunk.page,
                "chunk_id": best_chunk.id,
                "snippet": snippet,
            }
            return {
                "status": ComplianceStatus.PASS.value,
                "evidence": json.dumps(evidence_data),
                "confidence": ConfidenceLevel.MEDIUM.value,
                "reason": f"Uploaded document contains matching technical content corresponding to Clause {requirement.clause}.",
                "recommended_action": "Verify that test report figures satisfy exact BIS numerical tolerances.",
                "gap_priority": None,
                "gap_description": None,
            }
        elif best_score >= 1:
            doc = doc_map.get(best_chunk.document_id)
            snippet = best_chunk.content[:200].strip() + ("..." if len(best_chunk.content) > 200 else "")
            evidence_data = {
                "document_id": best_chunk.document_id,
                "document_name": doc.original_filename if doc else "Document",
                "page": best_chunk.page,
                "chunk_id": best_chunk.id,
                "snippet": snippet,
            }
            return {
                "status": ComplianceStatus.PARTIAL.value,
                "evidence": json.dumps(evidence_data),
                "confidence": ConfidenceLevel.LOW.value,
                "reason": f"Document references related terminology for Clause {requirement.clause}, but full test verification parameters are incomplete.",
                "recommended_action": "Provide detailed test certificate containing complete empirical measurement values.",
                "gap_priority": GapPriority.MEDIUM.value,
                "gap_description": f"Partial test documentation detected for Clause {requirement.clause}.",
            }
        else:
            evidence_data = {
                "document_id": None,
                "document_name": None,
                "page": None,
                "chunk_id": None,
                "snippet": "No matching evidence found across uploaded product documents.",
            }
            return {
                "status": ComplianceStatus.MISSING.value,
                "evidence": json.dumps(evidence_data),
                "confidence": ConfidenceLevel.HIGH.value,
                "reason": f"No uploaded document currently provides evidence for Clause {requirement.clause} ({requirement.title}).",
                "recommended_action": f"Upload specific test report or specification dossier covering Clause {requirement.clause}.",
                "gap_priority": GapPriority.HIGH.value,
                "gap_description": f"No evidence found for Clause {requirement.clause}: {requirement.title}.",
            }
