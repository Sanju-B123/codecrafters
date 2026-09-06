/**
 * BharatStandards AI - Compliance Report TypeScript Definitions
 */

export interface ReportProductInfo {
  id: number;
  name: string;
  manufacturer?: string | null;
  model_number?: string | null;
  category: string;
  description?: string | null;
  intended_use?: string | null;
  technical_details?: string | null;
}

export interface ReportStandardInfo {
  id: number;
  standard_number: string;
  title: string;
  category: string;
  version?: string | null;
  status: string;
  scope?: string | null;
  description?: string | null;
  source?: string | null;
}

export interface ReportAssessmentItem {
  clause: string;
  title: string;
  category: string;
  status: 'PASS' | 'PARTIAL' | 'MISSING';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence?: string | null;
  reason: string;
  recommended_action: string;
  weight: number;
  document_name?: string | null;
  page?: number | null;
  snippet?: string | null;
}

export interface ReportGapItem {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  clause: string;
  requirement_title: string;
  problem: string;
  current_evidence?: string | null;
  recommended_action: string;
}

export interface ReportActionPlanItem {
  priority: string;
  action: string;
  related_requirement: string;
  reason: string;
  target_route?: string | null;
}

export interface ReportSourceItem {
  source_type: 'OFFICIAL_STANDARD' | 'USER_DOCUMENT' | 'SYNTHETIC_DEMO';
  name: string;
  reference: string;
  details?: string | null;
  url?: string | null;
}

export interface ReportHistoryItem {
  version: number;
  report_id?: number | null;
  report_number?: string | null;
  compliance_report_id: number;
  readiness_score: number;
  passed_count: number;
  partial_count: number;
  missing_count: number;
  generated_at: string;
  status: string;
}

export interface ReportBrief {
  id: number;
  report_number: string;
  title: string;
  compliance_report_id: number;
  product_id: number;
  product_name: string;
  standard_id: number;
  standard_number: string;
  standard_title: string;
  readiness_score: number;
  status: string;
  total_requirements: number;
  passed_count: number;
  partial_count: number;
  missing_count: number;
  is_demo: boolean;
  generated_at: string;
  created_at: string;
}

export interface ReportDetail {
  id: number;
  report_number: string;
  title: string;
  compliance_report_id: number;
  generated_at: string;
  status: string;
  is_demo: boolean;
  readiness_score: number;
  passed_count: number;
  partial_count: number;
  missing_count: number;
  total_requirements: number;
  critical_gaps_count: number;
  high_gaps_count: number;
  summary: string;
  disclaimer: string;
  product: ReportProductInfo;
  standard: ReportStandardInfo;
  assessments: ReportAssessmentItem[];
  gaps: ReportGapItem[];
  action_plan: ReportActionPlanItem[];
  sources: ReportSourceItem[];
  history: ReportHistoryItem[];
}
