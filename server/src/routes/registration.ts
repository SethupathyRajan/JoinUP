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
  const { hackathonId, teamName, teamMembers, gformLink, note, bonafideFiles } = req.body;
  const userId = req.user!.id;
    
    // Check if hackathon exists and is open for registration
    const hackathonDoc = await db.collection('hackathons').doc(hackathonId).get();
    let hackathonData: any = null;
    if (!hackathonDoc.exists) {
      // If collection is empty (dev), allow registrations for local sample hackathons
      const collectionSnapshot = await db.collection('hackathons').limit(1).get();
      if (collectionSnapshot.empty) {
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

        const sample = SAMPLE_HACKATHONS.find(s => s.id === hackathonId);
        if (sample) {
          hackathonData = sample;
        } else {
          return res.status(404).json({
            success: false,
            error: 'Hackathon not found'
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          error: 'Hackathon not found'
        });
      }
    } else {
      hackathonData = hackathonDoc.data() as any;
    }
    if (new Date() > (hackathonData.registrationDeadline?.toDate ? hackathonData.registrationDeadline.toDate() : new Date(hackathonData.registrationDeadline))) {
      return res.status(400).json({
        success: false,
        error: 'Registration deadline has passed'
      });
    }
    
    // Check if user already registered (as leader or member)
    const existingRegistration = await db.collection('registrations')
      .where('hackathonId', '==', hackathonId)
      .where('status', 'in', ['pending','approved'])
      .get();

    const already = existingRegistration.docs.some(doc => {
      const data = doc.data();
      if (data.userId === userId) return true;
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        return data.teamMembers.some((m: any) => m.id === userId || m.rollNumber === req.user?.rollNumber);
      }
      return false;
    });

    if (already) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this hackathon'
      });
    }

    // Resolve team members to user IDs (if provided as roll/register or id)
    const resolvedMembers: Array<any> = [];
    if (teamMembers && Array.isArray(teamMembers)) {
      for (const member of teamMembers) {
        if (typeof member === 'string') {
          // assume member is userId
          const userDoc = await db.collection('users').doc(member).get();
          if (userDoc.exists) {
            resolvedMembers.push({ id: userDoc.id, ...(userDoc.data() as any) });
          }
        } else if (member.id) {
          const userDoc = await db.collection('users').doc(member.id).get();
          if (userDoc.exists) resolvedMembers.push({ id: userDoc.id, ...(userDoc.data() as any) });
        } else if (member.rollNumber || member.registerNumber || member.email) {
          let query = db.collection('users') as any;
          if (member.rollNumber) query = query.where('rollNumber', '==', member.rollNumber);
          if (member.registerNumber) query = query.where('registerNumber', '==', member.registerNumber);
          if (member.email) query = query.where('email', '==', member.email);
          const qsnap = await query.limit(1).get();
          if (!qsnap.empty) {
            const doc = qsnap.docs[0];
            resolvedMembers.push({ id: doc.id, ...(doc.data() as any) });
          }
        }
      }
    }

    // Always ensure leader is included
    if (!resolvedMembers.find(m => m.id === userId)) {
      const leaderDoc = await db.collection('users').doc(userId).get();
      if (leaderDoc.exists) resolvedMembers.unshift({ id: leaderDoc.id, ...(leaderDoc.data() as any) });
    }

    const registrationData: Omit<Registration, 'id'> = {
      hackathonId,
      userId,
      teamName,
      teamMembers: resolvedMembers,
      status: 'pending',
      submittedAt: new Date(),
      priority: 'medium',
      isTeamLeader: true,
      gformLink: gformLink || '',
      note: note || '',
      bonafideFiles: bonafideFiles || []
    } as any;

    const docRef = await db.collection('registrations').add(registrationData);

    // Award points for registration to all members
    const hasTeam = resolvedMembers && resolvedMembers.length > 1;
    const points = hasTeam ? POINTS.COMPLETE_TEAM_REGISTRATION : POINTS.REGISTER_COMPETITION;
    for (const member of resolvedMembers) {
      try {
        await awardPoints(member.id, points, `Registered for ${hackathonData.title}`);
      } catch (err) {
        console.error('Error awarding points to member', member.id, err);
      }
    }
    
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
    
  let query: any = db.collection('registrations');
    
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
    
    const registrations = snapshot.docs.map((doc: any) => ({
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
      
      // Build update object without undefined values (Firestore rejects undefined)
      const updateData: any = {
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user!.id
      };

      if (typeof feedback !== 'undefined') {
        updateData.feedback = feedback;
      }

      await registrationRef.update(updateData);
      
      // Send notification email
      const registrationData = registrationDoc.data() as Registration;
      const userDoc = await db.collection('users').doc(registrationData.userId).get();
      const userData = userDoc.data();
      
      const hackathonDoc = await db.collection('hackathons').doc(registrationData.hackathonId).get();
      const hackathonData = hackathonDoc.data();
      
      if (userData && hackathonData) {
        try {
          const mailContext = {
            userName: userData.name,
            hackathonTitle: hackathonData.title,
            status,
            feedback,
            teamName: registrationData.teamName
          };

          console.log('Sending registration status email', {
            to: userData.email,
            template: status === 'approved' ? 'registration-approved' : 'registration-update',
            context: mailContext
          });

          await sendEmail({
            to: userData.email,
            subject: `Registration ${status === 'approved' ? 'Approved' : 'Update'}: ${hackathonData.title}`,
            template: status === 'approved' ? 'registration-approved' : 'registration-update',
            context: mailContext
          });
        } catch (emailErr) {
          console.error('Failed to send registration status email', {
            to: userData.email,
            error: emailErr
          });
          // Don't fail the whole request due to email problems; respond success but note the email failure in logs
        }
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
