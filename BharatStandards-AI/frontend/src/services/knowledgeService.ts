/**
 * BharatStandards AI - Knowledge Pipeline & Ingestion Service
 * Strongly typed client for source ingestion preview, batch jobs, draft reviews, and telemetry.
 */
import { apiClient } from './apiClient';
import type {
  KnowledgeImportPreview,
  KnowledgeImportJob,
  KnowledgeImportRecord,
  KnowledgeDraftsInbox,
  KnowledgeActionResponse,
  KnowledgeHealthResponse,
} from '../types/knowledge';

export const knowledgeService = {
  /**
   * Preview and validate standards source file before persisting.
   */
  async previewImport(file: File, provenanceType: string = 'DEMO'): Promise<KnowledgeImportPreview> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provenance_type', provenanceType);

    return apiClient('/admin/knowledge/import/preview', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Upload and ingest file, staging items in DRAFT status.
   */
  async executeImport(
    file: File,
    options: {
      provenanceType?: string;
      sourceName?: string;
      sourceUrl?: string;
      verificationStatus?: string;
      commitImmediately?: boolean;
    } = {}
  ): Promise<KnowledgeImportJob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provenance_type', options.provenanceType || 'DEMO');
    if (options.sourceName) formData.append('source_name', options.sourceName);
    if (options.sourceUrl) formData.append('source_url', options.sourceUrl);
    formData.append('verification_status', options.verificationStatus || 'UNVERIFIED');
    formData.append('commit_immediately', options.commitImmediately ? 'true' : 'false');

    return apiClient('/admin/knowledge/import', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * List batch import jobs.
   */
  async getImportJobs(params: { skip?: number; limit?: number } = {}): Promise<KnowledgeImportJob[]> {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/knowledge/imports${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single import job details.
   */
  async getImportJob(jobId: number): Promise<KnowledgeImportJob> {
    return apiClient(`/admin/knowledge/imports/${jobId}`);
  },

  /**
   * Get granular row-level staging records for an import job.
   */
  async getImportJobRecords(
    jobId: number,
    params: { status?: string; record_type?: string; skip?: number; limit?: number } = {}
  ): Promise<KnowledgeImportRecord[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.record_type) query.set('record_type', params.record_type);
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/knowledge/imports/${jobId}/records${qs ? `?${qs}` : ''}`);
  },

  /**
   * Commit staged job into draft knowledge entities.
   */
  async commitImportJob(jobId: number): Promise<KnowledgeImportJob> {
    return apiClient(`/admin/knowledge/imports/${jobId}/commit`, {
      method: 'POST',
    });
  },

  /**
   * Get drafts awaiting human review.
   */
  async getDraftsInbox(params: { skip?: number; limit?: number } = {}): Promise<KnowledgeDraftsInbox> {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/knowledge/drafts${qs ? `?${qs}` : ''}`);
  },

  /**
   * Approve draft standard or requirement -> status ACTIVE -> queues RAG indexing.
   */
  async approveEntity(entityType: 'standard' | 'requirement', id: number): Promise<KnowledgeActionResponse> {
    return apiClient(`/admin/knowledge/${entityType}/${id}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Reject draft entity.
   */
  async rejectEntity(entityType: 'standard' | 'requirement', id: number, reason?: string): Promise<KnowledgeActionResponse> {
    const query = new URLSearchParams();
    if (reason) query.set('reason', reason);
    const qs = query.toString();

    return apiClient(`/admin/knowledge/${entityType}/${id}/reject${qs ? `?${qs}` : ''}`, {
      method: 'POST',
    });
  },

  /**
   * Archive entity to remove it from active search and RAG.
   */
  async archiveEntity(entityType: 'standard' | 'requirement', id: number): Promise<KnowledgeActionResponse> {
    return apiClient(`/admin/knowledge/${entityType}/${id}/archive`, {
      method: 'POST',
    });
  },

  /**
   * Fetch Knowledge Base health & quality telemetry.
   */
  async getHealth(): Promise<KnowledgeHealthResponse> {
    return apiClient('/admin/knowledge/health');
  },

  /**
   * Get all knowledge records with provenance metadata.
   */
  async getRecords(params: {
    status?: string;
    source_type?: string;
    entity_type?: string;
    search?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<{ total: number; items: any[] }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.source_type) query.set('source_type', params.source_type);
    if (params.entity_type) query.set('entity_type', params.entity_type);
    if (params.search) query.set('search', params.search);
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/knowledge/records${qs ? `?${qs}` : ''}`);
  },

  /**
   * List authoritative and synthetic knowledge sources.
   */
  async getSources(): Promise<any[]> {
    return apiClient('/admin/knowledge/sources');
  },

  /**
   * Trigger RAG re-indexing for a standard or requirement.
   */
  async reindexEntity(entityType: 'standard' | 'requirement', id: number): Promise<KnowledgeActionResponse> {
    return apiClient(`/admin/knowledge/${entityType}/${id}/reindex`, {
      method: 'POST',
    });
  },

  /**
   * Trigger full re-indexing of all active standards & requirements.
   */
  async reindexAll(): Promise<KnowledgeActionResponse> {
    return apiClient('/admin/knowledge/reindex-all', {
      method: 'POST',
    });
  },
};

