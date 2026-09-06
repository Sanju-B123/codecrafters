"""
BharatStandards AI - Evidence Preparation Service
Structures extracted document chunks into standardized evidentiary units for compliance auditing and RAG retrieval.
"""
import json
from typing import Dict, Any
from app.models.document import Document, DocumentChunk


class EvidencePreparationService:
    """
    Standardizes document chunks into traceable evidence representations.
    """

    @staticmethod
    def prepare_chunk_metadata(
        document: Document,
        chunk: Dict[str, Any],
    ) -> str:
        """
        Creates JSON metadata string associating chunk with document and product lineage.
        """
        meta = {
            "document_id": document.id,
            "product_id": document.product_id,
            "filename": document.original_filename,
            "file_type": document.file_type,
            "page": chunk.get("page", 1),
            "section": chunk.get("section"),
            "chunk_index": chunk.get("chunk_index", 0),
            "char_count": chunk.get("char_count", len(chunk.get("content", ""))),
            "source_type": "USER_UPLOADED_DOCUMENT",
        }
        return json.dumps(meta)


evidence_preparation_service = EvidencePreparationService()
