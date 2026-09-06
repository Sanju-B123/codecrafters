"""
BharatStandards AI - Action Recommendation Service
Generates structured, executable UI action buttons linked strictly to valid platform routes.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class RecommendedAction(BaseModel):
    action_type: str  # VIEW_STANDARD, UPLOAD_DOCUMENT, RUN_COMPLIANCE_CHECK, etc.
    label: str
    route: str
    is_external: bool = False
    metadata: Dict[str, Any] = {}


class ActionRecommendationService:
    """
    Formulates concrete next-step action buttons based on query intent and retrieval context.
    Ensures all generated routes exist within the application.
    """

    @classmethod
    def generate_actions(
        cls,
        intent: str,
        retrieved_items: List[Dict[str, Any]],
        product_context: Optional[Dict[str, Any]] = None,
        compliance_context: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        actions: List[RecommendedAction] = []
        seen_routes = set()

        product_id = product_context.get("id") if product_context else None
        report_id = compliance_context.get("report_id") if compliance_context else None

        # 1. If compliance gaps are present, provide View Gaps and Upload Evidence
        if compliance_context and compliance_context.get("gaps"):
            if report_id:
                route = f"/reports/{report_id}"
                if route not in seen_routes:
                    actions.append(
                        RecommendedAction(
                            action_type="VIEW_GAPS",
                            label="View Compliance Gaps",
                            route=route,
                        )
                    )
                    seen_routes.add(route)

            upload_route = f"/documents?product_id={product_id}" if product_id else "/documents"
            if upload_route not in seen_routes:
                actions.append(
                    RecommendedAction(
                        action_type="UPLOAD_DOCUMENT",
                        label="Upload Test Evidence",
                        route=upload_route,
                    )
                )
                seen_routes.add(upload_route)

        # 1.1 Risk Intelligence Actions
        if intent in ("RISK_QUERY", "WHAT_IF_SIMULATION") or (compliance_context and compliance_context.get("overall_risk_score") is not None):
            if report_id:
                risk_route = f"/compliance/{report_id}"
                if risk_route not in seen_routes:
                    actions.append(
                        RecommendedAction(
                            action_type="VIEW_RISK_ANALYSIS",
                            label="View Risk Prioritization",
                            route=risk_route,
                        )
                    )
                    seen_routes.add(risk_route)
                whatif_route = f"/compliance/{report_id}"
                if f"{whatif_route}#what-if" not in seen_routes:
                    actions.append(
                        RecommendedAction(
                            action_type="SIMULATE_WHAT_IF",
                            label="Simulate What-If Scenarios",
                            route=whatif_route,
                        )
                    )
                    seen_routes.add(f"{whatif_route}#what-if")

        # 1b. Intent-driven contextual action formulation
        if intent == "DOCUMENT_QUERY":
            upload_route = f"/documents?product_id={product_id}" if product_id else "/documents"
            if upload_route not in seen_routes:
                actions.append(
                    RecommendedAction(
                        action_type="UPLOAD_DOCUMENT",
                        label="Upload Test Documents",
                        route=upload_route,
                    )
                )
                seen_routes.add(upload_route)
            comp_route = f"/compliance?product_id={product_id}" if product_id else "/compliance"
            if comp_route not in seen_routes:
                actions.append(
                    RecommendedAction(
                        action_type="RUN_COMPLIANCE_CHECK",
                        label="Run Compliance Assessment",
                        route=comp_route,
                    )
                )
                seen_routes.add(comp_route)
        elif intent == "GAP_EXPLANATION":
            gaps_route = f"/reports/{report_id}" if report_id else "/compliance"
            if gaps_route not in seen_routes:
                actions.append(
                    RecommendedAction(
                        action_type="VIEW_GAPS",
                        label="Review Compliance Gaps",
                        route=gaps_route,
                    )
                )
                seen_routes.add(gaps_route)
        elif intent == "SERVICE_GUIDANCE":
            if "/services" not in seen_routes:
                actions.append(
                    RecommendedAction(
                        action_type="VIEW_SERVICE",
                        label="Explore BIS Services",
                        route="/services",
                    )
                )
                seen_routes.add("/services")

        # 2. Standards / Requirements specific actions
        for item in retrieved_items:
            source_type = item.get("source_type")
            source_id = item.get("source_id") or item.get("id") or item.get("standard_id")

            if source_type in ("STANDARD", "REQUIREMENT") and source_id:
                route = f"/standards/{source_id}"
                if route not in seen_routes and len(actions) < 3:
                    title = item.get("title", "Standard")
                    std_label = f"View Standard: {item.get('standard_number') or title.split(':')[0]}"
                    actions.append(
                        RecommendedAction(
                            action_type="VIEW_STANDARD",
                            label=std_label[:35],
                            route=route,
                            metadata={"standard_id": source_id},
                        )
                    )
                    seen_routes.add(route)

            elif source_type == "SERVICE" and source_id:
                route = f"/services/{source_id}"
                if route not in seen_routes and len(actions) < 3:
                    actions.append(
                        RecommendedAction(
                            action_type="VIEW_SERVICE",
                            label="View BIS Service Details",
                            route=route,
                            metadata={"service_id": source_id},
                        )
                    )
                    seen_routes.add(route)

            elif source_type in ("DOCUMENT", "DOCUMENT_CHUNK") and item.get("document_id"):
                doc_id = item["document_id"]
                route = f"/documents/{doc_id}"
                if route not in seen_routes and len(actions) < 3:
                    actions.append(
                        RecommendedAction(
                            action_type="VIEW_DOCUMENT",
                            label=f"Inspect Document: {item.get('title', 'Report')[:25]}",
                            route=route,
                            metadata={"document_id": doc_id},
                        )
                    )
                    seen_routes.add(route)

        # 3. Compliance Assessment action
        if product_id and not report_id:
            route = f"/compliance?product_id={product_id}"
            if route not in seen_routes and len(actions) < 3:
                actions.append(
                    RecommendedAction(
                        action_type="RUN_COMPLIANCE_CHECK",
                        label="Run Compliance Assessment",
                        route=route,
                    )
                )
                seen_routes.add(route)

        # 4. Fallback default actions
        if not actions:
            actions.append(
                RecommendedAction(
                    action_type="VIEW_STANDARD",
                    label="Explore Standards Catalog",
                    route="/standards",
                )
            )
            actions.append(
                RecommendedAction(
                    action_type="UPLOAD_DOCUMENT",
                    label="Upload Test Documents",
                    route="/documents",
                )
            )

        return [a.model_dump() for a in actions[:3]]
