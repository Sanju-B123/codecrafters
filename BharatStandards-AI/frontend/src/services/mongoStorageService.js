/**
 * BharatStandards AI - MongoDB Frontend State Storage Service
 * Persists UI state, client configurations, draft evaluations, and user preferences
 * directly to the backend MongoDB persistence layer, with offline localStorage fallback.
 */

import { apiClient } from './apiClient';

const LOCAL_FALLBACK_PREFIX = 'bs_mongo_state_';

export const mongoStorageService = {
  /**
   * Save a key-value state payload directly to MongoDB collection 'frontend_states'.
   * Also mirrors to localStorage for offline resilience.
   */
  async saveState(key, data) {
    try {
      localStorage.setItem(`${LOCAL_FALLBACK_PREFIX}${key}`, JSON.stringify(data));
    } catch (err) {
      console.warn('LocalStorage save fallback warning:', err);
    }

    try {
      const response = await apiClient.post('/mongodb/frontend-state', {
        key,
        data,
      });
      return response;
    } catch (error) {
      console.warn(`MongoDB state sync deferred for '${key}':`, error.message);
      return { status: 'offline_cached', key, data };
    }
  },

  /**
   * Retrieve state by key from MongoDB, falling back to localStorage if offline.
   */
  async loadState(key) {
    try {
      const response = await apiClient.get(`/mongodb/frontend-state?key=${encodeURIComponent(key)}`);
      if (response?.exists && response.data) {
        try {
          localStorage.setItem(`${LOCAL_FALLBACK_PREFIX}${key}`, JSON.stringify(response.data));
        } catch (e) {
          // ignore
        }
        return response.data;
      }
    } catch (error) {
      console.warn(`MongoDB fetch failed for '${key}', checking offline cache:`, error.message);
    }

    // Offline cache fallback
    try {
      const cached = localStorage.getItem(`${LOCAL_FALLBACK_PREFIX}${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Fetch MongoDB cluster telemetry and diagnostics.
   */
  async getHealth() {
    return apiClient.get('/mongodb/health');
  },

  /**
   * List all collections and document counts in MongoDB.
   */
  async getCollections() {
    return apiClient.get('/mongodb/collections');
  },

  /**
   * Trigger an on-demand synchronization of all SQL tables to MongoDB.
   */
  async triggerSync() {
    return apiClient.post('/mongodb/sync');
  },
};
