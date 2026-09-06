"""
BharatStandards AI - OCR Service Interface
Provides interface and mock fallback for scanned document text detection.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any


class OCRService(ABC):
    @abstractmethod
    def needs_ocr(self, pages: List[Dict[str, Any]]) -> bool:
        """Determines if a document has insufficient embedded text and requires OCR processing."""
        pass

    @abstractmethod
    def process_ocr(self, storage_path: str) -> List[Dict[str, Any]]:
        """Executes optical character recognition on scanned pages."""
        pass


class MockOCRService(OCRService):
    """
    Mock OCR provider that analyzes extracted character density.
    If total text across all pages is under 30 characters, classifies as NEEDS_OCR.
    """

    def needs_ocr(self, pages: List[Dict[str, Any]]) -> bool:
        if not pages:
            return True
        total_chars = sum(len(p.get("text", "").strip()) for p in pages)
        # If average text per page is under 15 characters, it's likely a scanned image
        avg_chars = total_chars / len(pages) if pages else 0
        return total_chars < 30 or avg_chars < 15

    def process_ocr(self, storage_path: str) -> List[Dict[str, Any]]:
        # Does not pretend OCR occurred; returns empty or mock placeholders for future integration
        return []


ocr_service = MockOCRService()
