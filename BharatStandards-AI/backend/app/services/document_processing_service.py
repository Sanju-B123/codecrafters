"""
BharatStandards AI - Document Processing Service
Orchestrates PDF text extraction, OCR requirement evaluation, chunking, and database persistence.
"""
import io
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.services.storage_service import storage_service
from app.services.chunking_service import ChunkingService
from app.services.ocr_service import ocr_service
from app.services.evidence_service import evidence_preparation_service
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service


class DocumentProcessingService:
    def __init__(self):
        self.chunker = ChunkingService(target_chunk_size=800, overlap=100)

    def extract_pdf_pages(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extracts text from PDF page-by-page using pypdf.
        Preserves page indices (1-indexed).
        """
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))
        pages_data = []
        for idx, page in enumerate(reader.pages):
            raw_text = page.extract_text() or ""
            # Clean null bytes and excessive carriage returns
            clean_text = raw_text.replace("\x00", "").replace("\r\n", "\n")
            clean_text = re.sub(r"[ \t]+", " ", clean_text)
            pages_data.append({
                "page": idx + 1,
                "text": clean_text.strip(),
            })
        return pages_data

    def process_document(self, db: Session, document_id: int) -> Document:
        """
        Main processing execution pipeline for an ingested document.
        Transitions status: QUEUED -> PROCESSING -> PROCESSED (or NEEDS_OCR or FAILED).
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Cannot process document {document_id}: record not found.")
            return None

        try:
            document.status = DocumentStatus.PROCESSING.value
            document.processing_error = None
            db.commit()
            db.refresh(document)

            # Retrieve physical file bytes
            file_bytes = storage_service.get(document.storage_path)
            if not file_bytes:
                raise FileNotFoundError(f"Storage file missing at '{document.storage_path}'")

            # Extract pages from PDF
            pages_data = self.extract_pdf_pages(file_bytes)
            page_count = len(pages_data)
            document.page_count = page_count

            # Evaluate OCR requirement
            if ocr_service.needs_ocr(pages_data):
                logger.info(f"Document {document.id} contains low text density; marking as NEEDS_OCR.")
                document.status = DocumentStatus.NEEDS_OCR.value
                db.commit()
                db.refresh(document)
                return document

            # Delete any previous chunks if re-processing
            db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()

            # Generate chunks
            raw_chunks = self.chunker.chunk_document_pages(pages_data)

            # Persist chunks with evidence metadata
            for ch in raw_chunks:
                meta_json = evidence_preparation_service.prepare_chunk_metadata(document, ch)
                chunk_obj = DocumentChunk(
                    document_id=document.id,
                    chunk_index=ch["chunk_index"],
                    content=ch["content"],
                    page=ch["page"],
                    section=ch.get("section"),
                    char_count=ch["char_count"],
                    metadata_json=meta_json,
                )
                db.add(chunk_obj)

            document.status = DocumentStatus.PROCESSED.value
            document.processing_error = None
            db.commit()
            db.refresh(document)
            logger.info(f"Document {document.id} ('{document.original_filename}') successfully processed into {len(raw_chunks)} chunks.")

            audit_service.log_event(
                db=db,
                user_id=document.user_id,
                action="DOCUMENT_PROCESSED",
                entity_type="document",
                entity_id=document.id,
                description=f"Document '{document.original_filename}' processed successfully ({len(raw_chunks)} chunks extracted)",
                metadata={"page_count": page_count, "chunks": len(raw_chunks)},
            )
            notification_service.create_notification(
                db=db,
                user_id=document.user_id,
                type="DOCUMENT_PROCESSED",
                title="Document Processed",
                message=f"'{document.original_filename}' has been processed and is ready for compliance assessment.",
                entity_type="document",
                entity_id=document.id,
            )
            return document

        except Exception as e:
            logger.error(f"Error processing document {document.id}: {e}", exc_info=True)
            document.status = DocumentStatus.FAILED.value
            document.processing_error = "Unable to parse PDF content. Please verify document formatting and file integrity."
            db.commit()
            db.refresh(document)

            audit_service.log_event(
                db=db,
                user_id=document.user_id,
                action="DOCUMENT_FAILED",
                entity_type="document",
                entity_id=document.id,
                description=f"Document processing failed for '{document.original_filename}'",
            )
            notification_service.create_notification(
                db=db,
                user_id=document.user_id,
                type="DOCUMENT_FAILED",
                title="Document Processing Failed",
                message=f"Could not process '{document.original_filename}'. Please check file integrity.",
                entity_type="document",
                entity_id=document.id,
            )
            return document


document_processing_service = DocumentProcessingService()
