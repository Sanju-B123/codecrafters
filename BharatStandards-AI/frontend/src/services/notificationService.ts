/**
 * BharatStandards AI - Notification API Service
 * Strongly typed client for notifications, unread counts, and status updates.
 */
import { apiClient } from './apiClient';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';

export const notificationService = {
  /**
   * Retrieve paginated user notifications.
   */
  async getNotifications(
    isRead?: boolean,
    page: number = 1,
    limit: number = 20,
  ): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (typeof isRead === 'boolean') query.set('is_read', String(isRead));
    if (page) query.set('page', String(page));
    if (limit) query.set('limit', String(limit));

    const qs = query.toString();
    const endpoint = `/notifications${qs ? `?${qs}` : ''}`;
    return apiClient(endpoint);
  },

  /**
   * Fast query for unread notification count.
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient('/notifications/unread-count');
  },

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(notificationId: number): Promise<Notification> {
    return apiClient(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },

  /**
   * Mark all unread notifications as read in bulk.
   */
  async markAllAsRead(): Promise<{ success: boolean; updated_count: number; message: string }> {
    return apiClient('/notifications/read-all', {
      method: 'POST',
    });
  },

  /**
   * Dismiss or permanently delete a notification.
   */
  async deleteNotification(
    notificationId: number,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
