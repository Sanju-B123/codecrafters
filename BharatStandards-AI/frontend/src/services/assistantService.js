/**
 * BharatStandards AI - Assistant Service API Client
 * Interfaces with the backend RAG AI Assistant endpoints.
 */
import { apiClient } from './apiClient';

export const assistantService = {
  /**
   * Fetch all conversations for the authenticated user.
   * @param {number|string} [productId] Optional product filter
   * @returns {Promise<Array>} List of Conversation objects
   */
  async getConversations(productId = null) {
    const endpoint = productId
      ? `/assistant/conversations?product_id=${encodeURIComponent(productId)}`
      : '/assistant/conversations';
    return await apiClient.get(endpoint);
  },

  /**
   * Create a new conversation session.
   * @param {string} [title] Optional title
   * @param {number|string} [productId] Optional product id
   * @returns {Promise<Object>} Conversation object
   */
  async createConversation(title = null, productId = null) {
    return await apiClient.post('/assistant/conversations', {
      title: title || 'New Standards Inquiry',
      product_id: productId ? parseInt(productId, 10) : null,
    });
  },

  /**
   * Fetch full conversation detail with message history and citations.
   * @param {number|string} conversationId
   * @returns {Promise<Object>} ConversationDetail object
   */
  async getConversation(conversationId) {
    return await apiClient.get(`/assistant/conversations/${conversationId}`);
  },

  /**
   * Delete a conversation thread and its associated messages.
   * @param {number|string} conversationId
   * @returns {Promise<void>}
   */
  async deleteConversation(conversationId) {
    return await apiClient.delete(`/assistant/conversations/${conversationId}`);
  },

  /**
   * Send a query to the AI Standards Assistant (RAG Pipeline).
   * @param {Object} payload { message, conversation_id, product_id }
   * @returns {Promise<Object>} ChatResponse { answer, confidence, sources, recommended_actions, disclaimer, conversation_id, message_id, is_demo }
   */
  async sendMessage(payload) {
    return await apiClient.post('/assistant/chat', {
      message: payload.message,
      conversation_id: payload.conversation_id || null,
      product_id: payload.product_id ? parseInt(payload.product_id, 10) : null,
    });
  },

  /**
   * Fetch product context, latest compliance audit status, and suggested prompts.
   * @param {number|string} productId
   * @returns {Promise<Object>} ProductContext object
   */
  async getProductContext(productId) {
    return await apiClient.get(`/assistant/product-context/${productId}`);
  },
};
