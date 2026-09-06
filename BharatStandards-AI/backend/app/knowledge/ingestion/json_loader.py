"""
BharatStandards AI - JSON Knowledge Bundle Loader
Parses structured JSON packages of standards, clauses, and source provenance.
"""
import json
from typing import Any, Dict, List, Optional
from app.knowledge.ingestion.source_loader import BaseSourceLoader, IngestionPayload


class JsonSourceLoader(BaseSourceLoader):
    """
    Parses controlled JSON datasets containing standards, clauses, and source metadata.
    """

    def can_load(self, filename: str, content_type: Optional[str] = None) -> bool:
        if filename.lower().endswith(".json"):
            return True
        if content_type and "json" in content_type.lower():
            return True
        return False

    def load(self, raw_bytes: bytes, filename: str = "standards.json") -> IngestionPayload:
        try:
            text_content = raw_bytes.decode("utf-8")
            data = json.loads(text_content)
        except UnicodeDecodeError as e:
            raise ValueError(f"File '{filename}' must be valid UTF-8 encoded text: {e}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Malformed JSON in '{filename}' at line {e.lineno}, column {e.colno}: {e.msg}")

        source_meta = {}
        sources_list = []
        standards_list = []
        requirements_list = []
        raw_count = 0

        if isinstance(data, dict):
            source_meta = data.get("source", {})
            sources_list = data.get("sources", [])
            raw_standards = data.get("standards", [])
            if isinstance(raw_standards, list):
                for std_idx, std in enumerate(raw_standards):
                    if not isinstance(std, dict):
                        continue
                    raw_count += 1
                    # Extract nested requirements if embedded
                    nested_reqs = std.get("requirements", [])
                    clean_std = {k: v for k, v in std.items() if k != "requirements"}
                    clean_std["_source_index"] = std_idx + 1
                    standards_list.append(clean_std)

                    if isinstance(nested_reqs, list):
                        for req_idx, req in enumerate(nested_reqs):
                            if isinstance(req, dict):
                                raw_count += 1
                                clean_req = dict(req)
                                clean_req["_standard_ref"] = clean_std.get("standard_number")
                                clean_req["_source_index"] = f"{std_idx + 1}.{req_idx + 1}"
                                requirements_list.append(clean_req)

            # Also support separate requirements key at root
            root_reqs = data.get("requirements", [])
            if isinstance(root_reqs, list):
                for r_idx, req in enumerate(root_reqs):
                    if isinstance(req, dict):
                        raw_count += 1
                        clean_req = dict(req)
                        clean_req["_source_index"] = f"R{r_idx + 1}"
                        requirements_list.append(clean_req)

        elif isinstance(data, list):
            # Direct list of standards
            for idx, item in enumerate(data):
                if isinstance(item, dict):
                    raw_count += 1
                    nested_reqs = item.get("requirements", [])
                    clean_std = {k: v for k, v in item.items() if k != "requirements"}
                    clean_std["_source_index"] = idx + 1
                    standards_list.append(clean_std)

                    if isinstance(nested_reqs, list):
                        for req_idx, req in enumerate(nested_reqs):
                            if isinstance(req, dict):
                                raw_count += 1
                                clean_req = dict(req)
                                clean_req["_standard_ref"] = clean_std.get("standard_number")
                                clean_req["_source_index"] = f"{idx + 1}.{req_idx + 1}"
                                requirements_list.append(clean_req)
        else:
            raise ValueError(f"Top-level JSON in '{filename}' must be an object or array, got {type(data).__name__}")

        return IngestionPayload(
            source_metadata=source_meta,
            sources=sources_list,
            standards=standards_list,
            requirements=requirements_list,
            raw_record_count=raw_count,
            format_type="json",
        )
