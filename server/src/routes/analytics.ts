import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { ApiResponse } from '../models/types.js';

const router = express.Router();

// Get platform analytics (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users count
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    // Get total hackathons count
    const hackathonsSnapshot = await db.collection('hackathons').get();
    const totalHackathons = hackathonsSnapshot.size;
    
    // Get total registrations count
    const registrationsSnapshot = await db.collection('registrations').get();
    const totalRegistrations = registrationsSnapshot.size;
    
    // Calculate approval rate
    const approvedRegistrations = registrationsSnapshot.docs.filter(
      doc => doc.data().status === 'approved'
    ).length;
    const approvalRate = totalRegistrations > 0 ? (approvedRegistrations / totalRegistrations) * 100 : 0;
    
    // Get department distribution
    const departmentDistribution: Record<string, number> = {};
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      departmentDistribution[user.department] = (departmentDistribution[user.department] || 0) + 1;
    });
    
    // Get year distribution
    const yearDistribution: Record<string, number> = {};
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      const year = `Year ${user.year}`;
      yearDistribution[year] = (yearDistribution[year] || 0) + 1;
    });
    
    const analytics = {
      totalUsers,
      totalStudents: totalUsers, // All users are students in this system
      totalHackathons,
      totalRegistrations,
      approvalRate: Math.round(approvalRate * 100) / 100,
      departmentDistribution,
      yearDistribution,
      monthlyParticipation: {}, // TODO: Implement monthly participation stats
      competitionCategories: {}, // TODO: Implement competition categories stats
      averageTeamSize: 0 // TODO: Calculate average team size
    };
    
    const response: ApiResponse<{ analytics: any }> = {
      success: true,
      data: { analytics },
      message: 'Analytics retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

export default router;
