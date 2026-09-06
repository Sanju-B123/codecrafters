/**
 * BharatStandards AI - Standards Knowledge Base Type Contracts
 */

export type StandardStatus = 'ACTIVE' | 'WITHDRAWN' | 'DRAFT' | 'DEMO';

export type RequirementCategory =
  | 'SAFETY'
  | 'PERFORMANCE'
  | 'TESTING'
  | 'DOCUMENTATION'
  | 'MARKING'
  | 'PACKAGING'
  | 'MATERIAL'
  | 'OTHER';

export interface Requirement {
  id: number;
  standard_id: number;
  clause: string;
  title: string;
  description: string;
  category: RequirementCategory | string;
  evidence_required?: string;
  verification_method?: string;
  page?: number;
  source: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Standard {
  id: number;
  standard_number: string;
  title: string;
  category: string;
  scope?: string;
  description?: string;
  version: string;
  status: StandardStatus | string;
  source: string;
  source_url?: string;
  publication_date?: string;
  is_demo: boolean;
  requirements_count: number;
  created_at: string;
  updated_at: string;
}

export interface StandardDetail extends Standard {
  requirements: Requirement[];
}

export interface StandardSearchParams {
  q?: string;
  category?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'relevance' | 'name' | 'latest';
}

export interface StandardSearchResponse {
  items: Standard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type RelevanceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface StandardMatch {
  standard_id: number;
  standard_number: string;
  title: string;
  relevance: RelevanceLevel;
  reason: string;
  source: string;
  is_demo: boolean;
}
