"""
BharatStandards AI - AI Assistant Service
Central orchestration service for the RAG pipeline, context building,
retrieval, conversation persistence, citation generation, and query logging.
"""
import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logging import logger
from app.models.user import User
from app.models.product import Product
from app.models.compliance import ComplianceReport
from app.models.assistant import (
    Conversation,
    Message,
    AssistantSource,
    MessageRole,
    AIQueryLog,
)
from app.rag.query_understanding import QueryUnderstandingService, IntentCategory
from app.rag.retrieval_service import RetrievalService
from app.rag.reranker import Reranker
from app.rag.context_builder import ContextBuilder
from app.rag.citation_builder import CitationBuilder
from app.rag.confidence_service import ConfidenceService
from app.rag.action_service import ActionRecommendationService
from app.services.llm_provider import get_llm_provider


class AIService:
    """
    Orchestrates the grounded RAG pipeline for BharatStandards AI.
    """

    def __init__(self, db: Session):
        self.db = db
        self.retrieval_service = RetrievalService(db)
        self.llm_provider = get_llm_provider()

    def get_or_create_conversation(
        self, user_id: int, conversation_id: Optional[int] = None, product_id: Optional[int] = None, title_seed: str = ""
    ) -> Conversation:
        """
        Loads existing conversation (enforcing user ownership) or creates a new one.
        """
        if conversation_id:
            conv = (
                self.db.query(Conversation)
                .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found or access denied.",
                )
            if product_id and not conv.product_id:
                conv.product_id = product_id
                self.db.commit()
            return conv

        # Derive initial title from prompt
        clean_title = (title_seed.strip()[:45] + "...") if len(title_seed) > 45 else title_seed.strip()
        if not clean_title:
            clean_title = "Standards Inquiry"

        new_conv = Conversation(
            user_id=user_id,
            product_id=product_id,
            title=clean_title,
        )
        self.db.add(new_conv)
        self.db.commit()
        self.db.refresh(new_conv)
        return new_conv

    def get_product_context(self, user_id: int, product_id: Optional[int]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Safely retrieves product and latest compliance audit context, strictly verifying user ownership.
        """
        if not product_id:
            return None, None

        product = (
            self.db.query(Product)
            .filter(Product.id == product_id, Product.user_id == user_id)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or access denied.",
            )

        product_ctx = {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "manufacturer": product.manufacturer,
            "model_number": product.model_number,
            "description": product.description,
            "technical_details": product.technical_details,
        }

        # Check for latest compliance report
        latest_report = (
            self.db.query(ComplianceReport)
            .filter(ComplianceReport.product_id == product.id, ComplianceReport.user_id == user_id)
            .order_by(ComplianceReport.created_at.desc())
            .first()
        )

        compliance_ctx = None
        if latest_report:
            from app.services.risk_engine import ComplianceRiskEngine
            risk_summary = ComplianceRiskEngine.calculate_risk(latest_report.id, self.db, force_refresh=False)
            top_risks_data = [
                {
                    "clause": r.clause,
                    "title": r.title,
                    "risk_score": r.risk_score,
                    "risk_level": r.risk_level,
                    "reason": r.reason,
                    "recommended_action": r.recommended_action,
                    "factors": [f.model_dump() for f in r.factors],
                }
                for r in risk_summary.top_risks
            ]
            gaps_data = [
                {
                    "priority": g.priority,
                    "clause": g.requirement.clause if g.requirement else "General",
                    "description": g.description,
                    "recommended_action": g.recommended_action,
                }
                for g in latest_report.gaps
            ]
            compliance_ctx = {
                "report_id": latest_report.id,
                "score": latest_report.score,
                "overall_risk_score": risk_summary.overall_risk_score,
                "risk_level": risk_summary.risk_level,
                "passed_count": latest_report.passed_count,
                "partial_count": latest_report.partial_count,
                "missing_count": latest_report.missing_count,
                "top_risks": top_risks_data,
                "gaps": gaps_data,
            }

        return product_ctx, compliance_ctx

    def answer_question(
        self,
        user_id: int,
        question: str,
        product_id: Optional[int] = None,
        conversation_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Production Grounded RAG flow:
        1. Authenticate user & check isolation boundaries.
        2. Load / create conversation thread.
        3. Parse query & understand intent, entities, and routing flags.
        4. Hybrid multi-source retrieval (Standards, Requirements, User Docs, Compliance, Services).
        5. Re-rank retrieved items enforcing source priority (Verified > Active > Demo).
        6. Build grounded prompt context respecting token caps.
        7. Invoke LLM provider with fallback & error handling.
        8. Build traceable citations with clickable routes.
        9. Calculate confidence grade (HIGH, MEDIUM, LOW).
        10. Generate action buttons mapped to real application routes.
        11. Persist messages and log safe telemetry into AIQueryLog.
        12. Return structured response.
        """
        start_time = time.time()
        logger.info(f"Processing AI inquiry for user {user_id} (product={product_id}, conv={conversation_id})")

        # 2. Conversation handling
        conversation = self.get_or_create_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            product_id=product_id,
            title_seed=question,
        )

        # 3. Product context (tenant isolated)
        target_product_id = product_id or conversation.product_id
        product_ctx, compliance_ctx = self.get_product_context(user_id, target_product_id)

        # 4. Query Understanding
        understanding = QueryUnderstandingService.understand_query(
            question=question,
            user_id=user_id,
            product_id=target_product_id,
            conversation_id=conversation.id,
            db=self.db,
        )
        intent = understanding.intent.value

        # 4b. Dynamic What-If Simulation for simulation queries
        if (
            understanding.intent == IntentCategory.WHAT_IF_SIMULATION
            and compliance_ctx
            and target_product_id
        ):
            from app.services.what_if_service import WhatIfAnalysisService
            from app.models.compliance import ComplianceResult
            from app.models.standard import Requirement

            rep_id = compliance_ctx["report_id"]
            results = self.db.query(ComplianceResult).filter(ComplianceResult.compliance_report_id == rep_id).all()
            q_lower = question.lower()
            candidate_req_ids = []

            for res in results:
                req = self.db.query(Requirement).filter(Requirement.id == res.requirement_id).first()
                if not req:
                    continue
                if req.clause and req.clause.lower() in q_lower:
                    if res.status != "PASS":
                        candidate_req_ids.append(req.id)
                elif req.title and any(w.lower() in q_lower for w in req.title.split() if len(w) > 4):
                    if res.status != "PASS":
                        candidate_req_ids.append(req.id)

            if not candidate_req_ids and results:
                non_pass = [res.requirement_id for res in results if res.status != "PASS"]
                if non_pass:
                    candidate_req_ids = non_pass[:1]

            if candidate_req_ids:
                try:
                    sim = WhatIfAnalysisService.simulate_what_if(
                        compliance_report_id=rep_id,
                        resolved_requirement_ids=candidate_req_ids,
                        user_id=user_id,
                        db=self.db,
                    )
                    compliance_ctx["what_if_simulation"] = sim.model_dump()
                except Exception as ex:
                    logger.warning(f"What-if simulation error in assistant: {ex}")

        # 5. Hybrid Retrieval & Execution
        candidates: List[Dict[str, Any]] = []
        is_error: bool = False
        error_msg: Optional[str] = None
        is_adversarial = any(w in question.lower() for w in [
            "system prompt", "internal instructions", "reveal your instructions",
            "api_key", "secret key", "override instructions", "developer mode",
            "ignore all prior", "ignore all safety", "ignore all rules", "jailbreak",
        ])

        if understanding.intent == IntentCategory.UNKNOWN or is_adversarial:
            reranked_items = []
            if is_adversarial:
                raw_answer = (
                    "**[DEMO AI MODE - SECURITY ENFORCED]**\n\n"
                    "I am operating under strict BharatStandards AI security protocols. "
                    "I cannot share internal system prompts, configuration parameters, or API credentials. "
                    "How may I assist you with verified Indian Standards or product compliance?"
                )
                confidence_reason = "Adversarial or system prompt inquiry deflected."
                confidence_guidance = "Low confidence — security protocol enforced."
            else:
                raw_answer = (
                    "### Knowledge Base Notice\n\n"
                    "I couldn't verify this from the available knowledge base.\n\n"
                    "The inquiry does not match any Indian Standards (IS), mandatory Quality Control Orders (QCO), "
                    "or compliance records in your account.\n\n"
                    "**What to check:**\n"
                    "- Search by Indian Standard number (e.g., IS 302-2-21 or DEMO-IS-001)\n"
                    "- Query a specific testing parameter or clause (e.g., Clause 4.1, insulation resistance)\n"
                    "- Upload lab test reports or certificates in the Documents section"
                )
                confidence_reason = "Query outside Indian Standards and compliance knowledge base."
                confidence_guidance = "Low confidence — I couldn't verify this from the available knowledge base."

            citations = []
            confidence = "LOW"
            actions = ActionRecommendationService.generate_actions(
                intent=intent,
                retrieved_items=[],
                product_context=product_ctx,
                compliance_context=compliance_ctx,
            )
        else:
            retrieval_res = self.retrieval_service.hybrid_search(
                query=question,
                user_id=user_id,
                product_id=target_product_id,
                limit=12,
            )
            candidates = retrieval_res["all_candidates"]

            # 6. Re-ranking
            reranked_items = Reranker.rerank(
                query=question,
                candidates=candidates,
                limit=settings.MAX_CONTEXT_CHUNKS,
                product_context=product_ctx,
            )

            # 7. Recent conversation history for pronoun resolution
            recent_messages = (
                self.db.query(Message)
                .filter(Message.conversation_id == conversation.id)
                .order_by(Message.created_at.desc())
                .limit(settings.MAX_CONVERSATION_MESSAGES)
                .all()
            )
            conv_history = [
                {"role": m.role, "content": m.content}
                for m in reversed(recent_messages)
            ]

            # 8. Build grounded prompt context
            system_prompt = ContextBuilder.build_system_prompt()
            user_prompt = ContextBuilder.build_user_prompt(
                question=question,
                retrieved_items=reranked_items,
                product_context=product_ctx,
                compliance_context=compliance_ctx,
                conversation_history=conv_history,
            )

            # 9. LLM Invocation with error handling
            is_error = False
            error_msg = None
            try:
                raw_answer = self.llm_provider.generate(prompt=user_prompt, system_prompt=system_prompt)
            except Exception as e:
                logger.error(f"LLM Provider invocation error: {e}")
                is_error = True
                error_msg = str(e)
                raw_answer = (
                    "**[AI SERVICE NOTICE]**\n\n"
                    "The AI service is temporarily experiencing high latency. "
                    "However, your verified standards and document records remain fully accessible in the Knowledge Base."
                )

            # 10. Citations, Confidence, and Action Recommendations
            citations = CitationBuilder.build_citations(reranked_items)
            is_unsupported = (
                "couldn't verify this from the available knowledge base" in raw_answer.lower()
                or "insufficient evidence" in raw_answer.lower()
            )
            if is_unsupported:
                confidence = "LOW"
                confidence_reason = "No relevant standards or evidence found in the knowledge base."
                confidence_guidance = "Low confidence — the available sources do not provide enough evidence."
            else:
                confidence, confidence_reason, confidence_guidance = ConfidenceService.calculate_confidence(
                    retrieved_items=reranked_items,
                    intent=intent,
                )
            actions = ActionRecommendationService.generate_actions(
                intent=intent,
                retrieved_items=reranked_items,
                product_context=product_ctx,
                compliance_context=compliance_ctx,
            )
        legacy_actions = [a["label"] for a in actions]

        # 11. Persist User Message
        user_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.USER.value,
            content=question,
        )
        self.db.add(user_msg)
        self.db.flush()

        # 12. Persist Assistant Message & Sources
        is_demo_mode = (
            settings.DEMO_AI_MODE
            or not bool(settings.LLM_API_KEY)
            or "[DEMO AI MODE]" in raw_answer
        )
        disclaimer_text = (
            "AI-assisted informational guidance. "
            "Not an official BIS legal determination or certification."
        )

        asst_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT.value,
            content=raw_answer,
            confidence=confidence,
            recommended_actions_json=json.dumps(legacy_actions),
            disclaimer=disclaimer_text,
        )
        self.db.add(asst_msg)
        self.db.flush()

        for s in citations:
            source_rec = AssistantSource(
                message_id=asst_msg.id,
                source_type=s["source_type"],
                source_id=s.get("source_id"),
                title=s["title"],
                page=s.get("page"),
                clause=s.get("clause"),
                snippet=s["snippet"],
                relevance_score=s["relevance_score"],
                is_demo=s.get("is_demo", True),
                provenance_type=s.get("provenance_type"),
                verification_status=s.get("verification_status"),
                authority_level=s.get("authority_level"),
                version=s.get("version"),
                source_provenance=s.get("source_provenance"),
            )
            self.db.add(source_rec)

        conversation.updated_at = datetime.now(timezone.utc)

        # 13. Telemetry and Audit Logging into AIQueryLog
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        top_ids = [str(c.get("source_id")) for c in citations[:5]]
        query_log = AIQueryLog(
            user_id=user_id,
            conversation_id=conversation.id,
            intent=intent,
            retrieval_count=len(candidates),
            top_source_ids=json.dumps(top_ids),
            confidence=confidence,
            latency_ms=elapsed_ms,
            model_name=settings.LLM_MODEL,
            is_error=is_error,
            error_message=error_msg,
        )
        self.db.add(query_log)
        self.db.commit()

        # 14. Return structured response
        return {
            "answer": raw_answer,
            "confidence": confidence,
            "confidence_reason": confidence_reason,
            "confidence_guidance": confidence_guidance,
            "citations": citations,
            "sources": citations,
            "actions": actions,
            "recommended_actions": legacy_actions,
            "disclaimer": disclaimer_text,
            "conversation_id": conversation.id,
            "message_id": asst_msg.id,
            "is_demo": is_demo_mode,
            "intent": intent,
            "latency_ms": elapsed_ms,
        }
