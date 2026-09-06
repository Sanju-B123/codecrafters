export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'SYSTEM'
  | 'ACCOUNT_SECURITY'
  | 'WELCOME'
  | 'DOCUMENT_PROCESSED'
  | 'DOCUMENT_FAILED'
  | 'COMPLIANCE_COMPLETED'
  | 'COMPLIANCE_GAP'
  | 'REPORT_READY'
  | string;

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
