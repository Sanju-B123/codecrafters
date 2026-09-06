"""
BharatStandards AI - Knowledge Ingestion Pipeline
Modular loaders, validators, normalizers, deduplicators, and transactional importers.
"""
from app.knowledge.ingestion.source_loader import BaseSourceLoader, IngestionPayload
from app.knowledge.ingestion.json_loader import JsonSourceLoader
from app.knowledge.ingestion.csv_loader import CsvSourceLoader
from app.knowledge.ingestion.validator import KnowledgeValidator, ValidationErrorItem
from app.knowledge.ingestion.normalizer import KnowledgeNormalizer
from app.knowledge.ingestion.deduplicator import KnowledgeDeduplicator, DuplicateMatch
from app.knowledge.ingestion.importer import KnowledgeImporter

__all__ = [
    "BaseSourceLoader",
    "IngestionPayload",
    "JsonSourceLoader",
    "CsvSourceLoader",
    "KnowledgeValidator",
    "ValidationErrorItem",
    "KnowledgeNormalizer",
    "KnowledgeDeduplicator",
    "DuplicateMatch",
    "KnowledgeImporter",
]
