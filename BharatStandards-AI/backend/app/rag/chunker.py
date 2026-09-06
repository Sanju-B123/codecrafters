"""
BharatStandards AI - Chunker Utilities
Context chunking, sliding window token splitting, and metadata preservation.
"""
from typing import Dict, List, Any


def estimate_tokens(text: str) -> int:
    """
    Heuristic token count estimation (~4 characters per token for English/technical specs).
    """
    if not text:
        return 0
    return max(1, len(text) // 4)


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    metadata: Dict[str, Any] = None,
) -> List[Dict[str, Any]]:
    """
    Split text into overlapping passages while preserving page/section metadata.
    """
    if not text or not text.strip():
        return []

    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk_content = " ".join(chunk_words)

        chunk_data = {
            "content": chunk_content,
            "char_count": len(chunk_content),
            "estimated_tokens": estimate_tokens(chunk_content),
            "start_word": start,
            "end_word": end,
        }
        if metadata:
            chunk_data.update(metadata)

        chunks.append(chunk_data)

        if end == len(words):
            break
        start += chunk_size - chunk_overlap

    return chunks
