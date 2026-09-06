import enum
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MessageRole(str, enum.Enum):
    """
    Role of the sender in a conversation exchange.
    """
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"


class SourceType(str, enum.Enum):
    """
    Categorization of the evidence or knowledge base source.
    """
    STANDARD = "STANDARD"
    REQUIREMENT = "REQUIREMENT"
    DOCUMENT = "DOCUMENT"
    DOCUMENT_CHUNK = "DOCUMENT_CHUNK"


class ConfidenceLevel(str, enum.Enum):
    """
    Traceable confidence grade based on retrieval quality and evidence backing.
    """
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Conversation(Base):
    """
    Thread of chat messages between a User and the AI Standards Assistant.
    Optionally scoped to a specific registered Product.
    """
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="conversations")
    product = relationship("Product", back_populates="conversations")
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    def __repr__(self):
        return f"<Conversation id={self.id} user_id={self.user_id} title='{self.title}'>"


class Message(Base):
    """
    Individual message inside an Assistant conversation thread.
    Can be from USER, ASSISTANT, or SYSTEM (not exposed to users).
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(50), nullable=False, default=MessageRole.USER.value)
    content = Column(Text, nullable=False)
    confidence = Column(String(50), nullable=True)  # HIGH, MEDIUM, LOW
    recommended_actions_json = Column(Text, nullable=True)  # JSON list of strings
    disclaimer = Column(
        Text,
        nullable=True,
        default="AI-assisted informational guidance. Not an official BIS legal determination.",
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sources = relationship(
        "AssistantSource",
        back_populates="message",
        cascade="all, delete-orphan",
        order_by="AssistantSource.relevance_score.desc()",
    )

    def __repr__(self):
        return f"<Message id={self.id} conv={self.conversation_id} role='{self.role}'>"


class AssistantSource(Base):
    """
    Traceable citation reference for an AI-generated statement.
    Links AI answers directly to Indian Standards, clauses, or uploaded test reports.
    """
    __tablename__ = "assistant_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(
        Integer,
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_type = Column(
        String(50),
        nullable=False,
        default=SourceType.STANDARD.value,
    )
    source_id = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    page = Column(Integer, nullable=True)
    clause = Column(String(100), nullable=True)
    snippet = Column(Text, nullable=False)
    relevance_score = Column(Float, nullable=False, default=0.0)
    is_demo = Column(Boolean, nullable=False, default=True)
    provenance_type = Column(String(50), nullable=True)
    verification_status = Column(String(50), nullable=True)
    authority_level = Column(String(50), nullable=True)
    version = Column(String(50), nullable=True)
    source_provenance = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship back to Message
    message = relationship("Message", back_populates="sources")

    def __repr__(self):
        return f"<AssistantSource id={self.id} msg={self.message_id} title='{self.title}' clause='{self.clause}'>"


class Embedding(Base):
    """
    Prepared architecture for vector embeddings (pgvector compatible).
    Stores serialized float embedding vectors for document chunks.
    """
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_chunk_id = Column(
        Integer,
        ForeignKey("document_chunks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    embedding = Column(Text, nullable=False)  # JSON-encoded float array or pgvector vector
    embedding_model = Column(String(100), nullable=False, default="text-embedding-3-small")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<Embedding id={self.id} chunk_id={self.document_chunk_id} model='{self.embedding_model}'>"


class AIQueryLog(Base):
    """
    Safe telemetry and query audit record for AI Assistant RAG queries.
    Stores metadata (intent, latency, confidence, source count) without sensitive secrets.
    """
    __tablename__ = "ai_query_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    intent = Column(String(100), nullable=True)
    retrieval_count = Column(Integer, nullable=False, default=0)
    top_source_ids = Column(Text, nullable=True)  # JSON list of top source IDs
    confidence = Column(String(50), nullable=True)  # HIGH, MEDIUM, LOW
    latency_ms = Column(Float, nullable=False, default=0.0)
    model_name = Column(String(100), nullable=True)
    is_error = Column(Boolean, nullable=False, default=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    def __repr__(self):
        return f"<AIQueryLog id={self.id} user={self.user_id} intent='{self.intent}' conf='{self.confidence}'>"

