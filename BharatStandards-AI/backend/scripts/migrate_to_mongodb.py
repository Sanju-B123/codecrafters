#!/usr/bin/env python3
"""
CLI Script: Migrate all SQLite/PostgreSQL relational data to MongoDB.
Usage:
    python scripts/migrate_to_mongodb.py [--force-mock] [--url MONGODB_URL] [--db MONGODB_DB]
"""

import sys
import os
import argparse

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import init_db, get_engine
from app.core.mongodb import init_mongodb, ping_mongodb, get_mongo_db, is_mongodb_mock
from app.services.mongodb_sync import sync_all_sql_to_mongo
import app.models  # Ensure all ORM models are registered


def main():
    parser = argparse.ArgumentParser(description="Migrate SQL database to MongoDB.")
    parser.add_argument(
        "--force-mock",
        action="store_true",
        help="Force use of in-memory mongomock engine even if MONGODB_URL is configured",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Override MongoDB connection URI",
    )
    parser.add_argument(
        "--db",
        type=str,
        default=None,
        help="Override MongoDB database name",
    )
    args = parser.parse_args()

    if args.url:
        settings.MONGODB_URL = args.url
    if args.db:
        settings.MONGODB_DB_NAME = args.db

    print("=" * 70)
    print("BharatStandards AI - MongoDB Migration & Re-synchronization Utility")
    print("=" * 70)

    # 1. Initialize SQL DB and schemas
    print("\n[1/4] Initializing SQL database tables & seeding baseline data...")
    init_db()

    # 2. Connect to MongoDB
    print(f"\n[2/4] Connecting to MongoDB ({settings.MONGODB_URL})...")
    init_mongodb(force_mock=args.force_mock)
    health = ping_mongodb()
    print(f"      Status:      {health['status'].upper()}")
    print(f"      Engine Mode: {health['mode']}")
    print(f"      Database:    {health['database']}")
    print(f"      Latency:     {health['latency_ms']} ms")

    # 3. Synchronize tables
    print("\n[3/4] Migrating tables to MongoDB collections...")
    result = sync_all_sql_to_mongo()

    print("\n" + "-" * 50)
    print(f"{'Collection / Table':<30} | {'Synced Records':<15}")
    print("-" * 50)
    for table_name, details in sorted(result["details"].items()):
        count = details["synced"]
        if count > 0:
            print(f"{table_name:<30} | {count:<15}")
    print("-" * 50)
    print(f"Total Tables Synced:  {result['synced_tables']} / {result['total_tables']}")
    print(f"Total Records Copied: {result['total_records']}")

    # 4. Verification Check
    print("\n[4/4] Verifying MongoDB collections...")
    mongo_db = get_mongo_db()
    collections = sorted(mongo_db.list_collection_names())
    print(f"      Active MongoDB collections ({len(collections)}):")
    for col in collections:
        doc_count = mongo_db[col].count_documents({})
        sample = mongo_db[col].find_one({})
        sample_id = sample.get("_id") if sample else "N/A"
        print(f"      - {col:<26}: {doc_count:>4} docs (sample _id: {sample_id})")

    print("\n" + "=" * 70)
    print("MongoDB Migration completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    main()
