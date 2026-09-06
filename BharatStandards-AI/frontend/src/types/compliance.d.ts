/**
 * BharatStandards AI - Compliance Engine TypeScript Definitions
 */

export type ComplianceStatusType = 'PASS' | 'PARTIAL' | 'MISSING';
export type ConfidenceLevelType = 'HIGH' | 'MEDIUM' | 'LOW';
export type GapPriorityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatusType = 'NOT_STARTED' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface EvidenceCitation {
  document_id?: number | null;
  document_name?: string | null;
  page?: number | null;
  chunk_id?: number | null;
  snippet?: string;
}

export interface RequirementBrief {
  id: number;
  clause: str;
  title: string;
  category: string;
  description: string;
  verification_method?: string;
  weight?: number;
}

export interface ComplianceResult {
  id: number;
  report_id: number;
  requirement_id: number;
  requirement?: RequirementBrief;
  status: ComplianceStatusType;
  evidence?: string;
  parsed_evidence?: EvidenceCitation;
  confidence: ConfidenceLevelType;
  reason: string;
  recommended_action: string;
  weight: number;
  score_contribution: number;
  created_at: string;
}

export interface Gap {
  id: number;
  report_id: number;
  requirement_id: number;
  requirement?: RequirementBrief;
  priority: GapPriorityType;
  description: string;
  evidence?: string;
  parsed_evidence?: EvidenceCitation;
  recommended_action: string;
  created_at: string;
}

export interface ComplianceReport {
  id: number;
  product_id: number;
  standard_id: number;
  score: number;
  status: ReportStatusType;
  total_requirements: number;
  passed_count: number;
  partial_count: number;
  missing_count: number;
  summary?: string;
  scoring_methodology?: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  standard_number?: string;
  standard_title?: string;
}

export interface ComplianceReportDetail extends ComplianceReport {
  results: ComplianceResult[];
  gaps: Gap[];
}

export interface ComplianceSummary {
  id: number;
  product_id: number;
  product_name: string;
  standard_id: number;
  standard_number: string;
  score: number;
  status: ReportStatusType;
  total_requirements: number;
  passed_count: number;
  partial_count: number;
  missing_count: number;
  critical_gaps: number;
  high_gaps: number;
  medium_gaps: number;
  low_gaps: number;
  total_gaps: number;
  summary?: string;
  scoring_methodology?: string;
  created_at: string;
}
