"""
BharatStandards AI - Retriever Interface & Implementation
Hybrid retrieval over Standards, Requirements, and User-uploaded Document Chunks.
Enforces strict multi-tenant isolation on user documents.
"""
import re
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.standard import Standard, Requirement
from app.models.document import Document, DocumentChunk


class BaseRetriever:
    """
    Abstract interface for multi-source compliance retrievers.
    Vendor-agnostic: implementations can use SQL full-text, Elasticsearch, or vector DBs.
    """
    def search_standards(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def search_requirements(
        self, query: str, limit: int = 5, standard_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def search_documents(
        self, user_id: int, query: str, product_id: Optional[int] = None, limit: int = 5
    ) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def retrieve(
        self, query: str, user_id: int, product_id: Optional[int] = None, limit: int = 10
    ) -> Dict[str, Any]:
        raise NotImplementedError


class DatabaseHybridRetriever(BaseRetriever):
    """
    SQLAlchemy-backed hybrid retriever.
    Supports structured database search, token matching, exact clause lookups,
    and strict tenant isolation for user documents.
    """

    def __init__(self, db: Session):
        self.db = db

    def _extract_tokens(self, text: str) -> List[str]:
        """Extract meaningful alphanumeric search tokens."""
        stop_words = {
            "a", "an", "the", "in", "on", "at", "of", "for", "to", "is", "are",
            "and", "or", "what", "which", "how", "does", "my", "this", "that",
            "with", "by", "from", "be", "as", "can", "should", "do", "i", "we",
            "report", "reports", "document", "documents", "uploaded", "contain",
            "evidence", "tell", "show", "give", "please", "about",
        }
        tokens = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
        return [t for t in tokens if t not in stop_words]

    def search_standards(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search official standards catalogue by number, title, category, scope, and description.
        Filters out DRAFT and ARCHIVED standards for production queries.
        """
        tokens = self._extract_tokens(query)
        standards_query = self.db.query(Standard).filter(Standard.status.in_(["ACTIVE", "DEMO"]))

        # Check for exact standard number match e.g. "DEMO-IS-001" or "IS 302"
        exact_match = re.search(r"\b(DEMO-IS-\d+|IS\s*[:\-]?\s*\d+)\b", query, re.IGNORECASE)
        results = []

        if exact_match:
            std_num = exact_match.group(1).replace(" ", "").upper()
            found = (
                standards_query.filter(
                    func.replace(func.upper(Standard.standard_number), " ", "").like(f"%{std_num}%")
                )
                .first()
            )
            if found:
                results.append(self._standard_to_dict(found, score=1.0))

        if tokens:
            conditions = []
            for t in tokens[:10]:
                conditions.append(Standard.standard_number.ilike(f"%{t}%"))
                conditions.append(Standard.title.ilike(f"%{t}%"))
                conditions.append(Standard.category.ilike(f"%{t}%"))
                conditions.append(Standard.scope.ilike(f"%{t}%"))

            matched = standards_query.filter(or_(*conditions)).limit(limit * 2).all()
            for s in matched:
                if not any(r["id"] == s.id for r in results):
                    text_blob = f"{s.standard_number} {s.title} {s.category} {s.scope or ''}".lower()
                    overlap = sum(1 for t in tokens if t in text_blob)
                    ratio = overlap / max(1, len(tokens))
                    base_score = min(0.95, round(0.20 + (ratio * 0.70), 2)) if ratio >= 0.5 else round(ratio * 0.60, 2)
                    
                    # Provenance priority boost: +0.15 for verified official, +0.10 for active
                    boost = 0.0
                    if not s.is_demo and "bis" in (s.source or "").lower():
                        boost += 0.15
                    if s.status == "ACTIVE":
                        boost += 0.10
                    final_score = min(1.0, round(base_score + boost, 2))

                    results.append(self._standard_to_dict(s, score=final_score))

        # Sort by score and truncate
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:limit]

    def search_requirements(
        self, query: str, limit: int = 5, standard_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Search standard clauses and technical requirements.
        Filters out DRAFT and ARCHIVED requirements for production queries.
        """
        tokens = self._extract_tokens(query)
        req_query = self.db.query(Requirement).join(Standard).filter(
            Standard.status.in_(["ACTIVE", "DEMO"]),
            Requirement.status.in_(["ACTIVE", "DEMO"]),
        )

        results = []

        # Check for explicit clause mention like "clause 4.1" or "4.1"
        clause_match = re.search(r"\b(?:clause\s*)?(\d+\.\d+(?:\.\d+)?)\b", query, re.IGNORECASE)
        if clause_match:
            clause_num = clause_match.group(1)
            exact_clause = None
            if standard_id:
                exact_clause = req_query.filter(
                    Requirement.standard_id == standard_id,
                    Requirement.clause == clause_num,
                ).first()
            if not exact_clause:
                exact_clause = req_query.filter(Requirement.clause == clause_num).first()
            if exact_clause:
                results.append(self._requirement_to_dict(exact_clause, score=0.98))


        if tokens:
            conditions = []
            for t in tokens[:10]:
                conditions.append(Requirement.title.ilike(f"%{t}%"))
                conditions.append(Requirement.description.ilike(f"%{t}%"))
                conditions.append(Requirement.evidence_required.ilike(f"%{t}%"))
                conditions.append(Requirement.clause.ilike(f"%{t}%"))

            base_q = req_query
            if standard_id:
                base_q = base_q.filter(Requirement.standard_id == standard_id)

            matched = base_q.filter(or_(*conditions)).limit(limit * 2).all()
            for r in matched:
                if not any(item["id"] == r.id for item in results):
                    text_blob = f"{r.clause} {r.title} {r.description} {r.evidence_required or ''}".lower()
                    overlap = sum(1 for t in tokens if t in text_blob)
                    ratio = overlap / max(1, len(tokens))
                    score = min(0.92, round(0.20 + (ratio * 0.70), 2)) if ratio >= 0.5 else round(ratio * 0.55, 2)
                    results.append(self._requirement_to_dict(r, score=score))

        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:limit]

    def search_documents(
        self, user_id: int, query: str, product_id: Optional[int] = None, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search user's processed document chunks.
        Strictly enforces tenant isolation: Document.user_id == user_id.
        """
        tokens = self._extract_tokens(query)
        if not tokens:
            return []

        chunk_query = (
            self.db.query(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(Document.user_id == user_id)
        )

        if product_id:
            chunk_query = chunk_query.filter(Document.product_id == product_id)

        # Filter by tokens in chunk content
        conditions = [DocumentChunk.content.ilike(f"%{t}%") for t in tokens[:10]]
        matched = chunk_query.filter(or_(*conditions)).limit(limit * 2).all()

        results = []
        for chunk, doc in matched:
            content_lower = chunk.content.lower()
            overlap = sum(1 for t in tokens if t in content_lower)
            score = min(0.95, 0.40 + (overlap * 0.14))

            snippet = chunk.content.strip()
            if len(snippet) > 280:
                snippet = snippet[:277] + "..."

            results.append({
                "source_type": "DOCUMENT_CHUNK",
                "source_id": str(chunk.id),
                "document_id": doc.id,
                "title": doc.original_filename,
                "page": chunk.page,
                "clause": chunk.section,
                "snippet": snippet,
                "relevance_score": score,
                "is_demo": False,
            })

        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:limit]

    def retrieve(
        self, query: str, user_id: int, product_id: Optional[int] = None, limit: int = 10
    ) -> Dict[str, Any]:
        """
        Unified multi-source retrieval coordinator.
        Searches Standards, Requirements, and user Documents.
        """
        # 1. Standards
        standards = self.search_standards(query, limit=3)

        # 2. Check product's active compliance report
        from app.models.compliance import ComplianceReport
        rep = None
        target_std_id = standards[0]["id"] if standards and standards[0]["relevance_score"] >= 0.8 else None
        if product_id:
            rep = (
                self.db.query(ComplianceReport)
                .filter(ComplianceReport.product_id == product_id, ComplianceReport.user_id == user_id)
                .order_by(ComplianceReport.created_at.desc())
                .first()
            )
            if rep and not target_std_id:
                target_std_id = rep.standard_id

        # 3. Requirements
        requirements = self.search_requirements(query, limit=5, standard_id=target_std_id)

        # If query asks about compliance gaps / missing requirements / next steps, include gap requirements
        query_lower = query.lower()
        if rep and any(term in query_lower for term in ["missing", "gap", "gaps", "what should i do next", "resolve", "compliance score"]):
            for g in rep.gaps:
                if g.requirement and not any(r["id"] == g.requirement.id for r in requirements):
                    requirements.insert(0, self._requirement_to_dict(g.requirement, score=0.95))

        # 4. User Documents
        documents = self.search_documents(user_id=user_id, query=query, product_id=product_id, limit=4)

        # 5. BIS Services & Procedural Guidance
        services = []
        if any(term in query_lower for term in [
            "service", "services", "next", "what should i do", "what to do", "guidance",
            "step", "steps", "document", "documents", "apply", "license", "certification",
            "isi", "scheme", "nabl", "testing", "after this assessment"
        ]):
            services = self.search_services(query, limit=2)

        return {
            "standards": standards,
            "requirements": requirements,
            "documents": documents,
            "services": services,
            "all_candidates": standards + requirements + documents + services,
        }

    def search_services(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Search structured BIS Services and Guidance database.
        Strict source of truth for procedures, required documents, and next steps.
        """
        from app.models.bis_service import BISService
        tokens = self._extract_tokens(query)
        services_query = self.db.query(BISService)
        results = []
        for svc in services_query.all():
            text_corpus = f"{svc.service_code} {svc.name} {svc.category} {svc.description} {svc.eligibility}".lower()
            matched = sum(1 for t in tokens if t in text_corpus)
            if matched > 0 or any(t in query.lower() for t in ["service", "guidance", "next", "what should i do", "isi", "crs", "nabl", "testing"]):
                score = min(0.95, 0.5 + (matched * 0.15))
                docs_preview = ", ".join(svc.required_documents[:3]) if svc.required_documents else "None listed"
                steps_preview = "; ".join([f"Step {s.get('step_number')}: {s.get('title')}" for s in svc.steps[:3]]) if svc.steps else ""
                snippet = f"Category: {svc.category}. Eligibility: {svc.eligibility[:160]}. Required Docs: {docs_preview}. Roadmap: {steps_preview}"
                results.append({
                    "source_type": "SERVICE",
                    "source_id": str(svc.id),
                    "id": svc.id,
                    "service_code": svc.service_code,
                    "title": f"{svc.service_code}: {svc.name}",
                    "page": 1,
                    "clause": svc.category,
                    "snippet": snippet,
                    "relevance_score": score,
                    "is_demo": svc.is_demo,
                    "required_documents": svc.required_documents,
                    "steps": svc.steps,
                    "official_source_name": svc.official_source_name,
                    "official_source_url": svc.official_source_url,
                })
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:limit]


    def _standard_to_dict(self, s: Standard, score: float = 0.5) -> Dict[str, Any]:
        is_official = not s.is_demo and "bis" in (s.source or "").lower()
        provenance = "OFFICIAL" if is_official else ("DEMO" if s.is_demo else "USER_PROVIDED")
        verification = "VERIFIED" if is_official else "UNVERIFIED"

        return {
            "source_type": "STANDARD",
            "source_id": str(s.id),
            "id": s.id,
            "standard_id": s.id,
            "standard_number": s.standard_number,
            "title": f"{s.standard_number}: {s.title}",
            "page": 1,
            "clause": None,
            "snippet": (s.scope or s.description or s.title)[:280],
            "relevance_score": score,
            "is_demo": s.is_demo,
            "category": s.category,
            "version": s.version or "2026",
            "provenance_type": provenance,
            "verification_status": verification,
            "authority_level": "HIGH" if is_official else "MEDIUM",
            "source_provenance": "Official / Verified" if (is_official and verification == "VERIFIED") else ("Demo / Synthetic Data" if s.is_demo else "User Uploaded Document"),
        }

    def _requirement_to_dict(self, r: Requirement, score: float = 0.5) -> Dict[str, Any]:
        std = r.standard
        std_num = std.standard_number if std else "IS"
        is_demo = (std.is_demo if std else (r.source == "Synthetic Demo Knowledge Base"))
        is_official = not is_demo and "bis" in ((r.source or (std.source if std else "")).lower())
        provenance = "OFFICIAL" if is_official else ("DEMO" if is_demo else "USER_PROVIDED")
        verification = "VERIFIED" if is_official else "UNVERIFIED"

        return {
            "source_type": "REQUIREMENT",
            "source_id": str(r.id),
            "id": r.id,
            "standard_id": r.standard_id,
            "requirement_id": r.id,
            "title": f"{std_num} - Clause {r.clause}: {r.title}",
            "page": r.page or 1,
            "clause": r.clause,
            "snippet": f"Requirement: {r.description}. Verification: {r.verification_method or 'Inspection / Testing'}.",
            "relevance_score": score,
            "is_demo": is_demo,
            "version": (std.version if std else "2026"),
            "provenance_type": provenance,
            "verification_status": verification,
            "authority_level": "HIGH" if is_official else "MEDIUM",
            "source_provenance": "Official / Verified" if (is_official and verification == "VERIFIED") else ("Demo / Synthetic Data" if is_demo else "User Uploaded Document"),
        }

