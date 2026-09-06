"""
BharatStandards AI - Vector Store Interface & Implementation
Provider-independent vector database adapter supporting cosine similarity search and metadata filtering.
"""
import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VectorRecord(BaseModel):
    id: str
    vector: List[float]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    text: str = ""


class VectorSearchResult(BaseModel):
    id: str
    score: float
    metadata: Dict[str, Any]
    text: str


class BaseVectorStore:
    """Abstract interface for vector similarity stores."""
    def upsert(self, records: List[VectorRecord]) -> None:
        raise NotImplementedError

    def search(
        self,
        query_vector: List[float],
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        raise NotImplementedError

    def delete(self, ids: List[str]) -> None:
        raise NotImplementedError

    def health_check(self) -> Dict[str, Any]:
        raise NotImplementedError


class InMemoryCosineVectorStore(BaseVectorStore):
    """
    In-memory vector store with exact cosine similarity matching and metadata filtering.
    Zero external dependencies; fast for unit tests and local execution.
    """
    def __init__(self):
        self._records: Dict[str, VectorRecord] = {}

    def upsert(self, records: List[VectorRecord]) -> None:
        for r in records:
            self._records[r.id] = r

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 <= 0.0 or norm2 <= 0.0:
            return 0.0
        return round(dot / (norm1 * norm2), 5)

    def _matches_filter(self, metadata: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        for key, expected_val in filters.items():
            actual_val = metadata.get(key)
            if isinstance(expected_val, list):
                if actual_val not in expected_val:
                    return False
            elif actual_val != expected_val:
                return False
        return True

    def search(
        self,
        query_vector: List[float],
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        if not self._records or not query_vector:
            return []

        results: List[VectorSearchResult] = []
        for r in self._records.values():
            if filters and not self._matches_filter(r.metadata, filters):
                continue
            sim = self._cosine_similarity(query_vector, r.vector)
            results.append(
                VectorSearchResult(
                    id=r.id,
                    score=sim,
                    metadata=r.metadata,
                    text=r.text,
                )
            )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    def delete(self, ids: List[str]) -> None:
        for id_ in ids:
            self._records.pop(id_, None)

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "HEALTHY",
            "provider": "in_memory_cosine",
            "indexed_vectors": len(self._records),
        }


# Global singleton instance
vector_store = InMemoryCosineVectorStore()
