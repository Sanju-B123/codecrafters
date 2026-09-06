/**
 * Authentication Service for BharatStandards AI
 */
import {
  apiClient,
  setStoredAuth,
  clearStoredAuth,
  getStoredToken,
} from './apiClient';

export const authService = {
  /**
   * Register a new user (Industry or Consumer).
   * @param {Object} data { name, email, password, confirm_password, role }
   * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
   */
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    if (response?.access_token) {
      setStoredAuth(response.access_token, response.user);
    }
    return response;
  },

  /**
   * Log in an existing user.
   * @param {Object} credentials { email, password, remember_me }
   * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response?.access_token) {
      setStoredAuth(response.access_token, response.user);
    }
    return response;
  },

  /**
   * Log out the current user and invalidate local auth storage.
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      clearStoredAuth();
    }
  },

  /**
   * Fetch current authenticated user profile using active JWT.
   * @returns {Promise<Object>} User details with profile
   */
  async getCurrentUser() {
    const token = getStoredToken();
    if (!token) return null;
    return await apiClient.get('/auth/me');
  },
};
