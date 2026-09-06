/**
 * BharatStandards AI - Admin API Service
 * Strongly typed client for administrative telemetry, user management, and knowledge base lifecycle.
 */
import { apiClient } from './apiClient';
import type {
  AdminDashboardMetrics,
  AdminHealthResponse,
  AdminUserListItem,
  AdminUpdateUserPayload,
  AdminStandard,
  AdminStandardDetail,
  AdminStandardCreatePayload,
  AdminStandardUpdatePayload,
  AdminRequirement,
  AdminRequirementCreatePayload,
  AdminRequirementUpdatePayload,
  AdminDocumentListItem,
  AdminKnowledgeSource,
  AdminKnowledgeSourceCreatePayload,
  AdminKnowledgeIndexResponse,
  AdminBISService,
  AdminBISServiceCreatePayload,
  AdminBISServiceUpdatePayload,
} from '../types/admin';

export const adminService = {
  // Telemetry & Health
  async getMetrics(): Promise<AdminDashboardMetrics> {
    return apiClient('/admin/metrics');
  },

  async getHealth(): Promise<AdminHealthResponse> {
    return apiClient('/admin/health');
  },

  // User Management
  async getUsers(params: { search?: string; role?: string; status?: string; skip?: number; limit?: number } = {}): Promise<AdminUserListItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  async updateUser(userId: number, payload: AdminUpdateUserPayload): Promise<AdminUserListItem> {
    return apiClient(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Standards Management
  async getStandards(params: { search?: string; status?: string; category?: string; skip?: number; limit?: number } = {}): Promise<AdminStandard[]> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/standards${qs ? `?${qs}` : ''}`);
  },

  async getStandardDetail(standardId: number): Promise<AdminStandardDetail> {
    return apiClient(`/admin/standards/${standardId}`);
  },

  async createStandard(payload: AdminStandardCreatePayload): Promise<AdminStandard> {
    return apiClient('/admin/standards', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStandard(standardId: number, payload: AdminStandardUpdatePayload): Promise<AdminStandard> {
    return apiClient(`/admin/standards/${standardId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteStandard(standardId: number, hard: boolean = false): Promise<{ message: string }> {
    return apiClient(`/admin/standards/${standardId}${hard ? '?hard=true' : ''}`, {
      method: 'DELETE',
    });
  },

  async syncStandardIndex(standardId: number): Promise<AdminKnowledgeIndexResponse> {
    return apiClient(`/admin/standards/${standardId}/index`, {
      method: 'POST',
    });
  },

  // Requirements / Clauses
  async createRequirement(standardId: number, payload: AdminRequirementCreatePayload): Promise<AdminRequirement> {
    return apiClient(`/admin/standards/${standardId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRequirement(requirementId: number, payload: AdminRequirementUpdatePayload): Promise<AdminRequirement> {
    return apiClient(`/admin/requirements/${requirementId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteRequirement(requirementId: number): Promise<{ message: string }> {
    return apiClient(`/admin/requirements/${requirementId}`, {
      method: 'DELETE',
    });
  },

  // Platform Documents
  async getDocuments(params: { status?: string; document_type?: string; search?: string; skip?: number; limit?: number } = {}): Promise<AdminDocumentListItem[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.document_type) query.set('document_type', params.document_type);
    if (params.search) query.set('search', params.search);
    if (params.skip !== undefined) query.set('skip', String(params.skip));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient(`/admin/documents${qs ? `?${qs}` : ''}`);
  },

  // Knowledge Sources
  async getKnowledgeSources(sourceType?: string): Promise<AdminKnowledgeSource[]> {
    const qs = sourceType ? `?source_type=${encodeURIComponent(sourceType)}` : '';
    return apiClient(`/admin/knowledge-sources${qs}`);
  },

  async createKnowledgeSource(payload: AdminKnowledgeSourceCreatePayload): Promise<AdminKnowledgeSource> {
    return apiClient('/admin/knowledge-sources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // BIS Services
  async getBISServices(params: { category?: string; status?: string } = {}): Promise<AdminBISService[]> {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);

    const qs = query.toString();
    return apiClient(`/admin/bis-services${qs ? `?${qs}` : ''}`);
  },

  async createBISService(payload: AdminBISServiceCreatePayload): Promise<AdminBISService> {
    return apiClient('/admin/bis-services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateBISService(serviceId: number, payload: AdminBISServiceUpdatePayload): Promise<AdminBISService> {
    return apiClient(`/admin/bis-services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteBISService(serviceId: number): Promise<{ message: string }> {
    return apiClient(`/admin/bis-services/${serviceId}`, {
      method: 'DELETE',
    });
  },
};
