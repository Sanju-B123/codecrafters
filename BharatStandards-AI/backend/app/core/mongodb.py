"""
MongoDB Client & Database Management.
Supports both live MongoDB instances (via pymongo and motor) and seamless in-memory fallback
(via mongomock and mongomock_motor) for development and offline testing environments.
"""

import time
import re
from typing import Optional, Dict, Any, List
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import mongomock
import mongomock_motor
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.logging import logger
import logging

logging.getLogger("pymongo").setLevel(logging.WARNING)

_sync_client: Optional[Any] = None
_sync_db: Optional[Any] = None
_async_client: Optional[Any] = None
_async_db: Optional[Any] = None
_is_mock: bool = False
_initialized: bool = False


def _mask_mongo_url(url: str) -> str:
    """Mask password in connection URI for safe logging and telemetry."""
    if "@" in url:
        return re.sub(r":([^:@]+)@", ":****@", url)
    return url


def init_mongodb(force_mock: bool = False) -> Any:
    """
    Initialize MongoDB client connection.
    Attempts live MongoDB connection first; falls back to mongomock if unavailable.
    """
    global _sync_client, _sync_db, _async_client, _async_db, _is_mock, _initialized

    if _sync_client is not None and _initialized and not force_mock:
        return _sync_db

    masked_url = _mask_mongo_url(settings.MONGODB_URL)

    if force_mock or not settings.MONGODB_ENABLED:
        logger.info("Initializing in-memory mongomock MongoDB instance...")
        _sync_client = mongomock.MongoClient()
        _sync_db = _sync_client[settings.MONGODB_DB_NAME]
        _async_client = mongomock_motor.AsyncMongoMockClient()
        _async_db = _async_client[settings.MONGODB_DB_NAME]
        _is_mock = True
        _initialized = True
        return _sync_db

    # Attempt connection to live MongoDB
    try:
        logger.info(f"Connecting to MongoDB at {masked_url}...")
        client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000,
            socketTimeoutMS=5000,
        )
        # Test connection
        client.admin.command("ping")
        _sync_client = client
        _sync_db = client[settings.MONGODB_DB_NAME]
        _is_mock = False
        _initialized = True

        # Initialize async motor client
        try:
            _async_client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=2000,
            )
            _async_db = _async_client[settings.MONGODB_DB_NAME]
        except Exception as e:
            logger.warning(f"Async motor client init deferred: {e}")
            _async_client = mongomock_motor.AsyncMongoMockClient()
            _async_db = _async_client[settings.MONGODB_DB_NAME]

        logger.info(f"Connected successfully to live MongoDB: {masked_url}/{settings.MONGODB_DB_NAME}")
        return _sync_db

    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
        logger.warning(
            f"Live MongoDB unreachable at {masked_url} ({exc}). "
            f"Seamlessly falling back to high-performance in-memory mongomock store."
        )
        _sync_client = mongomock.MongoClient()
        _sync_db = _sync_client[settings.MONGODB_DB_NAME]
        _async_client = mongomock_motor.AsyncMongoMockClient()
        _async_db = _async_client[settings.MONGODB_DB_NAME]
        _is_mock = True
        _initialized = True
        return _sync_db


def get_mongo_client() -> Any:
    """Return the active MongoDB client instance."""
    global _sync_client
    if _sync_client is None:
        init_mongodb()
    return _sync_client


def get_mongo_db() -> Any:
    """Return the active MongoDB database instance."""
    global _sync_db
    if _sync_db is None:
        init_mongodb()
    return _sync_db


def get_async_mongo_db() -> Any:
    """Return the active async (Motor) MongoDB database instance."""
    global _async_db
    if _async_db is None:
        init_mongodb()
    return _async_db


def get_mongo_collection(collection_name: str) -> Any:
    """Get a specific collection from the active MongoDB database."""
    db = get_mongo_db()
    return db[collection_name]


def is_mongodb_mock() -> bool:
    """Check if the currently running MongoDB client is using the in-memory mock."""
    return _is_mock


def ping_mongodb() -> Dict[str, Any]:
    """
    Perform a health ping on MongoDB and gather database statistics.
    Returns latency, connection mode (live vs mock), collection count, and document count.
    """
    start_time = time.time()
    db = get_mongo_db()
    client = get_mongo_client()

    is_mock = is_mongodb_mock()
    try:
        if not is_mock:
            client.admin.command("ping")
        latency_ms = round((time.time() - start_time) * 1000, 2)

        collections = db.list_collection_names()
        total_docs = sum(db[col].count_documents({}) for col in collections)

        return {
            "status": "connected",
            "mode": "in-memory (mongomock)" if is_mock else "live (standalone/cluster)",
            "is_mock": is_mock,
            "database": settings.MONGODB_DB_NAME,
            "url": _mask_mongo_url(settings.MONGODB_URL),
            "latency_ms": latency_ms,
            "collections_count": len(collections),
            "collections": sorted(collections),
            "total_documents": total_docs,
            "error": None,
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "degraded",
            "mode": "in-memory (mongomock)" if is_mock else "live",
            "is_mock": is_mock,
            "database": settings.MONGODB_DB_NAME,
            "url": _mask_mongo_url(settings.MONGODB_URL),
            "latency_ms": latency_ms,
            "collections_count": 0,
            "collections": [],
            "total_documents": 0,
            "error": str(e),
        }


def get_all_collection_stats() -> Dict[str, Any]:
    """Return record counts and overview for all collections in the database."""
    db = get_mongo_db()
    stats = {}
    for col_name in sorted(db.list_collection_names()):
        col = db[col_name]
        count = col.count_documents({})
        stats[col_name] = {
            "count": count,
        }
    return stats


def close_mongo_client():
    """Close the MongoDB connection and reset singletons."""
    global _sync_client, _sync_db, _async_client, _async_db, _initialized
    if _sync_client is not None:
        try:
            _sync_client.close()
        except Exception:
            pass
    _sync_client = None
    _sync_db = None
    _async_client = None
    _async_db = None
    _initialized = False
