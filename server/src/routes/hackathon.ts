import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate, createHackathonSchema, updateHackathonSchema } from '../utils/validation.js';
import { Hackathon, ApiResponse } from '../models/types.js';

const router = express.Router();

// Local sample data used when the hackathons collection is empty (for dev/testing)
const SAMPLE_HACKATHONS: any[] = [
  {
    id: 'sample-1',
    title: 'Tech Hackathon 2026',
    description: 'Build innovative solutions using cutting-edge technology',
    startDate: new Date('2026-03-15'),
    endDate: new Date('2026-03-17'),
    registrationDeadline: new Date('2026-03-10'),
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
    startDate: new Date('2026-04-05'),
    endDate: new Date('2026-04-07'),
    registrationDeadline: new Date('2026-03-30'),
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
    startDate: new Date('2026-05-10'),
    endDate: new Date('2026-05-11'),
    registrationDeadline: new Date('2026-05-01'),
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
  },
  {
    id: 'sample-4',
    title: 'CyberSecure Sprint',
    description: 'Capture the flag style security contest focused on applied cyber security techniques',
    startDate: new Date('2026-02-20'),
    endDate: new Date('2026-02-21'),
    registrationDeadline: new Date('2026-02-15'),
    maxTeamSize: 5,
    minTeamSize: 1,
    status: 'upcoming',
    tags: ['Cyber Security', 'CTF', 'Networking'],
    prizeMoney: 40000,
    location: 'Security Lab',
    registeredTeams: 12,
    totalSlots: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  {
    id: 'sample-5',
    title: 'Designathon',
    description: 'A creative design challenge focusing on UI/UX and product thinking',
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-01-11'),
    registrationDeadline: new Date('2026-01-05'),
    maxTeamSize: 3,
    minTeamSize: 1,
    status: 'completed',
    tags: ['Design', 'Product', 'UI/UX'],
    prizeMoney: 20000,
    location: 'Design Studio',
    registeredTeams: 30,
    totalSlots: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  {
    id: 'sample-6',
    title: 'Mobile App Jam',
    description: 'Rapid mobile app prototyping by multidisciplinary teams',
    startDate: new Date('2026-06-12'),
    endDate: new Date('2026-06-13'),
    registrationDeadline: new Date('2026-06-01'),
    maxTeamSize: 4,
    minTeamSize: 1,
    status: 'upcoming',
    tags: ['Mobile', 'Android', 'iOS'],
    prizeMoney: 35000,
    location: 'Innovation Hub',
    registeredTeams: 5,
    totalSlots: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  }
];

// Get all hackathons (public)
router.get('/', async (req, res) => {
  try {
    const { status, category, limit = 20, page = 1 } = req.query as any;
    
  let query: any = db.collection('hackathons');
    
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
    
    let hackathons: any[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If no hackathons found, return sample data for testing
    if (hackathons.length === 0) {
      // Expanded sample list for local testing
      hackathons = [
        {
          id: 'sample-1',
          title: 'Tech Hackathon 2026',
          description: 'Build innovative solutions using cutting-edge technology',
          startDate: new Date('2026-03-15'),
          endDate: new Date('2026-03-17'),
          registrationDeadline: new Date('2026-03-10'),
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
          startDate: new Date('2026-04-05'),
          endDate: new Date('2026-04-07'),
          registrationDeadline: new Date('2026-03-30'),
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
          startDate: new Date('2026-05-10'),
          endDate: new Date('2026-05-11'),
          registrationDeadline: new Date('2026-05-01'),
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
        },
        {
          id: 'sample-4',
          title: 'CyberSecure Sprint',
          description: 'Capture the flag style security contest focused on applied cyber security techniques',
          startDate: new Date('2026-02-20'),
          endDate: new Date('2026-02-21'),
          registrationDeadline: new Date('2026-02-15'),
          maxTeamSize: 5,
          minTeamSize: 1,
          status: 'upcoming',
          tags: ['Cyber Security', 'CTF', 'Networking'],
          prizeMoney: 40000,
          location: 'Security Lab',
          registeredTeams: 12,
          totalSlots: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        },
        {
          id: 'sample-5',
          title: 'Designathon',
          description: 'A creative design challenge focusing on UI/UX and product thinking',
          startDate: new Date('2026-01-10'),
          endDate: new Date('2026-01-11'),
          registrationDeadline: new Date('2026-01-05'),
          maxTeamSize: 3,
          minTeamSize: 1,
          status: 'completed',
          tags: ['Design', 'Product', 'UI/UX'],
          prizeMoney: 20000,
          location: 'Design Studio',
          registeredTeams: 30,
          totalSlots: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        },
        {
          id: 'sample-6',
          title: 'Mobile App Jam',
          description: 'Rapid mobile app prototyping by multidisciplinary teams',
          startDate: new Date('2026-06-12'),
          endDate: new Date('2026-06-13'),
          registrationDeadline: new Date('2026-06-01'),
          maxTeamSize: 4,
          minTeamSize: 1,
          status: 'upcoming',
          tags: ['Mobile', 'Android', 'iOS'],
          prizeMoney: 35000,
          location: 'Innovation Hub',
          registeredTeams: 5,
          totalSlots: 60,
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
      // If collection is empty, try to return a sample hackathon matching the id
      const collectionSnapshot = await db.collection('hackathons').limit(1).get();
      if (collectionSnapshot.empty) {
        const sample = SAMPLE_HACKATHONS.find(s => s.id === hackathonId);
        if (sample) {
          const response: ApiResponse<{ hackathon: any }> = {
            success: true,
            data: { hackathon: sample },
            message: 'Hackathon (sample) retrieved successfully'
          };
          return res.json(response);
        }
      }

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
