/**
 * BharatStandards AI - Activity & Audit Trail API Service
 * Strongly typed client for querying user action history and audit events.
 */
import { apiClient } from './apiClient';
import type { ActivityFilterParams, ActivityListResponse } from '../types/activity';

export const activityService = {
  /**
   * Fetch paginated user activity events with optional filtering.
   */
  async getActivity(params: ActivityFilterParams = {}): Promise<ActivityListResponse> {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.entity_type) query.set('entity_type', params.entity_type);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/activity${qs ? `?${qs}` : ''}`;
    return apiClient(endpoint);
  },
};
