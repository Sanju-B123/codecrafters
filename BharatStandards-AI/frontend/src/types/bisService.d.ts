/**
 * BharatStandards AI - BIS Services & Guided Actions TypeScript Definitions
 */

export type ServiceCategory =
  | 'CERTIFICATION'
  | 'REGISTRATION'
  | 'TESTING'
  | 'LICENSING'
  | 'MARKING'
  | 'PRODUCT_COMPLIANCE'
  | 'CONSUMER_GUIDANCE'
  | 'OTHER';

export type ServiceStatus =
  | 'ACTIVE'
  | 'INFORMATIONAL'
  | 'DEMO'
  | 'ARCHIVED';

export type ServiceUserType =
  | 'INDUSTRY'
  | 'CONSUMER'
  | 'BOTH';

export type ServiceActionType =
  | 'VIEW_STANDARD'
  | 'UPLOAD_DOCUMENT'
  | 'FIX_GAP'
  | 'RUN_COMPLIANCE_CHECK'
  | 'VIEW_SERVICE'
  | 'OPEN_OFFICIAL_SOURCE'
  | 'CONTACT_AUTHORITY';

export interface ServiceStep {
  step_number: number;
  title: string;
  description: string;
  action_type?: ServiceActionType | string;
  action_target?: string;
}

export interface ActionItem {
  action_type: ServiceActionType | string;
  label: string;
  target: string;
  description?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
}

export interface BISService {
  id: number;
  service_code: string;
  name: string;
  description: string;
  category: ServiceCategory;
  user_type: ServiceUserType;
  eligibility: string;
  required_documents: string[];
  steps: ServiceStep[];
  official_source_name?: string | null;
  official_source_url?: string | null;
  is_demo: boolean;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}

export interface ServiceListResponse {
  items: BISService[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ServiceRecommendation {
  service: BISService;
  match_reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  suggested_actions: ActionItem[];
  is_demo: boolean;
}

export interface ComplianceNextSteps {
  report_id: number;
  product_id: number;
  product_name: string;
  readiness_score: number;
  status: string;
  prioritized_actions: ActionItem[];
  recommended_services: ServiceRecommendation[];
  summary?: string;
}
