"""
BharatStandards AI - Embedding Service
Provider-independent text embedding service supporting OpenAI and deterministic mock vectorizers.
"""
import hashlib
import math
import re
from typing import List, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger


class BaseEmbeddingProvider:
    """Abstract interface for generating vector embeddings."""
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError


class DeterministicMockEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic 64-dimensional feature vectorizer.
    Generates reproducible unit-norm embedding vectors based on token hashing and term frequencies.
    Enables zero-cost, offline development and reliable unit testing without external APIs.
    """
    DIMENSIONS = 64

    def _vectorize(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.DIMENSIONS

        vec = [0.0] * self.DIMENSIONS
        tokens = re.findall(r"\b\w+\b", text.lower())
        if not tokens:
            return [0.0] * self.DIMENSIONS

        for token in tokens:
            # Deterministic hash to dimension index
            h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
            idx = h % self.DIMENSIONS
            sign = 1.0 if (h // self.DIMENSIONS) % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 + math.log(len(token)))

        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [round(x / norm, 5) for x in vec]
        return vec

    def embed_text(self, text: str) -> List[float]:
        return self._vectorize(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._vectorize(t) for t in texts]


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """
    Direct HTTP client for OpenAI-compatible text embedding endpoints.
    """
    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        base_url: str = "https://api.openai.com/v1",
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def embed_text(self, text: str) -> List[float]:
        docs = self.embed_documents([text])
        return docs[0] if docs else []

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key:
            raise ValueError("OpenAI embedding API key is not configured.")

        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(
                    f"{self.base_url}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "input": texts,
                    },
                )
                res.raise_for_status()
                data = res.json()
                return [item["embedding"] for item in data["data"]]
        except Exception as e:
            logger.error(f"External Embedding API error: {e}. Falling back to deterministic vectorizer.")
            fallback = DeterministicMockEmbeddingProvider()
            return fallback.embed_documents(texts)


class EmbeddingService:
    """
    Facade managing vector embedding generation with configured provider.
    """
    def __init__(self, provider: Optional[BaseEmbeddingProvider] = None):
        if provider:
            self.provider = provider
        elif settings.EMBEDDING_PROVIDER.lower() == "openai" and settings.EMBEDDING_API_KEY:
            self.provider = OpenAIEmbeddingProvider(
                api_key=settings.EMBEDDING_API_KEY,
                model=settings.EMBEDDING_MODEL,
            )
        else:
            self.provider = DeterministicMockEmbeddingProvider()

    def embed_text(self, text: str) -> List[float]:
        return self.provider.embed_text(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.provider.embed_documents(texts)


# Default singleton instance
embedding_service = EmbeddingService()
