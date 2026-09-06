/**
 * BharatStandards AI - Document Intelligence Type Contracts
 */

export type DocumentStatus =
  | 'UPLOADING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'NEEDS_OCR'
  | 'FAILED';

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  page: number;
  section?: string;
  char_count: number;
  metadata_json?: string;
  created_at: string;
}

export interface Document {
  id: number;
  user_id: number;
  product_id?: number;
  product_name?: string;
  filename: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  status: DocumentStatus;
  processing_error?: string;
  page_count: number;
  chunks_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  chunks: DocumentChunk[];
}

export interface DocumentStatusResponse {
  id: number;
  status: DocumentStatus;
  page_count: number;
  processing_error?: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DocumentSearchResult {
  chunk_id: number;
  page: number;
  section?: string;
  snippet: string;
  full_content: string;
}
