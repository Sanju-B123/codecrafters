/**
 * BharatStandards AI - Admin Dashboard & Knowledge Base TypeScript Definitions
 * Strictly typed entities for administrative governance and subsystem telemetry.
 */

export interface SubsystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  latency_ms?: number;
  details: string;
}

export interface AdminHealthResponse {
  overall_status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  timestamp: string;
  subsystems: {
    database: SubsystemHealth;
    api_gateway: SubsystemHealth;
    document_processing: SubsystemHealth;
    ai_reasoning_engine: SubsystemHealth;
    vector_embedding_service: SubsystemHealth;
    [key: string]: SubsystemHealth;
  };
}

export interface DashboardTotals {
  users: number;
  admins: number;
  suspended_users: number;
  products: number;
  standards: number;
  archived_standards: number;
  requirements: number;
  documents: number;
  reports: number;
  bis_services: number;
  audit_events: number;
  indexed_items: number;
  unindexed_items: number;
}

export interface RecentVelocity {
  new_users: number;
  new_reports: number;
  audit_events: number;
}

export interface TopStandardItem {
  code: string;
  title: string;
  evaluations: number;
}

export interface TopGapItem {
  description: string;
  priority: string;
  count: number;
}

export interface DailyVelocityItem {
  date: string;
  label: string;
  events: number;
  reports: number;
}

export interface AdminDashboardMetrics {
  totals: DashboardTotals;
  recent_7d: RecentVelocity;
  top_standards: TopStandardItem[];
  top_gaps: TopGapItem[];
  daily_velocity: DailyVelocityItem[];
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'industry' | 'consumer' | string;
  status: 'ACTIVE' | 'SUSPENDED';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count: number;
  reports_count: number;
}

export interface AdminUpdateUserPayload {
  role?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface AdminRequirement {
  id: number;
  standard_id: number;
  clause: string;
  title: string;
  description: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence_types?: string[];
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  evidence_required?: string;
  verification_method?: string;
  weight: number;
  page?: number;
  source: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QualityBreakdownItem {
  points: number;
  max: number;
  status?: string;
  ratio?: number;
  count?: number;
}

export interface AdminStandard {
  id: number;
  standard_number: string;
  code: string;
  title: string;
  category: string;
  scope?: string;
  description?: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'DEMO' | 'WITHDRAWN';
  source: string;
  source_name: string;
  source_url?: string;
  publication_date?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  requirements_count: number;
  quality_score?: number;
  quality_tier?: 'HIGH' | 'MEDIUM' | 'LOW';
  index_status?: 'INDEXED' | 'INDEX_PENDING' | 'NOT_INDEXED' | 'INDEX_FAILED';
}

export interface AdminStandardDetail extends AdminStandard {
  requirements: AdminRequirement[];
  quality_breakdown?: Record<string, QualityBreakdownItem>;
}

export interface AdminStandardCreatePayload {
  standard_number: string;
  title: string;
  category: string;
  scope?: string;
  description?: string;
  version?: string;
  status?: string;
  source?: string;
  source_url?: string;
  publication_date?: string;
  is_demo?: boolean;
}

export interface AdminStandardUpdatePayload {
  title?: string;
  category?: string;
  scope?: string;
  description?: string;
  version?: string;
  status?: string;
  source?: string;
  source_url?: string;
  publication_date?: string;
  is_demo?: boolean;
}

export interface AdminRequirementCreatePayload {
  clause: string;
  title: string;
  description: string;
  category?: string;
  priority?: string;
  evidence_types?: string[];
  evidence_required?: string;
  verification_method?: string;
  weight?: number;
  page?: number;
  source?: string;
  source_url?: string;
}

export interface AdminRequirementUpdatePayload {
  clause?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  evidence_types?: string[];
  status?: string;
  evidence_required?: string;
  verification_method?: string;
  weight?: number;
  page?: number;
  source?: string;
  source_url?: string;
}

export interface AdminDocumentListItem {
  id: number;
  product_id: number;
  product_name?: string;
  user_id: number;
  user_email?: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  document_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminKnowledgeSource {
  id: number;
  source_type: 'OFFICIAL' | 'USER_PROVIDED' | 'DEMO';
  name: string;
  url?: string;
  description?: string;
  authority_level: 'HIGH' | 'MEDIUM' | 'LOW';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminKnowledgeSourceCreatePayload {
  source_type: 'OFFICIAL' | 'USER_PROVIDED' | 'DEMO';
  name: string;
  url?: string;
  description?: string;
  authority_level: 'HIGH' | 'MEDIUM' | 'LOW';
  is_verified: boolean;
}

export interface AdminKnowledgeIndexResponse {
  id: number;
  entity_type: string;
  entity_id: number;
  index_status: string;
  embedding_model?: string;
  indexed_at?: string;
  updated_at: string;
}

export interface AdminBISService {
  id: number;
  service_code: string;
  title: string;
  description: string;
  category: string;
  user_type: string;
  status: string;
  action_type: string;
  portal_name?: string;
  portal_url?: string;
  help_text?: string;
  estimated_timeline?: string;
  applicable_standards?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminBISServiceCreatePayload {
  service_code: string;
  title: string;
  description: string;
  category?: string;
  user_type?: string;
  status?: string;
  action_type?: string;
  portal_name?: string;
  portal_url?: string;
  help_text?: string;
  estimated_timeline?: string;
  applicable_standards?: string;
  is_active?: boolean;
}

export interface AdminBISServiceUpdatePayload {
  title?: string;
  description?: string;
  category?: string;
  user_type?: string;
  status?: string;
  action_type?: string;
  portal_name?: string;
  portal_url?: string;
  help_text?: string;
  estimated_timeline?: string;
  applicable_standards?: string;
  is_active?: boolean;
}
