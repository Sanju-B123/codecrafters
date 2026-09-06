"""
MongoDB Persistence & Frontend State API Routes.
Provides endpoints for cluster diagnostics, collection inspection, on-demand synchronization,
and frontend state persistence (saving themes, onboarding tours, drafts, and UI state directly to MongoDB).
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.mongodb import (
    ping_mongodb,
    get_mongo_db,
    is_mongodb_mock,
    get_all_collection_stats,
)
from app.services.mongodb_sync import sync_all_sql_to_mongo
from app.core.logging import logger

router = APIRouter(prefix="/mongodb", tags=["MongoDB Persistence"])


class FrontendStatePayload(BaseModel):
    key: str = "default"
    data: Dict[str, Any]


@router.get("/health")
def get_mongodb_health():
    """
    Returns real-time health and statistics of the MongoDB persistence cluster.
    """
    return ping_mongodb()


@router.get("/collections")
def list_mongodb_collections():
    """
    Lists all active MongoDB collections with document counts.
    """
    db = get_mongo_db()
    stats = get_all_collection_stats()
    return {
        "database": db.name,
        "is_mock": is_mongodb_mock(),
        "collections_count": len(stats),
        "collections": stats,
    }


@router.get("/collections/{collection_name}")
def get_collection_documents(
    collection_name: str,
    limit: int = Query(default=50, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
):
    """
    Fetches documents from a specific MongoDB collection with pagination.
    """
    db = get_mongo_db()
    if collection_name not in db.list_collection_names():
        raise HTTPException(
            status_code=404, detail=f"Collection '{collection_name}' not found"
        )
    col = db[collection_name]
    total = col.count_documents({})
    cursor = col.find({}).skip(skip).limit(limit)
    documents = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])  # Ensure JSON serializable
        documents.append(doc)
    return {
        "collection": collection_name,
        "total": total,
        "skip": skip,
        "limit": limit,
        "documents": documents,
    }


@router.post("/sync")
def trigger_mongodb_sync():
    """
    Triggers an on-demand synchronization from SQL database into MongoDB collections.
    """
    try:
        result = sync_all_sql_to_mongo()
        return result
    except Exception as e:
        logger.error(f"MongoDB manual sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/frontend-state")
def get_frontend_state(key: str = Query(default="default")):
    """
    Retrieves frontend application state (theme, tour, drafts, UI preferences) stored in MongoDB.
    """
    db = get_mongo_db()
    col = db["frontend_states"]
    doc = col.find_one({"_id": key})
    if not doc:
        return {"key": key, "data": {}, "updated_at": None, "exists": False}
    return {
        "key": key,
        "data": doc.get("data", {}),
        "updated_at": doc.get("updated_at"),
        "exists": True,
    }


@router.post("/frontend-state")
def save_frontend_state(payload: FrontendStatePayload):
    """
    Saves frontend application state (theme, tour, drafts, UI preferences) directly into MongoDB collection 'frontend_states'.
    """
    db = get_mongo_db()
    col = db["frontend_states"]
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "_id": payload.key,
        "key": payload.key,
        "data": payload.data,
        "updated_at": now_iso,
    }
    col.replace_one({"_id": payload.key}, doc, upsert=True)
    return {
        "status": "saved",
        "key": payload.key,
        "updated_at": now_iso,
    }
