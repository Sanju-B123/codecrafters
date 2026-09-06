import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.
    """
    APP_NAME: str = "BharatStandards AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # API Configuration
    API_V1_PREFIX: str = "/api"

    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Security & JWT Configuration
    SECRET_KEY: str = "bharatstandards-super-secret-jwt-key-2026-production-ready"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database Configuration (defaults to SQLite for frictionless local dev and testing)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bharat_standards.db")

    # AI & LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")  # "mock" | "openai"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")

    # Embedding Provider Configuration
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "mock")  # "mock" | "openai"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "")

    # AI Behavior & Safety
    DEMO_AI_MODE: bool = os.getenv("DEMO_AI_MODE", "true").lower() in ("true", "1", "yes")
    MAX_CONTEXT_CHUNKS: int = int(os.getenv("MAX_CONTEXT_CHUNKS", "8"))
    MAX_CONTEXT_TOKENS: int = int(os.getenv("MAX_CONTEXT_TOKENS", "4000"))
    MAX_RESPONSE_TOKENS: int = int(os.getenv("MAX_RESPONSE_TOKENS", "1500"))
    AI_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "30"))
    AI_REQUESTS_PER_MINUTE: int = int(os.getenv("AI_REQUESTS_PER_MINUTE", os.getenv("AI_RATE_LIMIT_PER_MINUTE", "30")))
    MAX_CONVERSATION_MESSAGES: int = int(os.getenv("MAX_CONVERSATION_MESSAGES", "10"))

    # Vector Store & Hybrid Search Configuration
    VECTOR_STORE_PROVIDER: str = os.getenv("VECTOR_STORE_PROVIDER", "memory")  # "memory" | "sqlite"
    RAG_KEYWORD_WEIGHT: float = float(os.getenv("RAG_KEYWORD_WEIGHT", "0.35"))
    RAG_SEMANTIC_WEIGHT: float = float(os.getenv("RAG_SEMANTIC_WEIGHT", "0.35"))
    RAG_AUTHORITY_WEIGHT: float = float(os.getenv("RAG_AUTHORITY_WEIGHT", "0.20"))
    RAG_FRESHNESS_WEIGHT: float = float(os.getenv("RAG_FRESHNESS_WEIGHT", "0.10"))

    # Knowledge Base Freshness
    KNOWLEDGE_REVIEW_DAYS: int = int(os.getenv("KNOWLEDGE_REVIEW_DAYS", "180"))

    # Compliance Risk Engine Configuration
    RISK_CRITICAL_THRESHOLD: int = int(os.getenv("RISK_CRITICAL_THRESHOLD", "76"))
    RISK_HIGH_THRESHOLD: int = int(os.getenv("RISK_HIGH_THRESHOLD", "51"))
    RISK_MEDIUM_THRESHOLD: int = int(os.getenv("RISK_MEDIUM_THRESHOLD", "21"))

    # Configurable Risk Factor Weights
    WEIGHT_REQUIREMENT_PRIORITY: float = float(os.getenv("WEIGHT_REQUIREMENT_PRIORITY", "0.35"))
    WEIGHT_COMPLIANCE_STATUS: float = float(os.getenv("WEIGHT_COMPLIANCE_STATUS", "0.35"))
    WEIGHT_EVIDENCE: float = float(os.getenv("WEIGHT_EVIDENCE", "0.15"))
    WEIGHT_CONFIDENCE: float = float(os.getenv("WEIGHT_CONFIDENCE", "0.15"))


    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
