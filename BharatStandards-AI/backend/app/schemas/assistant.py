"""
BharatStandards AI - Assistant Pydantic Schemas
Data contracts for AI chat conversations, messages, evidence sources, and structured RAG outputs.
"""
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    """
    Payload to initialize a new conversation session.
    """
    title: Optional[str] = Field(None, max_length=255, description="Initial conversation title")
    product_id: Optional[int] = Field(None, description="Optional product to scope the session to")


class ConversationUpdate(BaseModel):
    """
    Payload to rename an existing conversation.
    """
    title: str = Field(..., min_length=1, max_length=255, description="Updated conversation title")


class AssistantSourceResponse(BaseModel):
    """
    Traceable evidence citation backing an AI statement.
    """
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    message_id: Optional[int] = None
    source_type: str
    source_id: Optional[str] = None
    title: str
    page: Optional[int] = None
    clause: Optional[str] = None
    snippet: str
    relevance_score: float = 0.0
    is_demo: bool = True
    provenance_type: Optional[str] = None
    verification_status: Optional[str] = None
    authority_level: Optional[str] = None
    version: Optional[str] = None
    source_provenance: Optional[str] = None
    target_route: Optional[str] = None
    citation_label: Optional[str] = None
    created_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    """
    Single message within a conversation exchange.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: str
    content: str
    confidence: Optional[str] = None
    recommended_actions: List[str] = Field(default_factory=list)
    disclaimer: Optional[str] = None
    created_at: datetime
    sources: List[AssistantSourceResponse] = Field(default_factory=list)

    @classmethod
    def from_orm_with_actions(cls, obj: Any) -> "MessageResponse":
        actions: List[str] = []
        if getattr(obj, "recommended_actions_json", None):
            try:
                actions = json.loads(obj.recommended_actions_json)
            except Exception:
                actions = []
        
        sources_list = [
            AssistantSourceResponse.model_validate(s)
            for s in getattr(obj, "sources", [])
        ]

        return cls(
            id=obj.id,
            conversation_id=obj.conversation_id,
            role=obj.role,
            content=obj.content,
            confidence=obj.confidence,
            recommended_actions=actions,
            disclaimer=obj.disclaimer,
            created_at=obj.created_at,
            sources=sources_list,
        )


class ConversationResponse(BaseModel):
    """
    Conversation summary metadata for left-pane thread listing.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None


class ConversationDetailResponse(BaseModel):
    """
    Full conversation payload including thread history.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = Field(default_factory=list)


class ChatRequest(BaseModel):
    """
    Input query payload submitted to the AI Standards Assistant.
    """
    message: str = Field(..., min_length=1, max_length=4000, description="User question or prompt")
    conversation_id: Optional[int] = Field(None, description="Existing conversation to append to")
    product_id: Optional[int] = Field(None, description="Optional product to anchor the context")


class ChatAction(BaseModel):
    action_type: str
    label: str
    route: str
    is_external: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """
    Structured, evidence-grounded response returned by the RAG pipeline.
    Complies with Step 17 requirement #32.
    """
    answer: str
    confidence: str = Field(..., description="HIGH, MEDIUM, or LOW")
    confidence_reason: Optional[str] = None
    confidence_guidance: Optional[str] = None
    citations: List[AssistantSourceResponse] = Field(default_factory=list)
    sources: List[AssistantSourceResponse] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    disclaimer: str = "AI-assisted informational guidance. Not an official BIS legal determination."
    conversation_id: int
    message_id: int
    is_demo: bool = True
    intent: Optional[str] = None
    latency_ms: Optional[float] = None


class ProductContextResponse(BaseModel):
    """
    Aggregated product context and suggested prompt suggestions.
    """
    product_id: int
    name: str
    category: str
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    description: Optional[str] = None
    technical_details: Optional[str] = None
    applicable_standards: List[Dict[str, Any]] = Field(default_factory=list)
    compliance_summary: Optional[Dict[str, Any]] = None
    suggested_prompts: List[str] = Field(default_factory=list)
