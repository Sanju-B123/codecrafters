"""
BharatStandards AI - Query Classifier
Lightweight, deterministic query intent classifier for routing and prompt prioritization.
"""
import re
from enum import Enum
from typing import Dict, Any


class QueryType(str, Enum):
    STANDARD_DISCOVERY = "STANDARD_DISCOVERY"
    REQUIREMENT_EXPLANATION = "REQUIREMENT_EXPLANATION"
    DOCUMENT_QUESTION = "DOCUMENT_QUESTION"
    COMPLIANCE_QUESTION = "COMPLIANCE_QUESTION"
    BIS_SERVICE_GUIDANCE = "BIS_SERVICE_GUIDANCE"
    GENERAL = "GENERAL"


class QueryClassifier:
    """
    Deterministic rule-based intent classifier.
    Easily replaceable with an ML/LLM classifier in future iterations.
    """

    PATTERNS = {
        QueryType.STANDARD_DISCOVERY: [
            r"\b(which|what|find|recommend|search)\b.*\b(standard|standards|is\s*\d+|applicable|applies|mandatory|specification)\b",
            r"\bstandard\s*(for|applies\s*to|governs)\b",
            r"\bis\s*[:\-]?\s*\d+",
            r"\bdemo-is-\d+",
        ],
        QueryType.REQUIREMENT_EXPLANATION: [
            r"\b(what\s+does|explain|clarify|detail|understand)\b.*\b(clause|requirement|section|subclause|parameter|safety test)\b",
            r"\bclause\s*\d+(\.\d+)*\b",
            r"\b(insulation resistance|leakage current|hydrostatic|earthing|temperature rise|thermal cut-out)\b",
            r"\bwhat evidence is required\b",
        ],
        QueryType.DOCUMENT_QUESTION: [
            r"\b(does\s+my|check\s+my|in\s+my|look\s+at)\b.*\b(report|document|pdf|test certificate|lab result|uploaded)\b",
            r"\b(evidence\s+in|mentioned\s+in|page\s+\d+|test\s+report)\b",
            r"\b(my\s+uploaded|uploaded\s+document)\b",
        ],
        QueryType.COMPLIANCE_QUESTION: [
            r"\b(what\s+am\s+i\s+missing|missing\s+requirements?|open\s+gaps?|compliance\s+status|readiness\s+score)\b",
            r"\b(how\s+compliant|audit\s+result|pass\s+or\s+fail|non-conformance|resolve\s+gaps?)\b",
            r"\bwhat\s+should\s+i\s+do\s+next\b",
        ],
        QueryType.BIS_SERVICE_GUIDANCE: [
            r"\b(how\s+to\s+apply|bis\s+scheme|scheme-i|scheme-ii|isi\s+mark|crs|hallmarking)\b",
            r"\b(manakonline|portal|registration\s+fee|surveillance|license\s+process|nabl\s+lab)\b",
        ],
    }

    @classmethod
    def classify(cls, query: str) -> Dict[str, Any]:
        """
        Classifies a user query string into a QueryType with matching confidence.
        """
        cleaned = query.strip().lower()

        # Check in priority order
        for q_type, patterns in cls.PATTERNS.items():
            for pat in patterns:
                if re.search(pat, cleaned, re.IGNORECASE):
                    return {
                        "category": q_type.value,
                        "matched_pattern": pat,
                        "confidence": 0.85,
                    }

        return {
            "category": QueryType.GENERAL.value,
            "matched_pattern": "default_fallback",
            "confidence": 0.50,
        }
