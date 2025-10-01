import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { ApiResponse } from '../models/types.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query as any;
    
    let query = db.collection('notifications').where('userId', '==', userId);
    
    if (unreadOnly === 'true') {
      query = query.where('isRead', '==', false);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();
    
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const response: ApiResponse<{ notifications: any[] }> = {
      success: true,
      data: { notifications },
      message: 'Notifications retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// Mark notifications as read
router.put('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user!.id;
    
    const batch = db.batch();
    
    for (const notificationId of notificationIds) {
      const notificationRef = db.collection('notifications').doc(notificationId);
      batch.update(notificationRef, { 
        isRead: true, 
        readAt: new Date() 
      });
    }
    
    await batch.commit();
    
    const response: ApiResponse = {
      success: true,
      message: 'Notifications marked as read'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

export default router;
