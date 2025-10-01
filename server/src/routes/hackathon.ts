import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate, createHackathonSchema, updateHackathonSchema } from '../utils/validation.js';
import { Hackathon, ApiResponse } from '../models/types.js';

const router = express.Router();

// Get all hackathons (public)
router.get('/', async (req, res) => {
  try {
    const { status, category, limit = 20, page = 1 } = req.query as any;
    
    let query = db.collection('hackathons');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Apply pagination  
    const offset = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
    
    let hackathons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If no hackathons found, return sample data for testing
    if (hackathons.length === 0) {
      hackathons = [
        {
          id: 'sample-1',
          title: 'Tech Hackathon 2024',
          description: 'Build innovative solutions using cutting-edge technology',
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-01-17'),
          registrationDeadline: new Date('2025-01-10'),
          maxTeamSize: 4,
          minTeamSize: 1,
          status: 'upcoming',
          tags: ['Web Development', 'AI/ML', 'Mobile'],
          prizeMoney: 50000,
          location: 'Tech Campus',
          registeredTeams: 45,
          totalSlots: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        },
        {
          id: 'sample-2', 
          title: 'AI/ML Challenge',
          description: 'Solve real-world problems using artificial intelligence and machine learning',
          startDate: new Date('2025-01-22'),
          endDate: new Date('2025-01-24'),
          registrationDeadline: new Date('2025-01-18'),
          maxTeamSize: 3,
          minTeamSize: 1,
          status: 'upcoming',
          tags: ['AI/ML', 'Data Science', 'Python'],
          prizeMoney: 75000,
          location: 'Innovation Lab',
          registeredTeams: 28,
          totalSlots: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        },
        {
          id: 'sample-3',
          title: 'Web Development Contest',
          description: 'Create stunning web applications with modern frameworks',
          startDate: new Date('2025-02-05'),
          endDate: new Date('2025-02-06'),
          registrationDeadline: new Date('2025-02-01'),
          maxTeamSize: 2,
          minTeamSize: 1,
          status: 'upcoming',
          tags: ['React', 'Node.js', 'Full Stack'],
          prizeMoney: 30000,
          location: 'Online',
          registeredTeams: 67,
          totalSlots: 80,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        }
      ];
    }
    
    const response: ApiResponse<{ hackathons: any[] }> = {
      success: true,
      data: { hackathons },
      message: 'Hackathons retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get hackathons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hackathons'
    });
  }
});

// Get single hackathon
router.get('/:hackathonId', async (req, res) => {
  try {
    const { hackathonId } = req.params;
    
    const hackathonDoc = await db.collection('hackathons').doc(hackathonId).get();
    
    if (!hackathonDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Hackathon not found'
      });
    }
    
    const hackathonData = hackathonDoc.data();
    
    const response: ApiResponse<{ hackathon: any }> = {
      success: true,
      data: { hackathon: { id: hackathonDoc.id, ...hackathonData } },
      message: 'Hackathon retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get hackathon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hackathon'
    });
  }
});

// Create hackathon (admin only)
router.post('/', authenticateToken, requireAdmin, validate(createHackathonSchema), async (req, res) => {
  try {
    const hackathonData: Omit<Hackathon, 'id'> = {
      ...req.body,
      createdBy: req.user!.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'upcoming'
    };
    
    const docRef = await db.collection('hackathons').add(hackathonData);
    
    const response: ApiResponse<{ hackathonId: string }> = {
      success: true,
      data: { hackathonId: docRef.id },
      message: 'Hackathon created successfully'
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Create hackathon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hackathon'
    });
  }
});

// Update hackathon (admin only)
router.put('/:hackathonId', authenticateToken, requireAdmin, validate(updateHackathonSchema), async (req, res) => {
  try {
    const { hackathonId } = req.params;
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    await db.collection('hackathons').doc(hackathonId).update(updateData);
    
    const response: ApiResponse = {
      success: true,
      message: 'Hackathon updated successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Update hackathon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hackathon'
    });
  }
});

// Delete hackathon (admin only)
router.delete('/:hackathonId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { hackathonId } = req.params;
    
    await db.collection('hackathons').doc(hackathonId).delete();
    
    const response: ApiResponse = {
      success: true,
      message: 'Hackathon deleted successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Delete hackathon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete hackathon'
    });
  }
});

export default router;
