/**
 * BharatStandards AI - BIS Services API Client
 * Manages fetching BIS services, detailed procedural guides, and deterministic recommendations.
 */
import { apiClient } from './apiClient';

export const bisService = {
  /**
   * Fetch paginated list of BIS services with optional search and filters.
   * @param {Object} [params]
   * @param {string} [params.search]
   * @param {string} [params.category]
   * @param {string} [params.user_type]
   * @param {string} [params.status]
   * @param {number} [params.page=1]
   * @param {number} [params.page_size=10]
   * @returns {Promise<{ items: Array, total: number, page: number, page_size: number, pages: number }>}
   */
  async getServices(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.user_type && params.user_type !== 'ALL') query.append('user_type', params.user_type);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    const qs = query.toString();
    const endpoint = `/services${qs ? `?${qs}` : ''}`;
    return await apiClient.get(endpoint);
  },

  /**
   * Fetch complete procedural details for a single BIS service by ID.
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async getService(id) {
    return await apiClient.get(`/services/${id}`);
  },

  /**
   * Retrieve general user/role-tailored recommendations.
   * @param {number} [limit=5]
   * @returns {Promise<Array>}
   */
  async getRecommendedServices(limit = 5) {
    return await apiClient.get(`/services/recommended?limit=${limit}`);
  },

  /**
   * Retrieve product-specific recommendations based on product category & gaps.
   * @param {number|string} productId
   * @returns {Promise<Array>}
   */
  async getProductServices(productId) {
    return await apiClient.get(`/products/${productId}/services`);
  },

  /**
   * Retrieve prioritized next steps and relevant BIS services derived from a compliance audit.
   * @param {number|string} reportId
   * @returns {Promise<Object>} ComplianceNextSteps
   */
  async getComplianceServices(reportId) {
    return await apiClient.get(`/compliance/${reportId}/recommended-services`);
  },
};
