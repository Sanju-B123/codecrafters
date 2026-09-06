"""
BharatStandards AI - Knowledge Importer
Coordinates parsing, validation, normalization, deduplication, preview generation,
and transactional staging of imported knowledge into DRAFT status.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.standard import Standard, Requirement, StandardStatus, RequirementStatus
from app.models.knowledge import (
    KnowledgeSource,
    KnowledgeSourceType,
    KnowledgeVerificationStatus,
    KnowledgeImportJob,
    KnowledgeImportJobStatus,
    KnowledgeImportRecord,
    KnowledgeImportRecordStatus,
    KnowledgeChangeLog,
    KnowledgeChangeAction,
    KnowledgeIndex,
    KnowledgeIndexStatus,
)
from app.knowledge.ingestion.source_loader import BaseSourceLoader, IngestionPayload
from app.knowledge.ingestion.json_loader import JsonSourceLoader
from app.knowledge.ingestion.csv_loader import CsvSourceLoader
from app.knowledge.ingestion.document_loader import DocumentSourceLoader
from app.knowledge.ingestion.validator import KnowledgeValidator, ValidationResult
from app.knowledge.ingestion.normalizer import KnowledgeNormalizer
from app.knowledge.ingestion.deduplicator import KnowledgeDeduplicator, DeduplicationResult


class KnowledgeImporter:
    LOADERS: List[BaseSourceLoader] = [
        JsonSourceLoader(),
        CsvSourceLoader(),
        DocumentSourceLoader(),
    ]

    @classmethod
    def _get_loader(cls, filename: str, content_type: Optional[str] = None) -> BaseSourceLoader:
        for loader in cls.LOADERS:
            if loader.can_load(filename, content_type):
                return loader
        raise ValueError(
            f"Unsupported file format for '{filename}'. Supported formats: .json, .csv, .txt, .md"
        )

    @classmethod
    def preview(
        cls,
        db: Session,
        filename: str,
        raw_bytes: bytes,
        content_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Validates, normalizes, and checks duplicates returning a detailed preview
        WITHOUT modifying any database records.
        """
        loader = cls._get_loader(filename, content_type)
        payload = loader.load(raw_bytes, filename)

        # 1. Validation
        validation = KnowledgeValidator.validate(payload)

        # 2. Normalization
        norm_payload = KnowledgeNormalizer.normalize_payload(payload)

        # 3. Deduplication Check
        dedup = KnowledgeDeduplicator.check_duplicates(db, norm_payload)

        # Prepare previews (first 10 items)
        standards_preview = []
        for s in norm_payload.standards[:10]:
            standards_preview.append({
                "standard_number": s.get("standard_number"),
                "title": s.get("title"),
                "category": s.get("category"),
                "version": s.get("version", "2026"),
                "status": "DRAFT",
                "source": s.get("source", "Imported Dataset"),
            })

        requirements_preview = []
        for r in norm_payload.requirements[:15]:
            requirements_preview.append({
                "standard_number": r.get("_standard_ref") or r.get("standard_number"),
                "clause": r.get("clause"),
                "title": r.get("title"),
                "priority": r.get("priority", "HIGH"),
                "category": r.get("category", "SAFETY"),
            })

        return {
            "filename": filename,
            "format_type": payload.format_type,
            "total_records": validation.total_records,
            "valid_records": validation.valid_records,
            "invalid_records": validation.invalid_records,
            "is_valid": validation.is_valid,
            "errors": [e.model_dump() for e in validation.errors],
            "duplicates_found": dedup.duplicates_found,
            "duplicate_matches": [m.model_dump() for m in dedup.matches],
            "standards_count": len(norm_payload.standards),
            "requirements_count": len(norm_payload.requirements),
            "standards_preview": standards_preview,
            "requirements_preview": requirements_preview,
            "source_metadata": norm_payload.source_metadata,
        }

    @classmethod
    def execute_import(
        cls,
        db: Session,
        user_id: int,
        filename: str,
        raw_bytes: bytes,
        content_type: Optional[str] = None,
        source_id: Optional[int] = None,
    ) -> KnowledgeImportJob:
        """
        Executes file ingestion, creating an import job and row-level records.
        Valid records are staged into database tables in DRAFT status.
        """
        loader = cls._get_loader(filename, content_type)
        payload = loader.load(raw_bytes, filename)

        validation = KnowledgeValidator.validate(payload)
        norm_payload = KnowledgeNormalizer.normalize_payload(payload)
        dedup = KnowledgeDeduplicator.check_duplicates(db, norm_payload)

        # 1. Create Job
        job = KnowledgeImportJob(
            created_by=user_id,
            source_id=source_id,
            filename=filename,
            status=KnowledgeImportJobStatus.PROCESSING.value,
            total_records=validation.total_records,
            processed_records=0,
            successful_records=0,
            failed_records=0,
        )
        db.add(job)
        db.flush()

        error_lookup: Dict[str, str] = {}
        for err in validation.errors:
            key = f"{err.record_type}_{err.index_or_row}"
            error_lookup[key] = f"{err.field}: {err.error}"

        existing_std_keys = {
            (m.identifier.upper(), (m.version or "2026").upper())
            for m in dedup.matches
            if m.entity_type == "standard"
        }

        created_standards: Dict[str, Standard] = {}
        successful_count = 0
        failed_count = 0

        # 2. Stage Standards (as DRAFT)
        for std in norm_payload.standards:
            idx = str(std.get("_source_index", "?"))
            err_key = f"standard_{idx}"
            std_num = (std.get("standard_number") or "").strip()
            version = (std.get("version") or "2026").strip()

            if err_key in error_lookup:
                # Record invalid entry
                rec = KnowledgeImportRecord(
                    job_id=job.id,
                    record_type="standard",
                    external_id=std_num or None,
                    status=KnowledgeImportRecordStatus.INVALID.value,
                    error_message=error_lookup[err_key],
                    raw_data=std,
                    normalized_data=std,
                )
                db.add(rec)
                failed_count += 1
                continue

            # Check if duplicate and skip if existing
            if (std_num.upper(), version.upper()) in existing_std_keys:
                rec = KnowledgeImportRecord(
                    job_id=job.id,
                    record_type="standard",
                    external_id=std_num,
                    status=KnowledgeImportRecordStatus.SKIPPED.value,
                    error_message=f"Standard '{std_num}' (version '{version}') already exists in database.",
                    raw_data=std,
                    normalized_data=std,
                )
                db.add(rec)
                continue

            # Create Standard as DRAFT
            is_demo = (
                std.get("is_demo", True)
                if std.get("source_type") != "OFFICIAL"
                else False
            )
            standard_entity = Standard(
                standard_number=std_num,
                title=std.get("title", "Imported Technical Standard"),
                category=std.get("category", "General Engineering"),
                scope=std.get("scope"),
                description=std.get("description"),
                version=version,
                status=StandardStatus.DRAFT.value,  # Staged as DRAFT per workflow requirement
                source=std.get("source", "Imported Standards Knowledge Base"),
                source_url=std.get("source_url"),
                is_demo=is_demo,
            )
            db.add(standard_entity)
            db.flush()

            created_standards[std_num.upper()] = standard_entity

            # Register KnowledgeIndex entry as NOT_INDEXED
            db.add(
                KnowledgeIndex(
                    entity_type="standard",
                    entity_id=standard_entity.id,
                    index_status=KnowledgeIndexStatus.NOT_INDEXED.value,
                )
            )

            # Log change log
            db.add(
                KnowledgeChangeLog(
                    user_id=user_id,
                    entity_type="standard",
                    entity_id=standard_entity.id,
                    action=KnowledgeChangeAction.CREATED.value,
                    old_version=None,
                    new_version=version,
                    description=f"Imported standard '{std_num}' as DRAFT from '{filename}'",
                )
            )

            rec = KnowledgeImportRecord(
                job_id=job.id,
                record_type="standard",
                external_id=std_num,
                status=KnowledgeImportRecordStatus.IMPORTED.value,
                created_entity_type="standard",
                created_entity_id=standard_entity.id,
                raw_data=std,
                normalized_data=std,
            )
            db.add(rec)
            successful_count += 1

        # 3. Stage Requirements (as DRAFT)
        for req in norm_payload.requirements:
            idx = str(req.get("_source_index", "?"))
            err_key = f"requirement_{idx}"
            clause = (req.get("clause") or "").strip()
            std_ref = (req.get("_standard_ref") or req.get("standard_number") or "").strip().upper()

            if err_key in error_lookup:
                rec = KnowledgeImportRecord(
                    job_id=job.id,
                    record_type="requirement",
                    external_id=f"{std_ref}:{clause}" if std_ref else clause,
                    status=KnowledgeImportRecordStatus.INVALID.value,
                    error_message=error_lookup[err_key],
                    raw_data=req,
                    normalized_data=req,
                )
                db.add(rec)
                failed_count += 1
                continue

            # Identify target standard (either newly created in this job, or pre-existing in DB)
            target_std = created_standards.get(std_ref)
            if not target_std:
                target_std = (
                    db.query(Standard)
                    .filter(Standard.standard_number.ilike(std_ref))
                    .first()
                )

            if not target_std:
                rec = KnowledgeImportRecord(
                    job_id=job.id,
                    record_type="requirement",
                    external_id=f"{std_ref}:{clause}",
                    status=KnowledgeImportRecordStatus.FAILED.value,
                    error_message=f"Target standard '{std_ref}' not found in job or database.",
                    raw_data=req,
                    normalized_data=req,
                )
                db.add(rec)
                failed_count += 1
                continue

            # Create requirement as DRAFT
            req_entity = Requirement(
                standard_id=target_std.id,
                clause=clause,
                title=req.get("title", f"Clause {clause}"),
                description=req.get("description", ""),
                category=req.get("category", "SAFETY"),
                priority=req.get("priority", "HIGH"),
                evidence_types=req.get("evidence_types") or ["test_report"],
                status=RequirementStatus.DRAFT.value,
                verification_method=req.get("verification_method"),
                evidence_required=req.get("evidence_required"),
                weight=float(req.get("weight") or 2.0),
                source=target_std.source,
                source_url=target_std.source_url,
            )
            db.add(req_entity)
            db.flush()

            # Register KnowledgeIndex entry as NOT_INDEXED
            db.add(
                KnowledgeIndex(
                    entity_type="requirement",
                    entity_id=req_entity.id,
                    index_status=KnowledgeIndexStatus.NOT_INDEXED.value,
                )
            )

            rec = KnowledgeImportRecord(
                job_id=job.id,
                record_type="requirement",
                external_id=f"{std_ref}:{clause}",
                status=KnowledgeImportRecordStatus.IMPORTED.value,
                created_entity_type="requirement",
                created_entity_id=req_entity.id,
                raw_data=req,
                normalized_data=req,
            )
            db.add(rec)
            successful_count += 1

        # 4. Finalize Job Status
        job.processed_records = successful_count + failed_count
        job.successful_records = successful_count
        job.failed_records = failed_count
        job.completed_at = datetime.now(timezone.utc)

        if failed_count == 0 and successful_count > 0:
            job.status = KnowledgeImportJobStatus.COMPLETED.value
        elif successful_count > 0 and failed_count > 0:
            job.status = KnowledgeImportJobStatus.PARTIAL.value
            job.error_summary = f"{failed_count} records failed validation or missing references."
        elif failed_count > 0:
            job.status = KnowledgeImportJobStatus.FAILED.value
            job.error_summary = f"All {failed_count} records failed validation."
        else:
            job.status = KnowledgeImportJobStatus.COMPLETED.value

        db.commit()
        db.refresh(job)
        return job
