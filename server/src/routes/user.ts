import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireOwnershipOrAdmin } from '../middleware/auth.js';
import { validate, updateProfileSchema, validateQuery, paginationSchema } from '../utils/validation.js';
import { User, ApiResponse, PaginationOptions } from '../models/types.js';
import { updateStreaks } from '../services/gamification.js';

const router = express.Router();

// Get user public profile (anyone can view)
router.get('/:userId/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data() as User;

    const sanitizedUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      department: userData.department,
      year: userData.year,
      rollNumber: userData.rollNumber,
      registerNumber: userData.registerNumber,
      profilePicture: userData.profilePicture,
      createdAt: userData.createdAt
    };

    const response: ApiResponse<{
      user: any;
      gameStats: any;
      achievements: any[];
      badges: any[];
    }> = {
      success: true,
      data: {
        user: sanitizedUser,
        gameStats: userData.gameStats || {
          points: 0,
          level: 1,
          totalParticipations: 0,
          totalWins: 0,
          badges: [],
          streaks: { daily: 0, weekly: 0, hackathon: 0, lastUpdated: new Date() },
          achievements: []
        },
        achievements: userData.gameStats?.achievements || [],
        badges: userData.gameStats?.badges || []
      },
      message: 'User profile retrieved successfully'
    };

    res.json(response);

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Get user profile (own profile only)
router.get('/:userId', authenticateToken, requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data() as User;

    // Update daily login streak
    await updateStreaks(userId, 'login');

    const response: ApiResponse<{ user: User }> = {
      success: true,
      data: { user: userData },
      message: 'User profile retrieved successfully'
    };

    res.json(response);

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/:userId', 
  authenticateToken, 
  requireOwnershipOrAdmin('userId'), 
  validate(updateProfileSchema), 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Add updated timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await db.collection('users').doc(userId).update(updateData);
      
      // Get updated user data
      const updatedUserDoc = await db.collection('users').doc(userId).get();
      const updatedUserData = updatedUserDoc.data() as User;
      
      const response: ApiResponse<{ user: User }> = {
        success: true,
        data: { user: updatedUserData },
        message: 'Profile updated successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

// Get user's game stats and achievements
router.get('/:userId/gamestats', authenticateToken, requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = userDoc.data() as User;
    
    // Get recent points history
    const pointsHistoryQuery = await db.collection('pointsHistory')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const pointsHistory = pointsHistoryQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const response: ApiResponse<{ 
      gameStats: any; 
      pointsHistory: any[];
    }> = {
      success: true,
      data: {
        gameStats: userData.gameStats,
        pointsHistory
      },
      message: 'Game stats retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game stats'
    });
  }
});

// Get user's participation history
router.get('/:userId/participations', 
  authenticateToken, 
  requireOwnershipOrAdmin('userId'),
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page, limit, sortBy, sortOrder } = req.query as PaginationOptions;
      
      // Get user's registrations
      let query = db.collection('registrations')
        .where('userId', '==', userId);
      
      // Apply sorting
      if (sortBy) {
        query = query.orderBy(sortBy, sortOrder as any);
      } else {
        query = query.orderBy('submittedAt', 'desc');
      }
      
      // Apply pagination
      const offset = (page - 1) * limit;
      const snapshot = await query.limit(limit).offset(offset).get();
      
      // Get total count
      const totalSnapshot = await db.collection('registrations')
        .where('userId', '==', userId)
        .get();
      
      const participations = [];
      
      // Fetch hackathon details for each registration
      for (const doc of snapshot.docs) {
        const registration = { id: doc.id, ...doc.data() };
        const hackathonDoc = await db.collection('hackathons').doc(registration.hackathonId).get();
        const hackathonData = hackathonDoc.exists ? hackathonDoc.data() : null;
        
        participations.push({
          ...registration,
          hackathon: hackathonData
        });
      }
      
      const totalPages = Math.ceil(totalSnapshot.size / limit);
      
      const response: ApiResponse<{ participations: any[] }> = {
        success: true,
        data: { participations },
        message: 'Participation history retrieved successfully',
        pagination: {
          page,
          limit,
          total: totalSnapshot.size,
          totalPages
        }
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Get participations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get participation history'
      });
    }
  }
);

// Search users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }
    
    const { search, department, year, page = 1, limit = 20 } = req.query as any;
    
    let query = db.collection('users');
    
    // Apply filters
    if (department) {
      query = query.where('department', '==', department);
    }
    
    if (year) {
      query = query.where('year', '==', parseInt(year));
    }
    
    // For search, we'll get all matching docs and filter in memory
    // In production, consider using Algolia or similar for full-text search
    const snapshot = await query.get();
    
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
    
    // Apply text search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.rollNumber.toLowerCase().includes(searchLower) ||
        user.registerNumber.includes(search)
      );
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);
    
    // Remove sensitive data
    const sanitizedUsers = paginatedUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      year: user.year,
      rollNumber: user.rollNumber,
      registerNumber: user.registerNumber,
      profilePicture: user.profilePicture,
      gameStats: {
        points: user.gameStats.points,
        level: user.gameStats.level,
        totalParticipations: user.gameStats.totalParticipations,
        totalWins: user.gameStats.totalWins
      },
      createdAt: user.createdAt
    }));
    
    const totalPages = Math.ceil(users.length / limit);
    
    const response: ApiResponse<{ users: any[] }> = {
      success: true,
      data: { users: sanitizedUsers },
      message: 'Users retrieved successfully',
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// Delete user account (own account only, or admin)
router.delete('/:userId', authenticateToken, requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data first
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user from Firestore
    await db.collection('users').doc(userId).delete();
    
    // Clean up related data (in a transaction for consistency)
    const batch = db.batch();
    
    // Delete user's registrations
    const registrationsQuery = await db.collection('registrations')
      .where('userId', '==', userId)
      .get();
    
    registrationsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's notifications
    const notificationsQuery = await db.collection('notifications')
      .where('userId', '==', userId)
      .get();
    
    notificationsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's points history
    const pointsHistoryQuery = await db.collection('pointsHistory')
      .where('userId', '==', userId)
      .get();
    
    pointsHistoryQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    const response: ApiResponse = {
      success: true,
      message: 'User account deleted successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user account'
    });
  }
});

export default router;
