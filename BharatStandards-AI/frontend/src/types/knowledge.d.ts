/**
 * BharatStandards AI - Knowledge Pipeline & Ingestion TypeScript Definitions
 * Strict types for ingestion previews, staged draft reviews, and data quality telemetry.
 */

export type ProvenanceType = 'OFFICIAL' | 'USER_PROVIDED' | 'DEMO';
export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'NOT_APPLICABLE';

export interface ValidationErrorDetail {
  record_type: string;
  index_or_row: string;
  identifier?: string | null;
  field: string;
  error: string;
}

export interface DuplicateMatchItem {
  entity_type: string;
  identifier: string;
  version?: string | null;
  existing_id: number;
  existing_status: string;
  existing_title: string;
  action_allowed: string;
}

export interface KnowledgeImportPreview {
  filename: string;
  format_type: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  is_valid: boolean;
  errors: ValidationErrorDetail[];
  duplicates_found: number;
  duplicate_matches: DuplicateMatchItem[];
  standards_count: number;
  requirements_count: number;
  standards_preview: Record<string, string | number | boolean | null>[];
  requirements_preview: Record<string, string | number | boolean | null>[];
  source_metadata?: Record<string, string | number | boolean | null> | null;
}

export interface KnowledgeImportRecord {
  id: number;
  job_id: number;
  record_type: string;
  external_id?: string | null;
  status: string;
  error_message?: string | null;
  created_entity_type?: string | null;
  created_entity_id?: number | null;
  raw_data?: Record<string, unknown> | null;
  normalized_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface KnowledgeImportJob {
  id: number;
  filename: string;
  status: string;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  error_summary?: string | null;
  created_by?: number | null;
  source_id?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface KnowledgeDraftStandard {
  id: number;
  standard_number: string;
  title: string;
  code?: string | null;
  category: string;
  description?: string | null;
  status: string;
  version?: string | null;
  effective_date?: string | null;
  provenance_type?: string | null;
  created_at: string;
}

export interface KnowledgeDraftRequirement {
  id: number;
  standard_id: number;
  standard_number?: string | null;
  clause: string;
  title: string;
  description: string;
  verification_method?: string | null;
  evidence_required?: string | null;
  weight?: number;
  priority?: string;
  status: string;
  created_at: string;
}

export interface KnowledgeDraftsInbox {
  total_drafts: number;
  standards: KnowledgeDraftStandard[];
  requirements: KnowledgeDraftRequirement[];
}

export interface KnowledgeActionResponse {
  success: boolean;
  message: string;
  entity_type: string;
  entity_id: number;
  new_status: string;
}

export interface KnowledgeHealthResponse {
  total_standards: number;
  active_standards: number;
  draft_standards: number;
  archived_standards: number;
  total_requirements: number;
  active_requirements: number;
  draft_requirements: number;
  archived_requirements: number;
  verified_sources: number;
  unverified_sources: number;
  user_provided_sources: number;
  demo_sources: number;
  pending_review_count: number;
  index_pending: number;
  index_failed: number;
  quality_score: number;
  last_review_threshold_days: number;
}
