"""
BharatStandards AI - Knowledge Deduplicator
Identifies existing standards and clauses in the database to prevent silent overwrites
and enforce multi-version integrity.
"""
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.standard import Standard, Requirement
from app.knowledge.ingestion.source_loader import IngestionPayload


class DuplicateMatch(BaseModel):
    entity_type: str  # 'standard' | 'requirement'
    identifier: str  # standard_number or clause
    version: Optional[str] = None
    existing_id: int
    existing_status: str
    existing_title: str
    action_allowed: str = "SKIP"  # 'SKIP' or 'UPDATE'


class DeduplicationResult(BaseModel):
    duplicates_found: int
    new_records: int
    matches: List[DuplicateMatch] = []

    @property
    def duplicate_standards(self) -> List[str]:
        return [m.identifier for m in self.matches if m.entity_type == "standard"]

    @property
    def duplicate_requirements(self) -> List[str]:
        return [m.identifier for m in self.matches if m.entity_type == "requirement"]


class KnowledgeDeduplicator:
    """
    Compares incoming standards and requirements against existing production data.
    """

    @classmethod
    def find_duplicates(cls, payload: IngestionPayload, db: Session) -> DeduplicationResult:
        return cls.check_duplicates(db=db, payload=payload)

    @classmethod
    def check_duplicates(cls, db: Session, payload: IngestionPayload) -> DeduplicationResult:
        matches: List[DuplicateMatch] = []
        new_count = 0

        # Cache existing standards in memory for fast lookup
        existing_standards = db.query(Standard).all()
        # Map (standard_number.upper(), version.upper()) -> Standard
        std_map: Dict[Tuple[str, str], Standard] = {}
        for s in existing_standards:
            v = (s.version or "2026").strip().upper()
            std_map[(s.standard_number.strip().upper(), v)] = s

        # Check Standards
        for std in payload.standards:
            code = (std.get("standard_number") or "").strip().upper()
            version = (std.get("version") or "2026").strip().upper()
            key = (code, version)

            if key in std_map:
                existing = std_map[key]
                matches.append(
                    DuplicateMatch(
                        entity_type="standard",
                        identifier=code,
                        version=version,
                        existing_id=existing.id,
                        existing_status=existing.status,
                        existing_title=existing.title,
                        action_allowed="SKIP",
                    )
                )
            else:
                new_count += 1

        # Check Requirements (if standard exists in DB)
        for req in payload.requirements:
            clause = (req.get("clause") or "").strip()
            std_ref = (req.get("_standard_ref") or req.get("standard_number") or "").strip().upper()
            version = (req.get("version") or "").strip().upper()

            # Find matching existing standard in std_map
            existing_std = None
            if version and (std_ref, version) in std_map:
                existing_std = std_map[(std_ref, version)]
            else:
                for (s_code, _), s_obj in std_map.items():
                    if s_code == std_ref:
                        existing_std = s_obj
                        break

            if existing_std:
                existing_req = (
                    db.query(Requirement)
                    .filter(
                        Requirement.standard_id == existing_std.id,
                        Requirement.clause == clause,
                    )
                    .first()
                )
                if existing_req:
                    matches.append(
                        DuplicateMatch(
                            entity_type="requirement",
                            identifier=f"{std_ref} Cl.{clause}",
                            version=version,
                            existing_id=existing_req.id,
                            existing_status=existing_req.status,
                            existing_title=existing_req.title,
                            action_allowed="SKIP",
                        )
                    )
                else:
                    new_count += 1
            else:
                new_count += 1

        return DeduplicationResult(
            duplicates_found=len(matches),
            new_records=new_count,
            matches=matches,
        )
