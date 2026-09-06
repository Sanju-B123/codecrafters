"""
BharatStandards AI - Document Knowledge Loader
Extracts structured clauses from plain text or markdown technical standard drafts.
"""
import re
from typing import Any, Dict, List, Optional
from app.knowledge.ingestion.source_loader import BaseSourceLoader, IngestionPayload


class DocumentSourceLoader(BaseSourceLoader):
    """
    Parses plain text / markdown standard drafts with regex clause delineation.
    """

    def can_load(self, filename: str, content_type: Optional[str] = None) -> bool:
        ext = filename.lower()
        return ext.endswith(".txt") or ext.endswith(".md")

    def load(self, raw_bytes: bytes, filename: str = "document.md") -> IngestionPayload:
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError as e:
            raise ValueError(f"Document '{filename}' must be valid UTF-8 text: {e}")

        lines = text.splitlines()
        std_number = filename.rsplit(".", 1)[0].replace("_", " ").upper()
        title = lines[0].strip("# ") if lines else std_number

        requirements = []
        current_clause = None
        current_title = ""
        current_body = []

        clause_regex = re.compile(r"^(?:#+\s*)?(?:Clause\s+)?(\d+(?:\.\d+)*)\s*[:\-–]?\s*(.*)$", re.IGNORECASE)

        for line_idx, line in enumerate(lines[1:], start=2):
            stripped = line.strip()
            match = clause_regex.match(stripped)
            if match and len(match.group(1)) <= 15:
                # Save previous clause if present
                if current_clause and current_body:
                    requirements.append({
                        "clause": current_clause,
                        "title": current_title or f"Clause {current_clause}",
                        "description": " ".join(current_body).strip(),
                        "_standard_ref": std_number,
                        "_source_index": f"Line {line_idx}",
                    })
                current_clause = match.group(1)
                current_title = match.group(2).strip()
                current_body = []
            elif current_clause and stripped:
                current_body.append(stripped)

        if current_clause and current_body:
            requirements.append({
                "clause": current_clause,
                "title": current_title or f"Clause {current_clause}",
                "description": " ".join(current_body).strip(),
                "_standard_ref": std_number,
                "_source_index": "EOF",
            })

        standard = {
            "standard_number": std_number,
            "title": title,
            "category": "General Engineering",
            "version": "2026",
            "scope": lines[0][:200] if lines else "",
            "_source_index": "DocHeader",
        }

        return IngestionPayload(
            source_metadata={"filename": filename, "format": "markdown/text"},
            standards=[standard],
            requirements=requirements,
            raw_record_count=1 + len(requirements),
            format_type="text",
        )
