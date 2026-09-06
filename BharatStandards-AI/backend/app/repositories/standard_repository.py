"""
BharatStandards AI - Standards Repository Layer
Encapsulates SQL queries and data access patterns for Standards and Requirements.
"""
from typing import List, Optional, Tuple
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.standard import Standard, Requirement, StandardStatus


class StandardRepository:
    """
    Data access repository for Indian Standards knowledge base.
    """

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "relevance",
    ) -> List[Standard]:
        query = db.query(Standard)

        if category:
            query = query.filter(Standard.category.ilike(f"%{category.strip()}%"))
        if status:
            query = query.filter(Standard.status == status.strip())

        if sort_by == "name":
            query = query.order_by(Standard.title.asc())
        elif sort_by == "latest":
            query = query.order_by(Standard.created_at.desc())
        else:
            # Default ordering by standard number ascending
            query = query.order_by(Standard.standard_number.asc())

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def count(
        db: Session,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> int:
        query = db.query(func.count(Standard.id))
        if category:
            query = query.filter(Standard.category.ilike(f"%{category.strip()}%"))
        if status:
            query = query.filter(Standard.status == status.strip())
        return query.scalar() or 0

    @staticmethod
    def get_by_id(db: Session, standard_id: int) -> Optional[Standard]:
        return db.query(Standard).filter(Standard.id == standard_id).first()

    @staticmethod
    def get_by_standard_number(db: Session, standard_number: str) -> Optional[Standard]:
        return (
            db.query(Standard)
            .filter(Standard.standard_number.ilike(standard_number.strip()))
            .first()
        )

    @classmethod
    def get_by_id_or_number(cls, db: Session, identifier: str) -> Optional[Standard]:
        """
        Lookup a standard by either its numeric ID (e.g. '1') or standard code (e.g. 'DEMO-IS-001').
        """
        identifier = str(identifier).strip()
        if identifier.isdigit():
            std = cls.get_by_id(db, int(identifier))
            if std:
                return std
        return cls.get_by_standard_number(db, identifier)

    @staticmethod
    def search(
        db: Session,
        query: str,
        category: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "relevance",
    ) -> List[Standard]:
        q = db.query(Standard)

        if query:
            pattern = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Standard.standard_number.ilike(pattern),
                    Standard.title.ilike(pattern),
                    Standard.description.ilike(pattern),
                    Standard.scope.ilike(pattern),
                    Standard.category.ilike(pattern),
                )
            )

        if category:
            q = q.filter(Standard.category.ilike(f"%{category.strip()}%"))
        if status:
            q = q.filter(Standard.status == status.strip())

        if sort_by == "name":
            q = q.order_by(Standard.title.asc())
        elif sort_by == "latest":
            q = q.order_by(Standard.created_at.desc())
        else:
            q = q.order_by(Standard.standard_number.asc())

        return q.offset(skip).limit(limit).all()

    @staticmethod
    def search_count(
        db: Session,
        query: str,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> int:
        q = db.query(func.count(Standard.id))
        if query:
            pattern = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Standard.standard_number.ilike(pattern),
                    Standard.title.ilike(pattern),
                    Standard.description.ilike(pattern),
                    Standard.scope.ilike(pattern),
                    Standard.category.ilike(pattern),
                )
            )
        if category:
            q = q.filter(Standard.category.ilike(f"%{category.strip()}%"))
        if status:
            q = q.filter(Standard.status == status.strip())
        return q.scalar() or 0

    @staticmethod
    def get_requirements(
        db: Session,
        standard_id: int,
        category: Optional[str] = None,
    ) -> List[Requirement]:
        q = db.query(Requirement).filter(Requirement.standard_id == standard_id)
        if category and category.upper() != "ALL":
            q = q.filter(Requirement.category == category.strip().upper())
        return q.order_by(Requirement.clause.asc()).all()

    @staticmethod
    def get_requirement(db: Session, requirement_id: int) -> Optional[Requirement]:
        return db.query(Requirement).filter(Requirement.id == requirement_id).first()

    @staticmethod
    def create(db: Session, standard: Standard) -> Standard:
        db.add(standard)
        db.commit()
        db.refresh(standard)
        return standard

    @staticmethod
    def update(db: Session, standard: Standard, updates: dict) -> Standard:
        for k, v in updates.items():
            setattr(standard, k, v)
        db.commit()
        db.refresh(standard)
        return standard

    @staticmethod
    def delete(db: Session, standard: Standard) -> None:
        db.delete(standard)
        db.commit()
