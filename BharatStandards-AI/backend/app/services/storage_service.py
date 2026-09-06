"""
BharatStandards AI - Document Storage Service
Abstracts file storage operations to enable seamless transition between local disk, S3, Azure Blob, or GCS.
Enforces safe filenames, UUID uniqueness, and path traversal protection.
"""
import os
import re
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple, Optional
from app.core.logging import logger

STORAGE_ROOT = Path(__file__).resolve().parent.parent.parent / "storage" / "documents"


class StorageService(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        """Save file bytes and return (safe_filename, storage_path)."""
        pass

    @abstractmethod
    def get(self, storage_path: str) -> Optional[bytes]:
        """Read and return file bytes by storage path."""
        pass

    @abstractmethod
    def delete(self, storage_path: str) -> bool:
        """Delete file by storage path."""
        pass


class LocalStorageService(StorageService):
    def __init__(self, base_dir: Path = STORAGE_ROOT):
        self.base_dir = base_dir.resolve()
        os.makedirs(self.base_dir, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        # Strip directories and path traversal
        clean_name = os.path.basename(filename)
        # Replace non-alphanumeric chars (keep dots, underscores, dashes)
        clean_name = re.sub(r"[^\w\.\-]", "_", clean_name)
        return clean_name or "uploaded_document.pdf"

    def _resolve_safe_path(self, storage_path: str) -> Path:
        target = (self.base_dir / storage_path).resolve()
        # Path traversal guard: must reside within base_dir
        if not str(target).startswith(str(self.base_dir)):
            logger.warning(f"Path traversal attempt blocked: '{storage_path}'")
            raise PermissionError("Access outside designated storage directory is prohibited.")
        return target

    def save(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        sanitized = self._sanitize_filename(original_filename)
        unique_prefix = uuid.uuid4().hex[:12]
        unique_filename = f"{unique_prefix}_{sanitized}"

        target_path = self._resolve_safe_path(unique_filename)
        with open(target_path, "wb") as f:
            f.write(file_bytes)

        logger.info(f"Stored file '{original_filename}' as '{unique_filename}' ({len(file_bytes)} bytes)")
        return unique_filename, str(target_path)

    def get(self, storage_path: str) -> Optional[bytes]:
        try:
            target_path = Path(storage_path).resolve()
            if not str(target_path).startswith(str(self.base_dir)):
                raise PermissionError("Access outside storage directory is prohibited.")
            if not target_path.exists():
                return None
            with open(target_path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading file at '{storage_path}': {e}")
            return None

    def delete(self, storage_path: str) -> bool:
        try:
            target_path = Path(storage_path).resolve()
            if not str(target_path).startswith(str(self.base_dir)):
                raise PermissionError("Access outside storage directory is prohibited.")
            if target_path.exists():
                target_path.unlink()
                logger.info(f"Deleted storage file at '{storage_path}'")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file at '{storage_path}': {e}")
            return False


# Default storage singleton
storage_service = LocalStorageService()
