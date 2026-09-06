"""
BharatStandards AI - Chunking Service
Chunks documents by semantic boundaries (section, heading, paragraph, page)
and chunks standards/requirements while strictly preserving parent IS metadata.
"""
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DocumentChunkRecord(BaseModel):
    document_id: int
    page_number: int
    section: str
    text: str
    chunk_index: int
    metadata: Dict[str, Any] = {}


class StandardChunkRecord(BaseModel):
    standard_id: int
    standard_number: str
    version: str
    clause: str
    title: str
    requirement: str
    source: str
    text: str
    metadata: Dict[str, Any] = {}


class ChunkingService:
    """
    Structured document and standard chunking service.
    """

    HEADING_REGEX = re.compile(r"^(?:#{1,4}\s+|[A-Z0-9\.\-\s]{3,}:|[0-9]+\.[0-9]*\s+[A-Z])", re.MULTILINE)

    @classmethod
    def chunk_document(
        cls,
        document_id: int,
        raw_text: str,
        page_number: int = 1,
        max_chunk_chars: int = 800,
        min_chunk_chars: int = 80,
    ) -> List[DocumentChunkRecord]:
        """
        Chunks text prioritizing:
        1. Sections / Headings
        2. Paragraphs (double newline)
        3. Sentences / structured blocks
        """
        if not raw_text or not raw_text.strip():
            return []

        chunks: List[DocumentChunkRecord] = []
        chunk_idx = 0

        # Step 1: Split into paragraphs
        raw_paragraphs = [p.strip() for p in re.split(r"\n\s*\n", raw_text) if p.strip()]

        current_section = "General"
        current_block: List[str] = []
        current_len = 0

        for para in raw_paragraphs:
            # Check if paragraph starts with a section heading
            lines = para.split("\n")
            first_line = lines[0].strip()
            is_heading = bool(cls.HEADING_REGEX.match(first_line) and len(first_line) < 100)

            if is_heading and current_block:
                joined_text = "\n\n".join(current_block)
                chunks.append(
                    DocumentChunkRecord(
                        document_id=document_id,
                        page_number=page_number,
                        section=current_section,
                        text=joined_text,
                        chunk_index=chunk_idx,
                    )
                )
                chunk_idx += 1
                current_section = first_line.lstrip("#").strip()
                current_block = [para]
                current_len = len(para)
            elif is_heading:
                current_section = first_line.lstrip("#").strip()
                current_block.append(para)
                current_len += len(para) + 2
            elif current_len + len(para) > max_chunk_chars and current_block:
                joined_text = "\n\n".join(current_block)
                chunks.append(
                    DocumentChunkRecord(
                        document_id=document_id,
                        page_number=page_number,
                        section=current_section,
                        text=joined_text,
                        chunk_index=chunk_idx,
                    )
                )
                chunk_idx += 1
                current_block = [para]
                current_len = len(para)
            else:
                current_block.append(para)
                current_len += len(para) + 2

        if current_block:
            joined_text = "\n\n".join(current_block)
            chunks.append(
                DocumentChunkRecord(
                    document_id=document_id,
                    page_number=page_number,
                    section=current_section,
                    text=joined_text,
                    chunk_index=chunk_idx,
                )
            )

        return chunks

    @classmethod
    def chunk_requirement(
        cls,
        standard_id: int,
        standard_number: str,
        version: str,
        clause: str,
        title: str,
        description: str,
        verification_method: Optional[str] = None,
        source: str = "Bureau of Indian Standards",
        is_demo: bool = False,
    ) -> StandardChunkRecord:
        """
        Constructs a standard chunk preserving standard_number, version, clause, and verbatim requirement text.
        A clause NEVER loses its parent standard/version.
        """
        formatted_text = (
            f"[{standard_number} (v{version}) - Clause {clause}] {title}\n"
            f"Technical Specification: {description}\n"
            f"Verification: {verification_method or 'Inspection and Testing'}\n"
            f"Source Authority: {source}"
        )

        return StandardChunkRecord(
            standard_id=standard_id,
            standard_number=standard_number,
            version=version or "2026",
            clause=clause,
            title=title,
            requirement=description,
            source=source,
            text=formatted_text,
            metadata={
                "standard_id": standard_id,
                "standard_number": standard_number,
                "version": version or "2026",
                "clause": clause,
                "is_demo": is_demo,
                "source_type": "REQUIREMENT",
            },
        )
