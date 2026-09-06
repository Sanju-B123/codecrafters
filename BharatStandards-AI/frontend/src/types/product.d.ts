/**
 * BharatStandards AI - Product Management Type Contracts
 */

export type ProductStatus = 'DRAFT' | 'ANALYZING' | 'READY' | 'ARCHIVED';

export type RelevanceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ProductCategory =
  | 'Electrical Appliances'
  | 'Electronics'
  | 'Mechanical Equipment'
  | 'Construction Materials'
  | 'Food Products'
  | 'Chemicals'
  | 'Textiles'
  | 'Automotive'
  | 'Medical Devices'
  | 'Other';

export interface Product {
  id: number;
  user_id: number;
  name: string;
  category: ProductCategory | string;
  description?: string;
  intended_use?: string;
  manufacturer?: string;
  model_number?: string;
  technical_details?: string;
  status: ProductStatus;
  analysis_data?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  description?: string;
  intended_use?: string;
  manufacturer?: string;
  model_number?: string;
  technical_details?: string;
}

export interface UpdateProductRequest {
  name?: string;
  category?: string;
  description?: string;
  intended_use?: string;
  manufacturer?: string;
  model_number?: string;
  technical_details?: string;
  status?: ProductStatus;
}

export interface StandardMatch {
  standard_number: string;
  title: string;
  relevance: RelevanceLevel;
  why_it_applies: string;
  source: string;
  is_demo: boolean;
}

export interface ProductAnalysis {
  product_id: number;
  product_name: string;
  status: string;
  analyzed_at: string;
  standards: StandardMatch[];
  summary: string;
  disclaimer: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}
