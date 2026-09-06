/**
 * BharatStandards AI - Product Service
 * Handles API communication for Product CRUD and standards discovery analysis.
 */
import { apiClient } from './apiClient';

export const productService = {
  /**
   * Retrieve list of registered products owned by authenticated user.
   * @param {Object} [params] Query filters { search, category, status }
   * @returns {Promise<{ items: Array, total: number }>}
   */
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint);
  },

  /**
   * Fetch single product details by ID.
   * @param {number|string} id
   * @returns {Promise<Object>} Product
   */
  async getProduct(id) {
    return await apiClient.get(`/products/${id}`);
  },

  /**
   * Register a new product.
   * @param {Object} product CreateProductRequest
   * @returns {Promise<Object>} Created Product
   */
  async createProduct(product) {
    return await apiClient.post('/products', product);
  },

  /**
   * Update existing product specifications.
   * @param {number|string} id
   * @param {Object} updates UpdateProductRequest
   * @returns {Promise<Object>} Updated Product
   */
  async updateProduct(id, updates) {
    return await apiClient.put(`/products/${id}`, updates);
  },

  /**
   * Permanently delete a product.
   * @param {number|string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteProduct(id) {
    return await apiClient.delete(`/products/${id}`);
  },

  /**
   * Initiate mock standards discovery analysis for a product.
   * @param {number|string} id
   * @returns {Promise<Object>} ProductAnalysis
   */
  async analyzeProduct(id) {
    return await apiClient.post(`/products/${id}/analyze`, {});
  },

  /**
   * Retrieve existing analysis results for a product.
   * @param {number|string} id
   * @returns {Promise<Object>} ProductAnalysis
   */
  async getProductAnalysis(id) {
    return await apiClient.get(`/products/${id}/analysis`);
  },
};
