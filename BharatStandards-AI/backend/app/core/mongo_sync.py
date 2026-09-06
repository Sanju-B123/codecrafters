"""
Real-time SQLAlchemy-to-MongoDB Synchronization Engine.
Captures all ORM entity inserts, updates, and deletes via SQLAlchemy Session lifecycle events
(after_flush, after_commit, after_rollback) and mirrors changes atomically into MongoDB collections.
"""

from datetime import datetime, date, timezone
import uuid
from typing import Optional, Dict, Any, Tuple
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.core.mongodb import get_mongo_db

_listeners_registered = False


def serialize_entity(obj: Any) -> Optional[Tuple[str, Any, Dict[str, Any]]]:
    """
    Serializes a SQLAlchemy ORM model instance into a MongoDB-compatible dictionary.
    Returns (collection_name, _id, serialized_document).
    """
    if not hasattr(obj, "__table__") or not hasattr(obj, "__tablename__"):
        return None

    table_name = obj.__tablename__
    data: Dict[str, Any] = {}

    # Extract all column values
    for col in obj.__table__.columns:
        try:
            val = getattr(obj, col.name, None)
            if val is None:
                data[col.name] = None
            elif isinstance(val, (int, float, bool, str)):
                data[col.name] = val
            elif isinstance(val, (datetime, date)):
                data[col.name] = val.isoformat()
            elif hasattr(val, "value"):  # Python Enum
                data[col.name] = val.value
            elif isinstance(val, (dict, list)):
                data[col.name] = val
            elif isinstance(val, uuid.UUID):
                data[col.name] = str(val)
            else:
                data[col.name] = str(val)
        except Exception as e:
            logger.debug(f"Column serialization fallback for {table_name}.{col.name}: {e}")
            data[col.name] = str(getattr(obj, col.name, None))

    # Derive primary key for MongoDB _id
    pk_cols = [c.name for c in obj.__table__.primary_key.columns]
    if len(pk_cols) == 1:
        pk_val = getattr(obj, pk_cols[0], None)
        if pk_val is None:
            pk_val = data.get(pk_cols[0])
        doc_id = pk_val if pk_val is not None else str(uuid.uuid4())
    else:
        doc_id = "_".join(str(getattr(obj, c, data.get(c, ""))) for c in pk_cols)

    data["_id"] = doc_id
    data["_synced_at"] = datetime.now(timezone.utc).isoformat()

    return table_name, doc_id, data


def extract_primary_key(obj: Any) -> Tuple[str, Any]:
    """Extract table name and primary key for a deleted model instance."""
    table_name = getattr(obj, "__tablename__", "unknown")
    if not hasattr(obj, "__table__"):
        return table_name, getattr(obj, "id", str(uuid.uuid4()))

    pk_cols = [c.name for c in obj.__table__.primary_key.columns]
    if len(pk_cols) == 1:
        doc_id = getattr(obj, pk_cols[0], None)
    else:
        doc_id = "_".join(str(getattr(obj, c, "")) for c in pk_cols)

    return table_name, doc_id if doc_id is not None else getattr(obj, "id", None)


def _on_after_flush(session: Session, flush_context: Any):
    """
    Called after SQLAlchemy flushes changes to the SQL database.
    Captures created, updated, and deleted entities and stages them in session.info.
    """
    if not settings.MONGODB_ENABLED:
        return

    pending_ops = session.info.setdefault("_mongo_pending_ops", {})

    # Capture newly inserted objects (primary keys are already assigned)
    for obj in session.new:
        serialized = serialize_entity(obj)
        if serialized:
            table_name, doc_id, doc = serialized
            pending_ops[(table_name, doc_id)] = ("upsert", table_name, doc_id, doc)

    # Capture modified objects
    for obj in session.dirty:
        serialized = serialize_entity(obj)
        if serialized:
            table_name, doc_id, doc = serialized
            pending_ops[(table_name, doc_id)] = ("upsert", table_name, doc_id, doc)

    # Capture deleted objects
    for obj in session.deleted:
        if hasattr(obj, "__table__"):
            table_name, doc_id = extract_primary_key(obj)
            if doc_id is not None:
                pending_ops[(table_name, doc_id)] = ("delete", table_name, doc_id, None)


def _on_after_commit(session: Session):
    """
    Called after SQL transaction commits successfully.
    Applies all staged operations to MongoDB collections.
    """
    if not settings.MONGODB_ENABLED:
        return

    pending_ops = session.info.pop("_mongo_pending_ops", None)
    if not pending_ops:
        return

    try:
        db = get_mongo_db()
        for (table_name, doc_id), (op_type, _, _, doc) in pending_ops.items():
            try:
                col = db[table_name]
                if op_type == "upsert" and doc is not None:
                    col.replace_one({"_id": doc_id}, doc, upsert=True)
                elif op_type == "delete":
                    col.delete_one({"_id": doc_id})
            except Exception as item_err:
                logger.warning(
                    f"Failed to apply {op_type} to MongoDB collection '{table_name}' id='{doc_id}': {item_err}"
                )
    except Exception as exc:
        logger.error(f"Failed committing pending changes to MongoDB: {exc}")


def _on_after_rollback(session: Session):
    """
    Called if SQL transaction was rolled back.
    Safely discards any pending operations so uncommitted data is never mirrored.
    """
    session.info.pop("_mongo_pending_ops", None)


def register_mongo_sync_listeners():
    """
    Idempotently registers SQLAlchemy session listeners for real-time MongoDB synchronization.
    """
    global _listeners_registered
    if _listeners_registered:
        return

    event.listen(Session, "after_flush", _on_after_flush)
    event.listen(Session, "after_commit", _on_after_commit)
    event.listen(Session, "after_rollback", _on_after_rollback)
    _listeners_registered = True
    logger.info("Real-time SQLAlchemy-to-MongoDB synchronization listeners registered.")
