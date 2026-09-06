export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_PROCESSED'
  | 'DOCUMENT_FAILED'
  | 'DOCUMENT_DELETED'
  | 'COMPLIANCE_STARTED'
  | 'COMPLIANCE_COMPLETED'
  | 'REPORT_GENERATED'
  | 'REPORT_DOWNLOADED'
  | 'SERVICE_VIEWED'
  | 'AI_QUERY'
  | 'PROFILE_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'PASSWORD_CHANGED'
  | string;

export interface AuditLog {
  id: number;
  user_id: number;
  action: AuditAction;
  entity_type?: string | null;
  entity_id?: number | null;
  description: string;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface ActivityFilterParams {
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ActivityListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
