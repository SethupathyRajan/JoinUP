import { Notification } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export const notificationService = {
  // Get user notifications
  getNotifications: async (unreadOnly: boolean = false): Promise<Notification[]> => {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.NOTIFICATION.LIST}?unreadOnly=${unreadOnly}`,
      {},
      true
    );
    return response.data?.notifications || [];
  },

  // Mark notification as read
  markAsRead: async (notificationIds: string[]): Promise<void> => {
    await apiRequest(
      API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_READ(''),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      },
      true
    );
  },

  // Mark all as read
  markAllAsRead: async (notificationIds: string[]): Promise<void> => {
    await notificationService.markAsRead(notificationIds);
  },
};
