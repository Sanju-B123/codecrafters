"""
BharatStandards AI - Citation & Confidence Builder
Constructs traceable citation sources, calculates evidence-grounded confidence scores,
and generates clickable route links for Standards, Requirements, Documents, and Reports.
"""
from typing import Any, Dict, List, Tuple
from app.rag.confidence_service import ConfidenceService


class CitationBuilder:
    """
    Validates, deduplicates, and formats evidence sources into traceable citations
    with real clickable frontend routes.
    """

    @classmethod
    def build_citations(cls, retrieved_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Format retrieved items into clean AssistantSource citation records with real routes.
        """
        citations = []
        seen_keys = set()

        for item in retrieved_items:
            key = (item.get("source_type"), str(item.get("source_id")), str(item.get("clause")))
            if key in seen_keys:
                continue
            seen_keys.add(key)

            source_type = item.get("source_type", "STANDARD")
            source_id = str(item.get("source_id") or "")
            title = item.get("title", "Reference Standard")
            snippet = item.get("snippet", "").strip()
            if len(snippet) > 280:
                snippet = snippet[:277] + "..."

            # Generate clickable application target route
            target_route = None
            if source_type in ("STANDARD", "REQUIREMENT"):
                std_id = item.get("standard_id") or source_id
                target_route = f"/standards/{std_id}"
                if item.get("clause"):
                    target_route += f"#clause-{item['clause']}"
            elif source_type in ("DOCUMENT", "DOCUMENT_CHUNK"):
                doc_id = item.get("document_id") or source_id
                target_route = f"/documents/{doc_id}"
            elif source_type == "SERVICE":
                target_route = f"/services/{source_id}"
            elif item.get("report_id"):
                target_route = f"/reports/{item['report_id']}"

            # Format human-readable citation label
            citation_label = title
            is_demo = bool(item.get("is_demo", True))
            prov_type = item.get("provenance_type", "DEMO" if is_demo else "OFFICIAL")
            verification = item.get("verification_status", "UNVERIFIED")

            if source_type in ("STANDARD", "REQUIREMENT"):
                if prov_type == "OFFICIAL" and verification == "VERIFIED":
                    badge = "[Official BIS Standard: Verified]"
                elif is_demo:
                    badge = "[Demo / Synthetic Standard]"
                else:
                    badge = "[User-Provided Standard]"
                citation_label = f"{badge} {title}"
            elif source_type in ("DOCUMENT", "DOCUMENT_CHUNK"):
                page_info = f" (Page {item['page']})" if item.get("page") else ""
                citation_label = f"[User Document]{page_info} {title}"

            citations.append({
                "source_type": source_type,
                "source_id": source_id,
                "title": title,
                "citation_label": citation_label,
                "target_route": target_route,
                "page": item.get("page"),
                "clause": item.get("clause"),
                "snippet": snippet,
                "relevance_score": float(item.get("relevance_score", 0.5)),
                "is_demo": is_demo,
                "provenance_type": prov_type,
                "verification_status": verification,
                "authority_level": item.get("authority_level", "MEDIUM"),
                "version": item.get("version", "2026"),
                "source_provenance": item.get("source_provenance") or ("Official / Verified" if (prov_type == "OFFICIAL" and verification == "VERIFIED") else ("Demo / Synthetic Data" if is_demo else "User Uploaded Document")),
                "document_id": item.get("document_id"),
                "report_id": item.get("report_id"),
            })

        # Sort by relevance
        citations.sort(key=lambda x: x["relevance_score"], reverse=True)
        return citations

    @classmethod
    def evaluate_confidence(
        cls, retrieved_items: List[Dict[str, Any]], query_category: str = "GENERAL_BIS_GUIDANCE"
    ) -> Tuple[str, str]:
        """
        Evaluates retrieval quality and returns (confidence_level, confidence_reason).
        Delegates to ConfidenceService.
        """
        level, reason, _ = ConfidenceService.calculate_confidence(retrieved_items, intent=query_category)
        return level, reason

    @classmethod
    def formulate_recommended_actions(
        cls,
        retrieved_items: List[Dict[str, Any]],
        compliance_context: Dict[str, Any] = None,
    ) -> List[str]:
        """
        Extracts concrete actionable next steps for the user based on identified gaps or missing tests.
        """
        actions = []

        # If compliance context has open gaps, prioritize them
        if compliance_context and compliance_context.get("gaps"):
            for gap in compliance_context["gaps"][:3]:
                rec = gap.get("recommended_action")
                if rec and rec not in actions:
                    actions.append(rec)

        # Fallback to requirements or standard suggestions
        if not actions:
            for item in retrieved_items:
                if item.get("source_type") == "REQUIREMENT" and item.get("clause"):
                    clause = item["clause"]
                    actions.append(
                        f"Verify laboratory test records against IS Clause {clause} verification limits."
                    )
                if len(actions) >= 3:
                    break

        if not actions:
            actions = [
                "Upload product technical specifications and NABL test reports to check compliance readiness.",
                "Review applicable Indian Standards in the Knowledge Base directory.",
            ]

        return actions[:4]
