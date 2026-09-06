"""
BharatStandards AI - Knowledge Index & Quality Assessment Service
Manages RAG index synchronization status and computes standards completeness scores.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeIndex, KnowledgeIndexStatus
from app.models.standard import Standard, Requirement


class KnowledgeIndexService:
    @staticmethod
    def get_or_create_index(db: Session, entity_type: str, entity_id: int) -> KnowledgeIndex:
        index_entry = (
            db.query(KnowledgeIndex)
            .filter(
                KnowledgeIndex.entity_type == entity_type,
                KnowledgeIndex.entity_id == entity_id,
            )
            .first()
        )
        if not index_entry:
            index_entry = KnowledgeIndex(
                entity_type=entity_type,
                entity_id=entity_id,
                index_status=KnowledgeIndexStatus.NOT_INDEXED.value,
            )
            db.add(index_entry)
            db.flush()
        return index_entry

    @staticmethod
    def index_standard(
        db: Session,
        standard_id: int,
        embedding_model: str = "text-embedding-3-small",
    ) -> KnowledgeIndex:
        """
        Record standard as indexed in RAG semantic knowledge index.
        """
        index_entry = KnowledgeIndexService.get_or_create_index(db, "standard", standard_id)
        index_entry.index_status = KnowledgeIndexStatus.INDEXED.value
        index_entry.embedding_model = embedding_model
        index_entry.indexed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(index_entry)
        return index_entry

    @staticmethod
    def index_requirement(
        db: Session,
        requirement_id: int,
        embedding_model: str = "text-embedding-3-small",
    ) -> KnowledgeIndex:
        """
        Record clause/requirement as indexed in RAG semantic knowledge index.
        """
        index_entry = KnowledgeIndexService.get_or_create_index(db, "requirement", requirement_id)
        index_entry.index_status = KnowledgeIndexStatus.INDEXED.value
        index_entry.embedding_model = embedding_model
        index_entry.indexed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(index_entry)
        return index_entry

    @staticmethod
    def remove_from_index(db: Session, entity_type: str, entity_id: int) -> None:
        """
        Mark index entry as NOT_INDEXED.
        """
        index_entry = (
            db.query(KnowledgeIndex)
            .filter(
                KnowledgeIndex.entity_type == entity_type,
                KnowledgeIndex.entity_id == entity_id,
            )
            .first()
        )
        if index_entry:
            index_entry.index_status = KnowledgeIndexStatus.NOT_INDEXED.value
            db.commit()

    @staticmethod
    def calculate_quality_score(db: Session, standard_id: int) -> dict:
        """
        Computes an objective completeness & quality score (0-100) for a standard.
        Evaluates metadata richness, clause depth, test methodology clarity, and sources.
        """
        standard = db.query(Standard).filter(Standard.id == standard_id).first()
        if not standard:
            return {"score": 0, "status": "UNKNOWN", "breakdown": {}}

        score = 0
        breakdown = {}

        # 1. Identity & Title (20 pts)
        if standard.code and standard.title:
            score += 20
            breakdown["identity"] = {"points": 20, "max": 20, "status": "COMPLETE"}
        else:
            breakdown["identity"] = {"points": 0, "max": 20, "status": "MISSING"}

        # 2. Scope & Description (20 pts)
        desc_len = len(standard.description or "")
        if desc_len >= 100:
            score += 20
            breakdown["description"] = {"points": 20, "max": 20, "status": "EXCELLENT"}
        elif desc_len >= 25:
            score += 10
            breakdown["description"] = {"points": 10, "max": 20, "status": "PARTIAL"}
        else:
            breakdown["description"] = {"points": 0, "max": 20, "status": "SPARSE"}

        # 3. Source Citation (15 pts)
        source = standard.source or standard.source_name
        if source and len(source.strip()) > 3:
            score += 15
            breakdown["sources"] = {"points": 15, "max": 15, "status": "VERIFIED"}
        else:
            breakdown["sources"] = {"points": 0, "max": 15, "status": "UNSPECIFIED"}

        # 4. Requirements/Clauses Depth (30 pts)
        req_count = len(standard.requirements) if standard.requirements else 0
        if req_count >= 5:
            score += 30
            breakdown["requirements"] = {"points": 30, "max": 30, "status": "RICH", "count": req_count}
        elif req_count >= 1:
            points = 15 + (req_count * 3)
            score += points
            breakdown["requirements"] = {"points": points, "max": 30, "status": "BASIC", "count": req_count}
        else:
            breakdown["requirements"] = {"points": 0, "max": 30, "status": "NO_CLAUSES", "count": 0}

        # 5. Test Methods and Details (15 pts)
        if req_count > 0:
            with_tests = sum(
                1 for r in standard.requirements if r.test_method and len(r.test_method.strip()) > 2
            )
            ratio = with_tests / req_count
            test_points = int(ratio * 15)
            score += test_points
            breakdown["test_methods"] = {
                "points": test_points,
                "max": 15,
                "ratio": round(ratio * 100, 1),
            }
        else:
            breakdown["test_methods"] = {"points": 0, "max": 15, "ratio": 0}

        final_score = min(100, max(0, score))
        quality_tier = "HIGH" if final_score >= 80 else ("MEDIUM" if final_score >= 50 else "LOW")

        return {
            "score": final_score,
            "tier": quality_tier,
            "breakdown": breakdown,
        }


knowledge_index_service = KnowledgeIndexService()
