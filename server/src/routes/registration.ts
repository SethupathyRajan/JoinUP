import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireAdmin, requireStudent } from '../middleware/auth.js';
import { validate, createRegistrationSchema, updateRegistrationStatusSchema } from '../utils/validation.js';
import { Registration, ApiResponse } from '../models/types.js';
import { awardPoints, POINTS } from '../services/gamification.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// Register for hackathon (students only)
router.post('/', authenticateToken, requireStudent, validate(createRegistrationSchema), async (req, res) => {
  try {
    const { hackathonId, teamName, teamMembers } = req.body;
    const userId = req.user!.id;
    
    // Check if hackathon exists and is open for registration
    const hackathonDoc = await db.collection('hackathons').doc(hackathonId).get();
    if (!hackathonDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Hackathon not found'
      });
    }
    
    const hackathonData = hackathonDoc.data();
    if (new Date() > hackathonData.registrationDeadline.toDate()) {
      return res.status(400).json({
        success: false,
        error: 'Registration deadline has passed'
      });
    }
    
    // Check if user already registered
    const existingRegistration = await db.collection('registrations')
      .where('userId', '==', userId)
      .where('hackathonId', '==', hackathonId)
      .limit(1)
      .get();
    
    if (!existingRegistration.empty) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this hackathon'
      });
    }
    
    const registrationData: Omit<Registration, 'id'> = {
      hackathonId,
      userId,
      teamName,
      teamMembers: teamMembers || [],
      status: 'pending',
      submittedAt: new Date(),
      priority: 'medium',
      isTeamLeader: true
    };
    
    const docRef = await db.collection('registrations').add(registrationData);
    
    // Award points for registration
    const hasTeam = teamMembers && teamMembers.length > 0;
    const points = hasTeam ? POINTS.COMPLETE_TEAM_REGISTRATION : POINTS.REGISTER_COMPETITION;
    await awardPoints(userId, points, `Registered for ${hackathonData.title}`);
    
    const response: ApiResponse<{ registrationId: string }> = {
      success: true,
      data: { registrationId: docRef.id },
      message: 'Registration submitted successfully'
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for hackathon'
    });
  }
});

// Get registrations (admin sees all, students see own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hackathonId, status, page = 1, limit = 20 } = req.query as any;
    
    let query = db.collection('registrations');
    
    // Students can only see their own registrations
    if (!req.isAdmin) {
      query = query.where('userId', '==', req.user!.id);
    }
    
    if (hackathonId) {
      query = query.where('hackathonId', '==', hackathonId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // For now, remove orderBy to avoid index requirement
    // TODO: Create Firestore index for better performance
    const snapshot = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .get();
    
    const registrations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const response: ApiResponse<{ registrations: any[] }> = {
      success: true,
      data: { registrations },
      message: 'Registrations retrieved successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get registrations'
    });
  }
});

// Update registration status (admin only)
router.put('/:registrationId/status', 
  authenticateToken, 
  requireAdmin, 
  validate(updateRegistrationStatusSchema), 
  async (req, res) => {
    try {
      const { registrationId } = req.params;
      const { status, feedback } = req.body;
      
      const registrationRef = db.collection('registrations').doc(registrationId);
      const registrationDoc = await registrationRef.get();
      
      if (!registrationDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found'
        });
      }
      
      const updateData = {
        status,
        feedback,
        reviewedAt: new Date(),
        reviewedBy: req.user!.id
      };
      
      await registrationRef.update(updateData);
      
      // Send notification email
      const registrationData = registrationDoc.data() as Registration;
      const userDoc = await db.collection('users').doc(registrationData.userId).get();
      const userData = userDoc.data();
      
      const hackathonDoc = await db.collection('hackathons').doc(registrationData.hackathonId).get();
      const hackathonData = hackathonDoc.data();
      
      if (userData && hackathonData) {
        await sendEmail({
          to: userData.email,
          subject: `Registration ${status === 'approved' ? 'Approved' : 'Update'}: ${hackathonData.title}`,
          template: status === 'approved' ? 'registration-approved' : 'registration-update',
          context: {
            userName: userData.name,
            hackathonTitle: hackathonData.title,
            status,
            feedback,
            teamName: registrationData.teamName
          }
        });
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Registration status updated successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Update registration status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update registration status'
      });
    }
  }
);

export default router;
