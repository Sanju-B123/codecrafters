/**
 * BharatStandards AI - Document Intelligence Service
 * Handles API communication for uploading PDF test reports, monitoring extraction, and searching chunk evidence.
 */
import { apiClient } from './apiClient';

export const documentService = {
  /**
   * Retrieve list of documents owned by the authenticated user.
   * @param {Object} [params] Query filters { product_id, status, search, page, page_size }
   * @returns {Promise<{ items: Array, total: number, page: number, total_pages: number }>}
   */
  async getDocuments(params = {}) {
    const query = new URLSearchParams();
    if (params.product_id) query.append('product_id', params.product_id);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    const queryString = query.toString();
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  /**
   * Fetch single document metadata and extracted text chunks.
   * @param {number|string} id
   * @returns {Promise<Object>} DocumentDetailResponse
   */
  async getDocument(id) {
    return await apiClient.get(`/documents/${id}`);
  },

  /**
   * Upload a PDF document with optional product linkage.
   * @param {File} file
   * @param {number|string} [productId]
   * @returns {Promise<Object>} DocumentResponse
   */
  async uploadDocument(file, productId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) {
      formData.append('product_id', productId);
    }
    return await apiClient.post('/documents/upload', formData);
  },

  /**
   * Permanently delete a document and its stored chunks.
   * @param {number|string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteDocument(id) {
    return await apiClient.delete(`/documents/${id}`);
  },

  /**
   * Re-trigger text extraction and chunking pipeline.
   * @param {number|string} id
   * @returns {Promise<Object>} DocumentResponse
   */
  async processDocument(id) {
    return await apiClient.post(`/documents/${id}/process`, {});
  },

  /**
   * Retrieve current processing status of a document.
   * @param {number|string} id
   * @returns {Promise<{ id: number, status: string, page_count: number, processing_error: string }>}
   */
  async getDocumentStatus(id) {
    return await apiClient.get(`/documents/${id}/status`);
  },

  /**
   * Search for keywords within the extracted chunks of a document.
   * @param {number|string} id
   * @param {string} query
   * @returns {Promise<Array<{ chunk_id: number, page: number, snippet: string, full_content: string }>>}
   */
  async searchDocument(id, query) {
    return await apiClient.get(`/documents/${id}/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Fetch documents associated with a specific product.
   * @param {number|string} productId
   * @returns {Promise<{ items: Array, total: number }>}
   */
  async getProductDocuments(productId) {
    return await apiClient.get(`/documents/product/${productId}`);
  },
};
