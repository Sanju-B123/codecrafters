"""
BharatStandards AI - CSV Knowledge Loader
Parses and validates CSV datasets for standards and clauses with header validation.
"""
import csv
import io
from typing import Any, Dict, List, Optional
from app.knowledge.ingestion.source_loader import BaseSourceLoader, IngestionPayload


class CsvSourceLoader(BaseSourceLoader):
    """
    Parses CSV files for standards and requirements, strictly validating headers.
    """

    REQUIRED_STANDARD_HEADERS = {"standard_number", "title"}
    REQUIRED_REQUIREMENT_HEADERS = {"standard_number", "clause", "title", "description"}

    def can_load(self, filename: str, content_type: Optional[str] = None) -> bool:
        if filename.lower().endswith(".csv"):
            return True
        if content_type and "csv" in content_type.lower():
            return True
        return False

    def load(self, raw_bytes: bytes, filename: str = "standards.csv") -> IngestionPayload:
        try:
            text_stream = io.StringIO(raw_bytes.decode("utf-8-sig"))  # handles BOM if present
        except UnicodeDecodeError as e:
            raise ValueError(f"CSV file '{filename}' must be valid UTF-8 encoded text: {e}")

        reader = csv.DictReader(text_stream)
        if not reader.fieldnames:
            raise ValueError(f"CSV file '{filename}' has no header row or is empty.")

        # Clean fieldnames (lowercase & strip whitespace)
        fieldnames = [f.strip().lower() for f in reader.fieldnames if f]
        fieldnames_set = set(fieldnames)

        is_standards_file = False
        is_requirements_file = False

        if "clause" in fieldnames_set or "clause_number" in fieldnames_set:
            is_requirements_file = True
        elif "standard_number" in fieldnames_set or "is_code" in fieldnames_set:
            is_standards_file = True

        standards_list = []
        requirements_list = []
        raw_count = 0

        if is_requirements_file:
            # Validate required requirement headers
            missing = self.REQUIRED_REQUIREMENT_HEADERS - fieldnames_set
            if missing:
                raise ValueError(
                    f"Requirements CSV '{filename}' missing required column(s): {', '.join(sorted(missing))}. "
                    f"Required: {', '.join(sorted(self.REQUIRED_REQUIREMENT_HEADERS))}"
                )

            for line_idx, row in enumerate(reader, start=2):  # line 2 is first data row
                clean_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
                clean_row["_source_index"] = f"Row {line_idx}"
                clean_row["_standard_ref"] = clean_row.get("standard_number")
                requirements_list.append(clean_row)
                raw_count += 1

        elif is_standards_file:
            # Validate required standard headers
            missing = self.REQUIRED_STANDARD_HEADERS - fieldnames_set
            if missing:
                raise ValueError(
                    f"Standards CSV '{filename}' missing required column(s): {', '.join(sorted(missing))}. "
                    f"Required: {', '.join(sorted(self.REQUIRED_STANDARD_HEADERS))}"
                )

            for line_idx, row in enumerate(reader, start=2):
                clean_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
                clean_row["_source_index"] = f"Row {line_idx}"
                standards_list.append(clean_row)
                raw_count += 1
        else:
            raise ValueError(
                f"CSV '{filename}' could not be identified as standards or requirements. "
                f"Headers must contain {sorted(self.REQUIRED_STANDARD_HEADERS)} or {sorted(self.REQUIRED_REQUIREMENT_HEADERS)}"
            )

        return IngestionPayload(
            source_metadata={"file_type": "csv", "filename": filename},
            standards=standards_list,
            requirements=requirements_list,
            raw_record_count=raw_count,
            format_type="csv",
        )
