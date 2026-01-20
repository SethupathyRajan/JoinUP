import { db } from '../server.js';

export const createNotification = async (userId: string, notification: {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  actionUrl?: string;
}) => {
  try {
    await db.collection('notifications').add({
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: false,
      createdAt: new Date(),
      actionUrl: notification.actionUrl
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
