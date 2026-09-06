"""
BharatStandards AI - Re-ranking Service
Re-scores and prioritizes retrieved candidate items from Standards, Requirements,
and Document Chunks to select the most authoritative and query-relevant context.
Enforces the strict hierarchy: Verified Official > Active Knowledge > Demo Data.
"""
import re
from typing import Any, Dict, List, Optional


class Reranker:
    """
    Multi-factor deterministic re-ranking service.
    Combines lexical term frequency, exact clause matches, standard matches,
    source authority multipliers, and provenance verification.
    """

    PROVENANCE_WEIGHTS = {
        "OFFICIAL": 1.25,
        "VERIFIED": 1.25,
        "USER_PROVIDED": 1.05,
        "USER_ASSESSMENT": 1.05,
        "DEMO": 0.88,
    }

    AUTHORITY_TYPE_WEIGHTS = {
        "STANDARD": 1.05,
        "REQUIREMENT": 1.10,
        "DOCUMENT_CHUNK": 1.00,
        "DOCUMENT": 0.95,
        "SERVICE": 1.00,
    }

    @classmethod
    def rerank(
        cls,
        query: str,
        candidates: List[Dict[str, Any]],
        limit: int = 8,
        product_context: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Rerank candidate items and return top `limit` items.
        """
        if not candidates:
            return []

        query_lower = query.lower()
        query_terms = [t for t in re.findall(r"\w+", query_lower) if len(t) > 2]

        # Extract potential clause e.g. "4.1" or "8.4"
        clause_match = re.search(r"\b(?:clause\s*)?(\d+\.\d+(?:\.\d+)?)\b", query_lower)
        target_clause = clause_match.group(1) if clause_match else None

        # Extract potential standard number
        std_match = re.search(r"\b(DEMO-IS-\d+|IS\s*[:\-]?\s*\d+)\b", query_lower)
        target_std = std_match.group(1).replace(" ", "") if std_match else None

        scored_items = []
        for item in candidates:
            base_score = float(item.get("relevance_score", 0.5))
            source_type = item.get("source_type", "DOCUMENT_CHUNK")
            prov_type = item.get("provenance_type") or ("DEMO" if item.get("is_demo") else "OFFICIAL")

            # 1. Authority and Provenance Multipliers
            type_mult = cls.AUTHORITY_TYPE_WEIGHTS.get(source_type, 1.0)
            prov_mult = cls.PROVENANCE_WEIGHTS.get(prov_type, 1.0)

            # Verified official boost
            if item.get("verification_status") == "VERIFIED":
                prov_mult = max(prov_mult, 1.25)
            elif item.get("is_demo"):
                prov_mult = min(prov_mult, 0.88)

            # 2. Clause Alignment Bonus
            clause_bonus = 0.0
            if target_clause and item.get("clause"):
                item_clause = str(item["clause"]).strip()
                if item_clause == target_clause:
                    clause_bonus = 0.35
                elif target_clause in item_clause:
                    clause_bonus = 0.18

            # 3. Standard Alignment Bonus
            std_bonus = 0.0
            if target_std and item.get("standard_number"):
                curr_std = str(item["standard_number"]).replace(" ", "").lower()
                if target_std.lower() in curr_std:
                    std_bonus = 0.25

            # 4. Product Relevance Bonus
            product_bonus = 0.0
            if product_context:
                prod_name = product_context.get("name", "").lower()
                prod_cat = product_context.get("category", "").lower()
                item_text = f"{item.get('title', '')} {item.get('snippet', '')}".lower()
                if prod_cat and prod_cat in item_text:
                    product_bonus = 0.15
                elif prod_name and any(term in item_text for term in prod_name.split() if len(term) > 3):
                    product_bonus = 0.10

            # 5. Token Overlap Bonus
            text_to_check = f"{item.get('title', '')} {item.get('snippet', '')} {item.get('clause', '')}".lower()
            term_matches = sum(1 for term in query_terms if term in text_to_check)
            term_overlap_bonus = min(0.20, term_matches * 0.04)

            # Compute combined score
            calculated_score = (base_score * type_mult * prov_mult) + clause_bonus + std_bonus + product_bonus + term_overlap_bonus
            final_score = max(0.10, min(0.99, round(calculated_score, 3)))

            scored_item = dict(item)
            scored_item["relevance_score"] = final_score
            scored_items.append(scored_item)

        # Sort descending by relevance score
        scored_items.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_items[:limit]


# Alias for explicit service naming
RerankingService = Reranker
