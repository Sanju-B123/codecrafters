"""
BharatStandards AI - Knowledge Validator
Performs strict schema, enum, URL, constraint, and relationship validation
returning row-level error diagnostic reports.
"""
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse
from pydantic import BaseModel
from app.models.standard import StandardStatus, RequirementCategory, RequirementPriority
from app.models.knowledge import KnowledgeSourceType, KnowledgeAuthorityLevel
from app.knowledge.ingestion.source_loader import IngestionPayload


class ValidationErrorItem(BaseModel):
    record_type: str  # 'source', 'standard', 'requirement'
    index_or_row: str
    identifier: Optional[str] = None
    field: str
    error: str


class ValidationResult(BaseModel):
    is_valid: bool
    total_records: int
    valid_records: int
    invalid_records: int
    errors: List[ValidationErrorItem] = []


class KnowledgeValidator:
    """
    Validates standards, clauses, and source records against business invariants.
    """

    ALLOWED_STANDARD_STATUSES = {s.value for s in StandardStatus}
    ALLOWED_REQUIREMENT_PRIORITIES = {p.value for p in RequirementPriority} | {"MANDATORY", "RECOMMENDED", "OPTIONAL"}
    ALLOWED_REQUIREMENT_CATEGORIES = {c.value for c in RequirementCategory}
    ALLOWED_SOURCE_TYPES = {st.value for st in KnowledgeSourceType}
    ALLOWED_AUTHORITY_LEVELS = {al.value for al in KnowledgeAuthorityLevel}

    @classmethod
    def _is_valid_url(cls, url: Optional[str]) -> bool:
        if not url:
            return True
        try:
            parsed = urlparse(url.strip())
            return parsed.scheme in ("http", "https") and bool(parsed.netloc)
        except Exception:
            return False

    @classmethod
    def validate(cls, payload: IngestionPayload) -> ValidationResult:
        errors: List[ValidationErrorItem] = []
        valid_standards_count = 0
        valid_requirements_count = 0

        # Track payload-level keys for internal duplicate detection
        seen_standards: Set[Tuple[str, str]] = set()  # (number, version)
        seen_clauses: Set[Tuple[str, str]] = set()  # (std_number, clause)
        known_standard_numbers: Set[str] = set()

        # 1. Validate Source Metadata (if present)
        sources_to_check = []
        if payload.source_metadata and isinstance(payload.source_metadata, dict):
            sources_to_check.append(payload.source_metadata)
        if hasattr(payload, "sources") and payload.sources:
            sources_to_check.extend(payload.sources)

        for src in sources_to_check:
            src_type = src.get("source_type")
            if src_type and src_type.upper() not in cls.ALLOWED_SOURCE_TYPES:
                errors.append(
                    ValidationErrorItem(
                        record_type="source",
                        index_or_row="SourceMeta",
                        identifier=src.get("name"),
                        field="source_type",
                        error=f"Invalid source_type '{src_type}'. Must be one of {sorted(cls.ALLOWED_SOURCE_TYPES)}",
                    )
                )
            src_url = src.get("url")
            if src_url and not cls._is_valid_url(src_url):
                errors.append(
                    ValidationErrorItem(
                        record_type="source",
                        index_or_row="SourceMeta",
                        identifier=src.get("name"),
                        field="url",
                        error=f"Malformed URL '{src_url}'. Must begin with http:// or https://",
                    )
                )

        # 2. Validate Standards
        for std in payload.standards:
            idx = str(std.get("_source_index", "?"))
            std_num = (std.get("standard_number") or "").strip()
            title = (std.get("title") or "").strip()
            version = (std.get("version") or "2026").strip()
            status = (std.get("status") or "DRAFT").strip().upper()
            url = std.get("source_url")

            std_has_errors = False

            if not std_num:
                errors.append(
                    ValidationErrorItem(
                        record_type="standard",
                        index_or_row=idx,
                        identifier=None,
                        field="standard_number",
                        error="Field 'standard_number' is required and cannot be empty.",
                    )
                )
                std_has_errors = True

            if not title:
                errors.append(
                    ValidationErrorItem(
                        record_type="standard",
                        index_or_row=idx,
                        identifier=std_num,
                        field="title",
                        error="Field 'title' is required and cannot be empty.",
                    )
                )
                std_has_errors = True

            if status not in cls.ALLOWED_STANDARD_STATUSES:
                errors.append(
                    ValidationErrorItem(
                        record_type="standard",
                        index_or_row=idx,
                        identifier=std_num,
                        field="status",
                        error=f"Invalid status '{status}'. Must be one of {sorted(cls.ALLOWED_STANDARD_STATUSES)}",
                    )
                )
                std_has_errors = True

            if url and not cls._is_valid_url(url):
                errors.append(
                    ValidationErrorItem(
                        record_type="standard",
                        index_or_row=idx,
                        identifier=std_num,
                        field="source_url",
                        error=f"Invalid URL '{url}'",
                    )
                )
                std_has_errors = True

            # Duplicate standard check within payload
            if std_num:
                std_key = (std_num.upper(), version)
                if std_key in seen_standards:
                    errors.append(
                        ValidationErrorItem(
                            record_type="standard",
                            index_or_row=idx,
                            identifier=std_num,
                            field="standard_number",
                            error=f"Duplicate standard '{std_num}' (version '{version}') detected within the same import bundle.",
                        )
                    )
                    std_has_errors = True
                else:
                    seen_standards.add(std_key)
                    known_standard_numbers.add(std_num.upper())

            if not std_has_errors:
                valid_standards_count += 1

        # 3. Validate Requirements
        for req in payload.requirements:
            idx = str(req.get("_source_index", "?"))
            clause = (req.get("clause") or "").strip()
            title = (req.get("title") or "").strip()
            desc = (req.get("description") or "").strip()
            priority = (req.get("priority") or "HIGH").strip().upper()
            category = (req.get("category") or "SAFETY").strip().upper()
            std_ref = (req.get("_standard_ref") or req.get("standard_number") or "").strip().upper()

            req_has_errors = False

            if not clause:
                errors.append(
                    ValidationErrorItem(
                        record_type="requirement",
                        index_or_row=idx,
                        identifier=None,
                        field="clause",
                        error="Field 'clause' is required and cannot be empty.",
                    )
                )
                req_has_errors = True

            if not title:
                errors.append(
                    ValidationErrorItem(
                        record_type="requirement",
                        index_or_row=idx,
                        identifier=clause,
                        field="title",
                        error="Field 'title' is required and cannot be empty.",
                    )
                )
                req_has_errors = True

            if not desc:
                errors.append(
                    ValidationErrorItem(
                        record_type="requirement",
                        index_or_row=idx,
                        identifier=clause,
                        field="description",
                        error="Clause technical 'description' is required and cannot be empty.",
                    )
                )
                req_has_errors = True

            if priority not in cls.ALLOWED_REQUIREMENT_PRIORITIES:
                errors.append(
                    ValidationErrorItem(
                        record_type="requirement",
                        index_or_row=idx,
                        identifier=clause,
                        field="priority",
                        error=f"Invalid priority '{priority}'. Must be one of {sorted(cls.ALLOWED_REQUIREMENT_PRIORITIES)}",
                    )
                )
                req_has_errors = True

            if category not in cls.ALLOWED_REQUIREMENT_CATEGORIES:
                errors.append(
                    ValidationErrorItem(
                        record_type="requirement",
                        index_or_row=idx,
                        identifier=clause,
                        field="category",
                        error=f"Invalid category '{category}'. Must be one of {sorted(cls.ALLOWED_REQUIREMENT_CATEGORIES)}",
                    )
                )
                req_has_errors = True

            # Standard relationship validation
            if not std_ref:
                errors.append(
                    ValidationErrorItem(
                        record_type="requirement",
                        index_or_row=idx,
                        identifier=clause,
                        field="standard_number",
                        error="Clause is orphaned: missing reference to a parent standard number.",
                    )
                )
                req_has_errors = True

            # Duplicate clause within same standard check
            if std_ref and clause:
                clause_key = (std_ref, clause)
                if clause_key in seen_clauses:
                    errors.append(
                        ValidationErrorItem(
                            record_type="requirement",
                            index_or_row=idx,
                            identifier=clause,
                            field="clause",
                            error=f"Duplicate clause '{clause}' for standard '{std_ref}' detected within import bundle.",
                        )
                    )
                    req_has_errors = True
                else:
                    seen_clauses.add(clause_key)

            if not req_has_errors:
                valid_requirements_count += 1

        total = len(payload.standards) + len(payload.requirements)
        valid = valid_standards_count + valid_requirements_count
        invalid = total - valid

        return ValidationResult(
            is_valid=(len(errors) == 0),
            total_records=total,
            valid_records=valid,
            invalid_records=invalid,
            errors=errors,
        )
