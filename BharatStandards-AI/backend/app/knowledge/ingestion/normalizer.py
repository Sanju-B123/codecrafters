"""
BharatStandards AI - Knowledge Normalizer
Performs deterministic whitespace, casing, and standard number normalization
without paraphrasing or altering the legal/technical meaning of standards text.
"""
import re
from typing import Any, Dict, List, Optional
from app.knowledge.ingestion.source_loader import IngestionPayload


class KnowledgeNormalizer:
    """
    Standardizes formatting of numbers, clause notation, and metadata
    while preserving verbatim legal requirement text.
    """

    @classmethod
    def _clean_whitespace(cls, text: Optional[str]) -> Optional[str]:
        if text is None:
            return None
        # Collapse multiple internal spaces and newlines, strip ends
        return " ".join(text.split())

    @classmethod
    def _normalize_standard_number(cls, code: str) -> str:
        """
        Normalizes standard numbers (e.g. 'is 13252 : 2010' -> 'IS 13252:2010').
        """
        s = cls._clean_whitespace(code) or ""
        # Uppercase 'is' prefix
        s = re.sub(r"^(?i:is)\s*", "IS ", s)
        # Normalize colon spacing
        s = re.sub(r"\s*:\s*", ":", s)
        return s.strip()

    @classmethod
    def _normalize_clause(cls, clause: str) -> str:
        """
        Normalizes clause numbers (e.g. 'clause  4.2.1' -> '4.2.1').
        """
        s = cls._clean_whitespace(clause) or ""
        s = re.sub(r"^(?i:clause|cl\.)\s*", "", s)
        return s.strip()

    @classmethod
    def normalize_standard(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        norm = dict(raw)
        if norm.get("standard_number"):
            norm["standard_number"] = cls._normalize_standard_number(norm["standard_number"])
        if norm.get("title"):
            norm["title"] = cls._clean_whitespace(norm["title"])
        if norm.get("category"):
            norm["category"] = cls._clean_whitespace(norm["category"]).upper()
        if norm.get("scope"):
            norm["scope"] = cls._clean_whitespace(norm["scope"])
        if norm.get("description"):
            norm["description"] = cls._clean_whitespace(norm["description"])
        if norm.get("version"):
            norm["version"] = cls._clean_whitespace(norm["version"]).upper()
        if norm.get("status"):
            norm["status"] = cls._clean_whitespace(norm["status"]).upper()
        if norm.get("source"):
            norm["source"] = cls._clean_whitespace(norm["source"])
        if norm.get("source_url"):
            norm["source_url"] = norm["source_url"].strip().rstrip("/")
        return norm

    @classmethod
    def normalize_requirement(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        norm = dict(raw)
        if norm.get("clause"):
            norm["clause"] = cls._normalize_clause(norm["clause"])
        if norm.get("title"):
            norm["title"] = cls._clean_whitespace(norm["title"])
        # Verbatim requirement description: only strip trailing whitespace, DO NOT paraphrase or alter words!
        if norm.get("description"):
            norm["description"] = cls._clean_whitespace(norm["description"])
        if norm.get("category"):
            norm["category"] = cls._clean_whitespace(norm["category"]).upper()
        if norm.get("priority"):
            p = cls._clean_whitespace(norm["priority"]).upper()
            if p in ("MANDATORY", "CRITICAL"):
                norm["priority"] = "CRITICAL"
            elif p in ("OPTIONAL", "LOW"):
                norm["priority"] = "LOW"
            else:
                norm["priority"] = p
        if norm.get("verification_method"):
            norm["verification_method"] = cls._clean_whitespace(norm["verification_method"])
        if norm.get("evidence_required"):
            norm["evidence_required"] = cls._clean_whitespace(norm["evidence_required"])
        if norm.get("_standard_ref"):
            norm["_standard_ref"] = cls._normalize_standard_number(norm["_standard_ref"])
        return norm

    @classmethod
    def normalize_payload(cls, payload: IngestionPayload) -> IngestionPayload:
        """
        Normalizes all standards, clauses, and source records in the payload.
        """
        norm_standards = [cls.normalize_standard(s) for s in payload.standards]
        norm_requirements = [cls.normalize_requirement(r) for r in payload.requirements]

        norm_meta = dict(payload.source_metadata or {})
        if norm_meta.get("name"):
            norm_meta["name"] = cls._clean_whitespace(norm_meta["name"])
        if norm_meta.get("url"):
            norm_meta["url"] = norm_meta["url"].strip().rstrip("/")
        if norm_meta.get("source_type"):
            norm_meta["source_type"] = cls._clean_whitespace(norm_meta["source_type"]).upper()

        return IngestionPayload(
            source_metadata=norm_meta,
            standards=norm_standards,
            requirements=norm_requirements,
            raw_record_count=payload.raw_record_count,
            format_type=payload.format_type,
        )
