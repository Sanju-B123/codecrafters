export type UserRole = 'industry' | 'consumer';

export type ColorTheme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  email_notifications: boolean;
  in_app_notifications?: boolean;
  compliance_notifications: boolean;
  document_notifications: boolean;
  product_notifications: boolean;
  report_notifications?: boolean;
  theme: ColorTheme;
  language: string;
}

export interface Profile {
  id?: number;
  user_id?: number;
  phone?: string | null;
  organization?: string | null;
  industry?: string | null;
  designation?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  interests?: string | null;
  preferences?: UserPreferences | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  organization?: string;
  industry?: string;
  designation?: string;
  location?: string;
  avatar_url?: string;
  interests?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}
