"""
BharatStandards AI - Document Chunking Service
Splits extracted document page texts into semantic, section-aware chunks while preserving page boundaries.
"""
import re
from typing import List, Dict, Any


class ChunkingService:
    def __init__(self, target_chunk_size: int = 800, overlap: int = 100):
        self.target_chunk_size = target_chunk_size
        self.overlap = overlap

    def chunk_page(
        self,
        page_text: str,
        page_number: int,
        start_index: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Splits a single page's text into logical chunks, preserving paragraphs and section hints.
        """
        cleaned_text = re.sub(r"\r\n", "\n", page_text).strip()
        if not cleaned_text:
            return []

        paragraphs = [p.strip() for p in cleaned_text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk = ""
        current_section = None

        # Look for potential section heading in first paragraph (e.g., "1.0 Scope", "Section 4.1 Test Results")
        heading_match = re.match(r"^(?:Section\s+|Clause\s+)?([0-9]+(?:\.[0-9]+)*\s+[A-Za-z\s]{3,40})", cleaned_text[:120])
        if heading_match:
            current_section = heading_match.group(1).strip()

        for para in paragraphs:
            # Check if this paragraph itself looks like a heading
            if len(para) < 60 and re.match(r"^(?:[0-9]+(?:\.[0-9]+)*|[A-Z\s]{4,30})\b", para):
                current_section = para

            if not current_chunk:
                current_chunk = para
            elif len(current_chunk) + len(para) + 2 <= self.target_chunk_size:
                current_chunk += "\n\n" + para
            else:
                # Save current chunk
                chunks.append({
                    "chunk_index": start_index + len(chunks),
                    "content": current_chunk,
                    "page": page_number,
                    "section": current_section,
                    "char_count": len(current_chunk),
                })
                # Start new chunk with overlap if appropriate
                if self.overlap > 0 and len(current_chunk) > self.overlap:
                    overlap_text = current_chunk[-self.overlap:].strip()
                    current_chunk = overlap_text + "\n\n" + para
                else:
                    current_chunk = para

        if current_chunk:
            chunks.append({
                "chunk_index": start_index + len(chunks),
                "content": current_chunk,
                "page": page_number,
                "section": current_section,
                "char_count": len(current_chunk),
            })

        return chunks

    def chunk_document_pages(
        self,
        pages: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Chunks an entire document given a list of {'page': int, 'text': str}.
        Maintains monotonically increasing chunk_index across all pages.
        """
        all_chunks = []
        for page_data in pages:
            page_num = page_data.get("page", 1)
            text = page_data.get("text", "")
            page_chunks = self.chunk_page(text, page_number=page_num, start_index=len(all_chunks))
            all_chunks.extend(page_chunks)
        return all_chunks
