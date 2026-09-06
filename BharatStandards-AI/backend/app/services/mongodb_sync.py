"""
Database Migration & Synchronization Service: SQL to MongoDB.
Scans all relational tables in the application and mirrors every record into MongoDB collections.
"""

from datetime import datetime, date, timezone
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from app.core.database import Base, get_engine
from app.core.mongodb import get_mongo_db, is_mongodb_mock
from app.core.logging import logger


def _serialize_sql_value(val: Any) -> Any:
    """Recursively converts SQL and Python types to MongoDB-safe primitives."""
    if val is None:
        return None
    if isinstance(val, (int, float, bool, str)):
        return val
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if hasattr(val, "value"):  # Python Enum
        return val.value
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, uuid.UUID):
        return str(val)
    return str(val)


def sync_table_to_mongo(table_name: str, mongo_db: Optional[Any] = None) -> Dict[str, Any]:
    """
    Syncs a single SQL table to its corresponding MongoDB collection.
    """
    engine = get_engine()
    if engine is None:
        return {"table": table_name, "synced": 0, "error": "Database engine not initialized"}

    if mongo_db is None:
        mongo_db = get_mongo_db()

    table = Base.metadata.tables.get(table_name)
    if table is None:
        return {"table": table_name, "synced": 0, "error": f"Table '{table_name}' not in Base metadata"}

    collection = mongo_db[table_name]
    synced_count = 0

    try:
        with engine.connect() as conn:
            # Query all records
            select_query = table.select()
            rows = conn.execute(select_query).mappings().all()

            pk_cols = [c.name for c in table.primary_key.columns]

            for row in rows:
                doc = {col: _serialize_sql_value(val) for col, val in dict(row).items()}

                # Determine _id
                if len(pk_cols) == 1:
                    pk_val = doc.get(pk_cols[0])
                    doc["_id"] = pk_val if pk_val is not None else str(uuid.uuid4())
                elif len(pk_cols) > 1:
                    doc["_id"] = "_".join(str(doc.get(c, "")) for c in pk_cols)
                else:
                    doc["_id"] = doc.get("id", str(uuid.uuid4()))

                doc["_synced_at"] = datetime.now(timezone.utc).isoformat()

                collection.replace_one({"_id": doc["_id"]}, doc, upsert=True)
                synced_count += 1

        return {"table": table_name, "synced": synced_count, "error": None}

    except Exception as exc:
        # Table might not exist yet in SQLite schema
        logger.debug(f"Skipping table '{table_name}' during sync (may not exist in SQL): {exc}")
        return {"table": table_name, "synced": 0, "error": str(exc)}


def sync_all_sql_to_mongo(dry_run: bool = False) -> Dict[str, Any]:
    """
    Iterates through all SQL tables registered in SQLAlchemy metadata
    and replicates every record into MongoDB.
    """
    engine = get_engine()
    if engine is None:
        return {
            "status": "error",
            "message": "SQL database engine not reachable",
            "total_tables": 0,
            "total_records": 0,
            "details": {},
        }

    mongo_db = get_mongo_db()
    results = {}
    total_records = 0

    # Ensure tables are sorted by foreign key dependencies if possible
    tables_to_sync = Base.metadata.sorted_tables or list(Base.metadata.tables.values())

    for table in tables_to_sync:
        res = sync_table_to_mongo(table.name, mongo_db=mongo_db)
        results[table.name] = res
        total_records += res["synced"]

    synced_tables_count = sum(1 for r in results.values() if r["synced"] > 0)

    logger.info(
        f"Completed SQL to MongoDB sync: {synced_tables_count}/{len(results)} tables populated, "
        f"{total_records} total records mirrored (mode: {'mongomock' if is_mongodb_mock() else 'live'})."
    )

    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "mongomock" if is_mongodb_mock() else "live",
        "total_tables": len(results),
        "synced_tables": synced_tables_count,
        "total_records": total_records,
        "details": results,
    }
