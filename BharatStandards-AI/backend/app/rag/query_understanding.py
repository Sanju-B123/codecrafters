"""
BharatStandards AI - Query Understanding Service
Deterministic query parsing, entity extraction (standards, clauses), intent classification,
and source routing flags without requiring an LLM for classification.
"""
import re
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session


class IntentCategory(str, Enum):
    STANDARD_SEARCH = "STANDARD_SEARCH"
    STANDARD_EXPLANATION = "STANDARD_EXPLANATION"
    REQUIREMENT_QUERY = "REQUIREMENT_QUERY"
    PRODUCT_COMPLIANCE = "PRODUCT_COMPLIANCE"
    DOCUMENT_QUERY = "DOCUMENT_QUERY"
    GAP_EXPLANATION = "GAP_EXPLANATION"
    SERVICE_GUIDANCE = "SERVICE_GUIDANCE"
    REPORT_EXPLANATION = "REPORT_EXPLANATION"
    GENERAL_BIS_GUIDANCE = "GENERAL_BIS_GUIDANCE"
    RISK_QUERY = "RISK_QUERY"
    WHAT_IF_SIMULATION = "WHAT_IF_SIMULATION"
    UNKNOWN = "UNKNOWN"


class QueryUnderstandingResult(BaseModel):
    intent: IntentCategory
    keywords: List[str]
    standard_number: Optional[str] = None
    clause: Optional[str] = None
    product_context: Optional[Dict[str, Any]] = None
    requires_document_search: bool = False
    requires_standard_search: bool = True
    requires_service_search: bool = False
    requires_compliance_search: bool = False
    requires_risk_analysis: bool = False
    confidence: float = 0.85


class QueryUnderstandingService:
    """
    Analyzes user queries deterministically.
    Extracts Indian Standard codes, clause references, meaningful keywords,
    and determines target retrieval sources.
    """

    STOP_WORDS = {
        "a", "an", "the", "in", "on", "at", "of", "for", "to", "is", "are",
        "and", "or", "what", "which", "how", "does", "my", "this", "that",
        "with", "by", "from", "be", "as", "can", "should", "do", "i", "we",
        "you", "it", "they", "me", "tell", "show", "give", "please", "about",
    }

    STANDARD_REGEX = re.compile(
        r"\b(?:DEMO-IS-\d+|IS\s*[:\-]?\s*\d+(?:\s*\([^\)]+\))?(?::\d{4})?)\b",
        re.IGNORECASE,
    )
    CLAUSE_REGEX = re.compile(
        r"\b(?:clause\s*)?(\d+\.\d+(?:\.\d+)?)\b",
        re.IGNORECASE,
    )

    PATTERNS: Dict[IntentCategory, List[str]] = {
        IntentCategory.DOCUMENT_QUERY: [
            r"\b(does\s+my|check\s+my|in\s+my|look\s+at)\b.*\b(report|document|pdf|test certificate|lab result|uploaded)\b",
            r"\b(evidence\s+in|mentioned\s+in|page\s+\d+|test\s+report)\b",
            r"\b(my\s+uploaded|uploaded\s+document|uploaded\s+report)\b",
            r"\bcontain\s+the\s+required\s+evidence\b",
        ],
        IntentCategory.GAP_EXPLANATION: [
            r"\bwhy\s+did\s+i\s+fail\b",
            r"\bwhy\s+did\s+my\s+assessment\s+fail\b",
            r"\bwhy\s+failed\b",
            r"\bexplain\b.*\bgap\b",
            r"\b(compliance\s+gap|missing\s+evidence\s+for|why\s+non-compliant)\b",
            r"\b(failed\s+clause|deficiency\s+in|open\s+gap)\b",
        ],
        IntentCategory.REPORT_EXPLANATION: [
            r"\b(explain|breakdown|understand)\b.*\b(audit|report|score|readiness\s+score)\b",
            r"\bcompliance\s+report\s+summary\b",
            r"\breadiness\s+percentage\b",
        ],
        IntentCategory.WHAT_IF_SIMULATION: [
            r"\bwhat\s+happens\s+if\s+i\s+(?:fix|resolve|address|complete|upload)\b",
            r"\bwhat\s+if\s+i\s+(?:fix|resolve|pass|test)\b",
            r"\b(?:what-if|simulate|simulation)\b",
            r"\bwhat\s+could\s+improve\s+(?:the\s+)?(?:readiness|score)\b",
            r"\bif\s+i\s+(?:fix|resolve)\b",
        ],
        IntentCategory.RISK_QUERY: [
            r"\b(top\s+(?:compliance\s+)?risks?|highest\s+risks?|compliance\s+risks?)\b",
            r"\b(what\s+are\s+my\s+(?:compliance\s+)?risks?|what\s+is\s+my\s+risk\s+score)\b",
            r"\bwhy\s+is\s+clause\s+.*\s+(?:marked\s+critical|critical|high\s+risk|risky)\b",
            r"\b(risk\s+priorit(?:y|ization)|how\s+serious\s+is|why\s+is\s+it\s+serious)\b",
            r"\b(risk\s+factors?|risk\s+breakdown)\b",
        ],
        IntentCategory.PRODUCT_COMPLIANCE: [
            r"\b(is\s+my\s+product|how\s+compliant|compliance\s+readiness|readiness\s+score)\b",
            r"\bwhat\s+am\s+i\s+missing\b",
            r"\b(missing\s+requirements?|open\s+gaps?|resolve\s+gaps?)\b",
            r"\bhow\s+to\s+achieve\s+compliance\b",
            r"\bwhat\s+evidence\s+is\s+missing\b",
        ],
        IntentCategory.SERVICE_GUIDANCE: [
            r"\b(what\s+should\s+i\s+do\s+next|next\s+steps?|what\s+to\s+do\s+next)\b",
            r"\b(how\s+(?:do\s+i|can\s+i|to)\s+apply|bis\s+scheme|scheme-i|scheme-ii|isi\s+mark|crs|hallmarking)\b",
            r"\b(manakonline|portal|registration\s+fee|surveillance|license\s+process|nabl\s+lab|testing\s+service|bis\s+service)\b",
            r"\bwhat\s+documents\s+may\s+i\s+need\s+next\b",
            r"\bhow\s+do\s+i\s+get\s+certified\b",
        ],
        IntentCategory.REQUIREMENT_QUERY: [
            r"\b(what\s+does|explain|clarify|detail|understand)\b.*\b(clause|requirement|parameter|test\s+method|limit)\b",
            r"\bclause\s*\d+(\.\d+)*\b",
            r"\b(insulation resistance|leakage current|hydrostatic|earthing|temperature rise|thermal cut-out)\b",
            r"\bwhat\s+evidence\s+is\s+required\b",
            r"\bverification\s+method\s+for\b",
        ],
        IntentCategory.STANDARD_EXPLANATION: [
            r"\b(explain|what\s+is|overview\s+of|summary\s+of)\b.*\b(standard|is\s*[:\-]?\s*\d+|specification)\b",
            r"\bscope\s+of\b.*\b(is\s*[:\-]?\s*\d+|demo-is-\d+|standard)\b",
            r"\bwhat\s+does\b.*\b(is\s*[:\-]?\s*[\d\-]+|demo-is-\d+|standard)\b.*\bcover\b",
        ],
        IntentCategory.STANDARD_SEARCH: [
            r"\b(which|what|find|recommend|search)\b.*\b(standard|standards|is\s*\d+|applicable|applies|mandatory|specification)\b",
            r"\bstandard\s*(for|applies\s*to|governs)\b",
            r"\bwhich\s+standards\s+may\s+apply\b",
        ],
        IntentCategory.GENERAL_BIS_GUIDANCE: [
            r"\b(bis\s+act|qco|quality\s+control\s+order|gazette|mandatory\s+certification|foreign\s+manufacturers|fmcs)\b",
            r"\bwhat\s+is\s+bis\b",
            r"\bwhat\s+does\s+this\s+bis\s+term\s+mean\b",
        ],
    }

    @classmethod
    def extract_keywords(cls, query: str) -> List[str]:
        """Extract alphanumeric tokens excluding common stopwords."""
        tokens = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", query.lower())
        return [t for t in tokens if t not in cls.STOP_WORDS]

    @classmethod
    def extract_standard_number(cls, query: str) -> Optional[str]:
        """Find explicit Indian Standard or Demo code mentions."""
        match = cls.STANDARD_REGEX.search(query)
        if match:
            raw = match.group(0).strip()
            # Normalize whitespace e.g. "is 16046" -> "IS 16046"
            if raw.lower().startswith("is"):
                parts = raw.split(":", 1)
                code_part = re.sub(r"^is\s*", "IS ", parts[0], flags=re.IGNORECASE)
                if len(parts) > 1:
                    return f"{code_part}:{parts[1]}"
                return code_part
            return raw.upper()
        return None

    @classmethod
    def extract_clause(cls, query: str) -> Optional[str]:
        """Find explicit clause numbers like 'Clause 4.2' or '8.4'."""
        match = cls.CLAUSE_REGEX.search(query)
        if match:
            return match.group(1)
        return None

    @classmethod
    def classify_intent(cls, query: str) -> IntentCategory:
        """Deterministically map user query to an IntentCategory."""
        cleaned = query.strip().lower()

        # Check for adversarial prompt injection or exfiltration first
        adversarial_patterns = [
            r"\b(system\s+prompt|raw\s+prompt|reveal\s+.*instruction|override\s+.*rule|secret\s+key|api[_\s]?key|jailbreak|developer\s+mode|ignore\s+all)\b"
        ]
        for pat in adversarial_patterns:
            if re.search(pat, cleaned, re.IGNORECASE):
                return IntentCategory.UNKNOWN

        # Check in priority order
        for intent, patterns in cls.PATTERNS.items():
            for pat in patterns:
                if re.search(pat, cleaned, re.IGNORECASE):
                    return intent

        # If it has standard number or clause mention, classify as search/query
        if cls.STANDARD_REGEX.search(query):
            if cls.CLAUSE_REGEX.search(query):
                return IntentCategory.REQUIREMENT_QUERY
            return IntentCategory.STANDARD_SEARCH

        if cls.CLAUSE_REGEX.search(query):
            return IntentCategory.REQUIREMENT_QUERY

        # Unknown or generic query
        tokens = cls.extract_keywords(query)
        if len(tokens) <= 1:
            return IntentCategory.UNKNOWN

        # Check domain relevance to Indian standards, compliance, or manufacturing
        DOMAIN_TERMS = {
            "bis", "standard", "standards", "isi", "certification", "compliance",
            "clause", "requirement", "qco", "license", "hallmark", "scheme",
            "manakonline", "test", "testing", "product", "quality", "laboratory",
            "report", "norm", "regulation", "statutory", "act", "audit", "gap",
            "defect", "inspection", "safety", "spec", "specification", "appliance",
            "apparatus", "equipment", "heater", "steel", "battery", "panel", "cable",
            "water", "electric", "insulation", "voltage", "current", "pressure",
        }
        has_domain_term = any(t in DOMAIN_TERMS for t in tokens)
        if not has_domain_term:
            return IntentCategory.UNKNOWN

        return IntentCategory.GENERAL_BIS_GUIDANCE

    @classmethod
    def understand_query(
        cls,
        question: str,
        user_id: Optional[int] = None,
        product_id: Optional[int] = None,
        compliance_report_id: Optional[int] = None,
        conversation_id: Optional[int] = None,
        db: Optional[Session] = None,
    ) -> QueryUnderstandingResult:
        """
        Main query understanding entry point.
        Produces structured result with routing flags.
        """
        intent = cls.classify_intent(question)
        keywords = cls.extract_keywords(question)
        standard_number = cls.extract_standard_number(question)
        clause = cls.extract_clause(question)

        # Context lookup if product_id provided and db available
        product_context = None
        if product_id and db and user_id:
            from app.models.product import Product
            prod = (
                db.query(Product)
                .filter(Product.id == product_id, Product.user_id == user_id)
                .first()
            )
            if prod:
                product_context = {
                    "id": prod.id,
                    "name": prod.name,
                    "category": prod.category,
                    "manufacturer": prod.manufacturer,
                    "model_number": prod.model_number,
                }

        # Set search routing flags
        requires_document_search = False
        requires_standard_search = True
        requires_service_search = False
        requires_compliance_search = False
        requires_risk_analysis = False

        if intent in (IntentCategory.DOCUMENT_QUERY, IntentCategory.PRODUCT_COMPLIANCE, IntentCategory.GAP_EXPLANATION):
            requires_document_search = True

        if intent in (
            IntentCategory.PRODUCT_COMPLIANCE,
            IntentCategory.GAP_EXPLANATION,
            IntentCategory.REPORT_EXPLANATION,
            IntentCategory.RISK_QUERY,
            IntentCategory.WHAT_IF_SIMULATION,
        ):
            requires_compliance_search = True

        if intent in (IntentCategory.RISK_QUERY, IntentCategory.WHAT_IF_SIMULATION):
            requires_risk_analysis = True

        if intent in (IntentCategory.SERVICE_GUIDANCE, IntentCategory.GENERAL_BIS_GUIDANCE):
            requires_service_search = True

        if intent == IntentCategory.DOCUMENT_QUERY and not standard_number and not clause:
            # Focused document inquiry
            requires_standard_search = False

        return QueryUnderstandingResult(
            intent=intent,
            keywords=keywords,
            standard_number=standard_number,
            clause=clause,
            product_context=product_context,
            requires_document_search=requires_document_search,
            requires_standard_search=requires_standard_search,
            requires_service_search=requires_service_search,
            requires_compliance_search=requires_compliance_search,
            requires_risk_analysis=requires_risk_analysis,
            confidence=0.90 if intent != IntentCategory.UNKNOWN else 0.40,
        )
