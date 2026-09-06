"""
BharatStandards AI - Assistant API Route Endpoints
Handles AI standards chat, conversation thread management, RAG retrieval orchestration,
and product-context grounding with strict user ownership and rate limiting.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import logger
from app.core.rate_limiter import ai_rate_limiter
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.compliance import ComplianceReport
from app.models.assistant import Conversation, Message, AssistantSource
from app.schemas.assistant import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse as AssistantMessageResponse,
    ChatRequest,
    ChatResponse,
    ProductContextResponse,
)
from app.services.ai_service import AIService
from app.services.audit_service import audit_service

router = APIRouter(prefix="/assistant", tags=["AI Standards Assistant"])


@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    product_id: Optional[int] = Query(None, description="Filter conversations by product"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all chat conversations belonging to the authenticated user.
    """
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if product_id:
        query = query.filter(Conversation.product_id == product_id)

    conversations = query.order_by(Conversation.updated_at.desc()).all()

    results = []
    for conv in conversations:
        # Get message count and snippet of last message
        msg_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        last_snippet = last_msg.content[:80] + "..." if last_msg and len(last_msg.content) > 80 else (last_msg.content if last_msg else None)

        product_name = conv.product.name if conv.product else None

        results.append(
            ConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                product_id=conv.product_id,
                product_name=product_name,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=msg_count,
                last_message=last_snippet,
            )
        )

    return results


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new conversation session for the authenticated user.
    """
    # Verify product ownership if specified
    product_name = None
    if payload.product_id:
        product = (
            db.query(Product)
            .filter(Product.id == payload.product_id, Product.user_id == current_user.id)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or access denied.",
            )
        product_name = product.name

    title = payload.title.strip() if payload.title else "New Standards Session"
    conv = Conversation(
        user_id=current_user.id,
        product_id=payload.product_id,
        title=title,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        product_id=conv.product_id,
        product_name=product_name,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0,
        last_message=None,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full conversation history with all messages and source citations.
    Enforces strict user ownership isolation.
    """
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    # Exclude SYSTEM messages from user view
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id, Message.role != "SYSTEM")
        .order_by(Message.created_at.asc())
        .all()
    )

    msg_responses = [AssistantMessageResponse.from_orm_with_actions(m) for m in messages]
    product_name = conv.product.name if conv.product else None

    return ConversationDetailResponse(
        id=conv.id,
        user_id=conv.user_id,
        product_id=conv.product_id,
        product_name=product_name,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=msg_responses,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a conversation and its messages.
    Enforces strict user ownership isolation.
    """
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    db.delete(conv)
    db.commit()
    return None


@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Core RAG Chat endpoint:
    Processes user query, retrieves grounded evidence, generates answer with citations,
    and saves exchange in the conversation history.
    """
    # 1. Enforce rate limiting per user
    ai_rate_limiter.check_rate_limit(f"user_{current_user.id}")

    # 2. Check product ownership if product_id is specified
    if payload.product_id:
        product = (
            db.query(Product)
            .filter(Product.id == payload.product_id, Product.user_id == current_user.id)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or access denied.",
            )

    # 3. Check conversation ownership if conversation_id is specified
    if payload.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(Conversation.id == payload.conversation_id, Conversation.user_id == current_user.id)
            .first()
        )
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied.",
            )

    # 4. Invoke AI Service
    ai_service = AIService(db)
    response_data = ai_service.answer_question(
        user_id=current_user.id,
        question=payload.message,
        product_id=payload.product_id,
        conversation_id=payload.conversation_id,
    )

    query_snippet = payload.message[:60] + "..." if len(payload.message) > 60 else payload.message
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="AI_QUERY",
        entity_type="conversation",
        entity_id=response_data.get("conversation_id"),
        description=f"AI standards query submitted: '{query_snippet}'",
        metadata={
            "conversation_id": response_data.get("conversation_id"),
            "product_id": payload.product_id,
            "has_sources": len(response_data.get("sources", [])) > 0,
            "confidence": response_data.get("confidence"),
        },
    )

    return ChatResponse(**response_data)


@router.get("/product-context/{product_id}", response_model=ProductContextResponse)
def get_product_context_summary(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch product context, latest compliance score, and suggested quick action prompts.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )

    # Load latest compliance report
    report = (
        db.query(ComplianceReport)
        .filter(ComplianceReport.product_id == product.id, ComplianceReport.user_id == current_user.id)
        .order_by(ComplianceReport.created_at.desc())
        .first()
    )

    compliance_summary = None
    if report:
        compliance_summary = {
            "score": report.score,
            "status": report.status,
            "passed_count": report.passed_count,
            "partial_count": report.partial_count,
            "missing_count": report.missing_count,
            "standard_number": report.standard.standard_number if report.standard else "IS Standard",
        }

    suggested_prompts = [
        f"Which standards apply to my {product.name}?",
        f"What are the critical test requirements for {product.category}?",
        "Does my uploaded report contain evidence for electrical safety?",
        "What am I missing to reach 100% compliance?",
        "What should I do next to file for BIS Scheme-I license?",
    ]

    return ProductContextResponse(
        product_id=product.id,
        name=product.name,
        category=product.category,
        manufacturer=product.manufacturer,
        model_number=product.model_number,
        description=product.description,
        technical_details=product.technical_details,
        compliance_summary=compliance_summary,
        suggested_prompts=suggested_prompts,
    )
