"""
BharatStandards AI - Embedding Provider Abstraction
Vendor-agnostic vector embedding service supporting Mock/Local generation and OpenAI-compatible endpoints.
"""
import hashlib
import math
from typing import List
import httpx
from app.core.config import settings
from app.core.logging import logger


class BaseEmbeddingProvider:
    """Abstract vector embedding interface."""
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        raise NotImplementedError


class MockEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic pseudo-embedding provider for local development, CI tests,
    and offline operation without requiring external API credentials.
    Generates unit-normalized 384-dimensional vector embeddings based on text hashes.
    """
    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions

    def _pseudo_vector(self, text: str) -> List[float]:
        # Generate stable seed vector from text
        vec = []
        for i in range(self.dimensions):
            h = hashlib.sha256(f"{text}_{i}".encode("utf-8")).hexdigest()
            # Convert first 8 hex chars to float in [-1.0, 1.0]
            val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
            vec.append(val)

        # Normalize to unit vector
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 6) for x in vec]

    def embed_text(self, text: str) -> List[float]:
        return self._pseudo_vector(text)

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        return [self._pseudo_vector(c) for c in chunks]


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """
    OpenAI-compatible embeddings provider.
    Calls `/v1/embeddings` endpoint using standard HTTP requests.
    """
    def __init__(self, api_key: str, model: str = "text-embedding-3-small", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def embed_text(self, text: str) -> List[float]:
        res = self.embed_chunks([text])
        return res[0] if res else []

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        if not chunks:
            return []
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(
                    f"{self.base_url}/embeddings",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"input": chunks, "model": self.model},
                )
                response.raise_for_status()
                data = response.json()
                return [item["embedding"] for item in data["data"]]
        except Exception as e:
            logger.error(f"OpenAI embedding generation failed: {e}. Falling back to mock embeddings.")
            fallback = MockEmbeddingProvider()
            return fallback.embed_chunks(chunks)


def get_embedding_provider() -> BaseEmbeddingProvider:
    """
    Factory creating configured embedding provider.
    Falls back gracefully to MockEmbeddingProvider if no API key is provided.
    """
    provider_type = settings.EMBEDDING_PROVIDER.lower()
    if provider_type == "openai" and settings.EMBEDDING_API_KEY:
        return OpenAIEmbeddingProvider(
            api_key=settings.EMBEDDING_API_KEY,
            model=settings.EMBEDDING_MODEL,
        )
    return MockEmbeddingProvider()


class EmbeddingService:
    """
    High-level embedding service for embedding document chunks and preparing vector storage.
    """
    def __init__(self, provider: BaseEmbeddingProvider = None):
        self.provider = provider or get_embedding_provider()

    def embed_text(self, text: str) -> List[float]:
        return self.provider.embed_text(text)

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        return self.provider.embed_chunks(chunks)
