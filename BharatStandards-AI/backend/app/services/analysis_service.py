"""
BharatStandards AI - Standards Analysis Service
Provides mock/synthetic standards discovery analysis.
Designed as a clean abstraction that will transition to StandardsRetrievalService and RAG in future steps.
"""
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.product import Product, ProductStatus


class MockProductAnalysisService:
    """
    Simulates domain-specific standards retrieval and clause mapping.
    Strictly labels all output as synthetic DEMO DATA.
    """

    @staticmethod
    def analyze(product: Product, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Executes structured mock analysis based on product category, name, and technical details.
        Integrates with the Standards Knowledge Base repository when db session is supplied.
        Returns a dictionary conforming to ProductAnalysisResponse.
        """
        if db:
            try:
                from app.services.standard_service import StandardService
                kb_matches = StandardService.find_potential_matches(db, product)
                if kb_matches:
                    standards = [
                        {
                            "standard_number": m["standard_number"],
                            "title": m["title"],
                            "relevance": m["relevance"],
                            "why_it_applies": m["reason"],
                            "source": m.get("source", "National Standards Repository (Synthetic Demo)"),
                            "is_demo": m.get("is_demo", True),
                        }
                        for m in kb_matches
                    ]
                    high_count = sum(1 for s in standards if s["relevance"] == "HIGH")
                    med_count = sum(1 for s in standards if s["relevance"] == "MEDIUM")
                    return {
                        "product_id": product.id,
                        "product_name": product.name,
                        "status": ProductStatus.READY.value,
                        "analyzed_at": datetime.now(timezone.utc).isoformat(),
                        "standards": standards,
                        "summary": (
                            f"Identified {len(standards)} potentially applicable Indian Standards ({high_count} Primary / High Relevance, "
                            f"{med_count} Secondary / Medium Relevance) for '{product.name}'."
                        ),
                        "disclaimer": (
                            "BharatStandards AI provides AI-assisted informational and compliance-readiness guidance. "
                            "It does not grant or represent official BIS certification. All standard codes shown with 'DEMO-' "
                            "prefix represent synthetic demonstration data for evaluation purposes."
                        ),
                    }
            except Exception:
                pass

        category = (product.category or "").strip().lower()
        name = (product.name or "").strip().lower()

        standards: List[Dict[str, Any]] = []

        if "heater" in name or "geyser" in name or "electrical" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-001",
                    "title": "Electric Water Heater Safety — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": (
                        "Demo analysis: the product characteristics appear potentially relevant to this synthetic standard "
                        "covering stationary storage type electrical water heaters up to 250V AC."
                    ),
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-002",
                    "title": "Household Electrical Appliances General Safety — Demo",
                    "relevance": "MEDIUM",
                    "why_it_applies": "Demo analysis based on product category: electrical mains-powered consumer appliances.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-003",
                    "title": "Thermal Insulation & Standing Heat Loss — Demo",
                    "relevance": "LOW",
                    "why_it_applies": "Applicable for energy efficiency evaluation of insulated storage vessels.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "electronic" in category or "it" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-101",
                    "title": "Information Technology Equipment Safety — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Potential relevance based on electronics classification and digital processing components.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-102",
                    "title": "Electromagnetic Compatibility (EMC) Emission Limits — Demo",
                    "relevance": "MEDIUM",
                    "why_it_applies": "Applies to high-frequency digital clock circuitry and RF suppression.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "mechanical" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-201",
                    "title": "Unfired Pressure Vessels & Fluid Containment — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Demo analysis based on pressure rating and mechanical casing integrity.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-202",
                    "title": "Industrial Safety Relief Valves & Gauges — Demo",
                    "relevance": "MEDIUM",
                    "why_it_applies": "Applicable for pressure relief specifications and calibration tolerances.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "construction" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-301",
                    "title": "Portland Pozzolana Cement & Structural Concrete — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Standard requirements for structural construction and load-bearing materials.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-302",
                    "title": "High-Strength Deformed Steel Bars — Demo",
                    "relevance": "MEDIUM",
                    "why_it_applies": "Material tensile strength and yield stress standards.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "food" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-401",
                    "title": "Packaged Drinking Water & Purity Specifications — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Mandatory safety, chemical residue, and microbiological benchmarks.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-402",
                    "title": "Food Grade Packaging & Migration Limits — Demo",
                    "relevance": "MEDIUM",
                    "why_it_applies": "Specific migration limits for polymers in contact with consumables.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "chemical" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-501",
                    "title": "Industrial Chemical Reagents & Purity Grades — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Chemical composition and stability testing standards.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "automotive" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-601",
                    "title": "Automotive Safety Components & Signaling — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Type-approval guidelines for road vehicle electrical and mechanical components.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "medical" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-701",
                    "title": "Medical Electrical Equipment General Safety — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Biocompatibility and patient electrical isolation standard.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        elif "textile" in category:
            standards = [
                {
                    "standard_number": "DEMO-IS-801",
                    "title": "Protective Clothing & Flame Retardant Textiles — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Tensile strength and flame resistance standards.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]
        else:
            standards = [
                {
                    "standard_number": "DEMO-IS-901",
                    "title": "General Consumer Product Safety & Quality Framework — Demo",
                    "relevance": "HIGH",
                    "why_it_applies": "Baseline quality and material safety benchmark for registered articles.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
                {
                    "standard_number": "DEMO-IS-902",
                    "title": "Product Labelling & Traceability Requirements — Demo",
                    "relevance": "MEDIUM",
                    "why_it_applies": "Bilingual marking, batch tracking, and manufacturer declaration guidelines.",
                    "source": "National Standards Repository (Synthetic Demo)",
                    "is_demo": True,
                },
            ]

        high_count = sum(1 for s in standards if s["relevance"] == "HIGH")
        med_count = sum(1 for s in standards if s["relevance"] == "MEDIUM")

        result = {
            "product_id": product.id,
            "product_name": product.name,
            "status": ProductStatus.READY.value,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
            "standards": standards,
            "summary": (
                f"Identified {len(standards)} potentially applicable Indian Standards ({high_count} Primary / High Relevance, "
                f"{med_count} Secondary / Medium Relevance) for '{product.name}'."
            ),
            "disclaimer": (
                "BharatStandards AI provides AI-assisted informational and compliance-readiness guidance. "
                "It does not grant or represent official BIS certification. All standard codes shown with 'DEMO-' "
                "prefix represent synthetic demonstration data for evaluation purposes."
            ),
        }
        return result
