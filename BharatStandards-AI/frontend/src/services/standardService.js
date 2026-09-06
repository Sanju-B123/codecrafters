/**
 * BharatStandards AI - Standards Knowledge Base Service
 * Handles API communication for exploring standards, searching clauses, and viewing evidence requirements.
 */
import { apiClient } from './apiClient';

export const standardService = {
  /**
   * Retrieve paginated list of Indian Standards.
   * @param {Object} [params] Query filters { q, category, status, page, page_size, sort_by }
   * @returns {Promise<{ items: Array, total: number, page: number, page_size: number, total_pages: number }>}
   */
  async getStandards(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    if (params.sort_by) query.append('sort_by', params.sort_by);

    const queryString = query.toString();
    const endpoint = `/standards${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  /**
   * Dedicated search endpoint for fast keyword queries across standards.
   * @param {Object} params
   * @returns {Promise<{ items: Array, total: number, page: number, total_pages: number }>}
   */
  async searchStandards(params = {}) {
    return await this.getStandards(params);
  },

  /**
   * Fetch complete standard details including its clause requirements.
   * @param {number|string} identifier Standard ID or Standard Code (e.g. 'DEMO-IS-001')
   * @returns {Promise<Object>} StandardDetail
   */
  async getStandard(identifier) {
    return await apiClient.get(`/standards/${identifier}`);
  },

  /**
   * Retrieve clauses and verification evidence for a standard.
   * @param {number|string} identifier
   * @param {string} [category] Optional filter (SAFETY, PERFORMANCE, TESTING, etc.)
   * @returns {Promise<Array>} List of Requirement objects
   */
  async getRequirements(identifier, category = '') {
    const query = new URLSearchParams();
    if (category && category !== 'ALL') query.append('category', category);
    const queryString = query.toString();
    const endpoint = `/standards/${identifier}/requirements${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  /**
   * Trigger standards discovery for a given registered product.
   * @param {number|string} productId
   * @returns {Promise<Object>} ProductAnalysis
   */
  async findApplicableStandards(productId) {
    return await apiClient.post(`/products/${productId}/analyze`, {});
  },
};
