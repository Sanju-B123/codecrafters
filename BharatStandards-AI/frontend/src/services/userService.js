/**
 * User & Profile Service for BharatStandards AI
 */
import { apiClient } from './apiClient';

export const userService = {
  /**
   * Fetch current authenticated user profile and preferences.
   * @returns {Promise<Object>} UserDetailResponse
   */
  async getCurrentUser() {
    return await apiClient.get('/users/me');
  },

  /**
   * Update personal and organization profile information.
   * @param {Object} data { name, phone, organization, industry, designation, location, avatar_url, interests }
   * @returns {Promise<Object>} Updated UserDetailResponse
   */
  async updateProfile(data) {
    return await apiClient.put('/users/me', data);
  },

  /**
   * Change user password.
   * @param {Object} data { current_password, new_password, confirm_new_password }
   * @returns {Promise<{ message: string }>}
   */
  async changePassword(data) {
    return await apiClient.put('/users/me/password', data);
  },

  /**
   * Update user preferences (notifications, theme, language).
   * @param {Object} preferences { email_notifications, compliance_notifications, document_notifications, product_notifications, theme, language }
   * @returns {Promise<{ message: string }>}
   */
  async updatePreferences(preferences) {
    return await apiClient.put('/users/me/preferences', preferences);
  },

  /**
   * Permanently delete user account and profile.
   * @param {string} confirmation Must be "DELETE"
   * @returns {Promise<{ message: string }>}
   */
  async deleteAccount(confirmation = 'DELETE') {
    return await apiClient.delete('/users/me', {
      body: { confirmation },
    });
  },
};
