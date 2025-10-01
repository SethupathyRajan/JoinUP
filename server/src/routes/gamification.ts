import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ApiResponse } from '../models/types.js';
import { getLeaderboard, BADGE_DEFINITIONS } from '../services/gamification.js';

const router = express.Router();

// Get user's gamification stats (students only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Admin users don't have gamification stats
    if (req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Gamification stats are only available for students'
      });
    }
    
    // For now, return default stats since we haven't implemented the full gamification system
    const defaultStats = {
      points: 0,
      level: 1,
      badges: [],
      streaks: {
        daily: 0,
        weekly: 0, 
        hackathon: 0,
        lastUpdated: new Date()
      },
      achievements: [],
      totalParticipations: 0,
      totalWins: 0
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: defaultStats,
      message: 'Stats retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    // For now, return empty achievements
    const achievements = [];
    
    const response: ApiResponse<{ achievements: any[] }> = {
      success: true,
      data: { achievements },
      message: 'Achievements retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { department, year, limit = 50 } = req.query as any;
    
    let leaderboard = [];
    try {
      leaderboard = await getLeaderboard(
        parseInt(limit),
        department,
        year ? parseInt(year) : undefined
      );
    } catch (error) {
      console.log('Fallback to sample leaderboard data');
    }
    
    // If no leaderboard data, provide sample data for testing
    if (leaderboard.length === 0) {
      leaderboard = [
        {
          userId: 'user1',
          userName: 'Alice Johnson',
          department: 'Computer Science & Engineering',
          points: 2850,
          level: 15,
          totalParticipations: 12,
          totalWins: 8,
          rank: 1,
          badges: ['Champion', 'AI Master']
        },
        {
          userId: 'user2',
          userName: 'Bob Smith',
          department: 'Information Technology',
          points: 2650,
          level: 14,
          totalParticipations: 10,
          totalWins: 6,
          rank: 2,
          badges: ['Web Expert', 'Team Player']
        },
        {
          userId: 'user3',
          userName: 'Carol Davis',
          department: 'Computer Science & Engineering',
          points: 2400,
          level: 12,
          totalParticipations: 9,
          totalWins: 5,
          rank: 3,
          badges: ['Rising Star']
        }
      ];
    }
    
    const response: ApiResponse<{ leaderboard: any[] }> = {
      success: true,
      data: { leaderboard },
      message: 'Leaderboard retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

// Get available badges
router.get('/badges', async (req, res) => {
  try {
    const response: ApiResponse<{ badges: any[] }> = {
      success: true,
      data: { badges: BADGE_DEFINITIONS },
      message: 'Badges retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get badges'
    });
  }
});

export default router;
