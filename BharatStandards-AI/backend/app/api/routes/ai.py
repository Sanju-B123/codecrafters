"""
BharatStandards AI - AI RAG Route Endpoints
Implements POST /api/ai/chat as specified in Step 17 requirement #32.
Provides grounded RAG queries, rate limiting, and safe error handling.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import logger
from app.core.rate_limiter import ai_rate_limiter
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.assistant import Conversation
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.ai_service import AIService
from app.services.audit_service import audit_service

router = APIRouter(prefix="/ai", tags=["AI RAG System"])


@router.post("/chat", response_model=ChatResponse)
def chat_rag_endpoint(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Production Grounded RAG Chat Endpoint (Step 17 Requirement #32):
    POST /api/ai/chat
    Accepts: { message, conversation_id, product_id }
    Returns: { answer, conversation_id, confidence, citations, actions, sources }
    """
    # 1. Enforce per-user sliding window rate limit (returns HTTP 429 on breach)
    ai_rate_limiter.check_rate_limit(f"user_{current_user.id}")

    # 2. Strict User Isolation: verify product belongs to current_user
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

    # 3. Strict User Isolation: verify conversation belongs to current_user
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

    # 4. Invoke grounded AIService RAG pipeline with safe error handling
    try:
        ai_service = AIService(db)
        response_data = ai_service.answer_question(
            user_id=current_user.id,
            question=payload.message,
            product_id=payload.product_id,
            conversation_id=payload.conversation_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal RAG pipeline error: {e}")
        # User-friendly error message without leaking provider stack traces (Requirement #34)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The AI service is temporarily unavailable. Please try again.",
        )

    # 5. Audit Logging
    query_snippet = payload.message[:60] + "..." if len(payload.message) > 60 else payload.message
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="AI_QUERY",
        entity_type="conversation",
        entity_id=response_data.get("conversation_id"),
        description=f"RAG query: '{query_snippet}'",
        metadata={
            "conversation_id": response_data.get("conversation_id"),
            "product_id": payload.product_id,
            "confidence": response_data.get("confidence"),
            "intent": response_data.get("intent"),
            "source_count": len(response_data.get("citations", [])),
        },
    )

    return ChatResponse(**response_data)
