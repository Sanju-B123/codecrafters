"""
BharatStandards AI - Confidence Service
Calculates empirical application-level confidence grades (HIGH, MEDIUM, LOW)
based on retrieval score, source authority, supporting evidence count, and query completeness.
"""
from typing import Any, Dict, List, Tuple


class ConfidenceService:
    """
    Evaluates evidence sufficiency deterministically.
    Never misrepresents heuristic application confidence as 'model certainty'.
    """

    @classmethod
    def calculate_confidence(
        cls,
        retrieved_items: List[Dict[str, Any]],
        intent: str = "GENERAL_BIS_GUIDANCE",
        query_terms_count: int = 3,
    ) -> Tuple[str, str, str]:
        """
        Returns (confidence_level, explanation, user_guidance).
        Confidence levels: HIGH, MEDIUM, LOW.
        """
        if not retrieved_items:
            return (
                "LOW",
                "No matching standards, clauses, or uploaded test reports found in the knowledge base.",
                "Low confidence — the available sources do not provide enough evidence. Try asking a more specific question or check available standards.",
            )

        top_score = max((float(item.get("relevance_score", 0.0)) for item in retrieved_items), default=0.0)
        source_count = len(retrieved_items)

        # Count authoritative sources
        verified_count = sum(
            1 for item in retrieved_items
            if item.get("verification_status") == "VERIFIED" or item.get("provenance_type") == "OFFICIAL"
        )
        has_exact_clause = any(item.get("clause") for item in retrieved_items)
        has_user_doc = any(item.get("source_type") in ("DOCUMENT", "DOCUMENT_CHUNK") for item in retrieved_items)

        # High confidence criteria:
        # Strong match (>= 0.75), at least one verified official standard or direct user document evidence,
        # and multiple supporting points or exact clause match.
        if top_score >= 0.75 and (verified_count > 0 or has_user_doc) and (source_count >= 2 or has_exact_clause):
            return (
                "HIGH",
                "Strong supporting evidence found from authoritative Indian Standards or verified test documents.",
                "Strong supporting evidence found.",
            )

        # Medium confidence criteria:
        # Moderate match (>= 0.45) with relevant requirements or guidance
        if top_score >= 0.45 and intent != "UNKNOWN":
            return (
                "MEDIUM",
                "Relevant requirements or standards identified, but specific laboratory limits or product documents require manual verification.",
                "Some supporting evidence found. Review the cited clauses to ensure full applicability.",
            )

        # Low confidence fallback:
        return (
            "LOW",
            "Available evidence is limited or tangential to the specific inquiry.",
            "Low confidence — the available sources do not provide enough evidence. Try asking a more specific question or view available sources.",
        )
