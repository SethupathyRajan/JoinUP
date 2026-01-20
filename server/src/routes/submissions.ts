import express from 'express';
import multer from 'multer';
import { db } from '../server.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { ApiResponse, PostEventSubmission, CompetitionAchievement } from '../models/types.js';
import { uploadToGoogleDrive } from '../services/googleDrive.js';
import { generateCertificateFileName } from '../utils/crypto.js';
import { awardPoints, POINTS } from '../services/gamification.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
        }
    }
});

// Create post-event submission
router.post('/',
    authenticateToken,
    upload.array('certificates', 5),
    async (req, res) => {
        try {
            const userId = req.user!.id;
            const { registrationId, hackathonId, projectLinks, repoUrl, demoUrl, description, achievements } = req.body;
            const files = req.files as Express.Multer.File[];

            // Validate registration exists and is approved
            const registrationDoc = await db.collection('registrations').doc(registrationId).get();
            if (!registrationDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Registration not found'
                });
            }

            const registrationData = registrationDoc.data();
            if (registrationData?.status !== 'approved') {
                return res.status(400).json({
                    success: false,
                    error: 'Only approved registrations can submit post-event data'
                });
            }

            if (registrationData?.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only submit for your own registrations'
                });
            }

            // Check if submission already exists
            const existingSubmission = await db.collection('submissions')
                .where('registrationId', '==', registrationId)
                .limit(1)
                .get();

            if (!existingSubmission.empty) {
                return res.status(400).json({
                    success: false,
                    error: 'Submission already exists for this registration'
                });
            }

            // Upload certificates to Google Drive
            const uploadedCertificates = [];
            if (files && files.length > 0) {
                for (const file of files) {
                    const fileName = generateCertificateFileName(userId, hackathonId, file.originalname);

                    try {
                        const googleDriveFileId = await uploadToGoogleDrive(
                            file.buffer,
                            `submissions/${hackathonId}/${userId}/${fileName}`,
                            file.mimetype
                        );

                        uploadedCertificates.push({
                            fileName,
                            originalName: file.originalname,
                            googleDriveFileId,
                            uploadedAt: new Date(),
                            fileSize: file.size,
                            mimeType: file.mimetype
                        });
                    } catch (error) {
                        console.error(`Failed to upload certificate ${file.originalname}:`, error);
                        throw new Error(`Failed to upload certificate: ${file.originalname}`);
                    }
                }
            }

            // Parse achievements if provided as string
            let parsedAchievements: CompetitionAchievement[] = [];
            if (achievements) {
                try {
                    parsedAchievements = typeof achievements === 'string'
                        ? JSON.parse(achievements)
                        : achievements;
                } catch (err) {
                    console.error('Error parsing achievements:', err);
                }
            }

            // Parse project links if provided as string
            let parsedProjectLinks: string[] = [];
            if (projectLinks) {
                try {
                    parsedProjectLinks = typeof projectLinks === 'string'
                        ? JSON.parse(projectLinks)
                        : projectLinks;
                } catch (err) {
                    parsedProjectLinks = Array.isArray(projectLinks) ? projectLinks : [projectLinks];
                }
            }

            // Create submission
            const submissionData: Omit<PostEventSubmission, 'id'> = {
                registrationId,
                userId,
                hackathonId,
                certificates: uploadedCertificates,
                projectLinks: parsedProjectLinks,
                repoUrl: repoUrl || '',
                demoUrl: demoUrl || '',
                description: description || '',
                achievements: parsedAchievements,
                status: 'pending',
                submittedAt: new Date()
            };

            const docRef = await db.collection('submissions').add(submissionData);

            // Create notification for admin
            await db.collection('notifications').add({
                userId: 'admin', // You might want to get actual admin IDs
                title: 'New Post-Event Submission',
                message: `${req.user!.name} submitted post-event data for review`,
                type: 'info',
                isRead: false,
                createdAt: new Date(),
                actionUrl: `/admin/submissions/${docRef.id}`
            });

            const response: ApiResponse<{ submissionId: string }> = {
                success: true,
                data: { submissionId: docRef.id },
                message: 'Submission created successfully'
            };

            res.status(201).json(response);

        } catch (error: any) {
            console.error('Create submission error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create submission'
            });
        }
    }
);

// Get user's submissions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.id;
        const { status } = req.query;

        let query: any = db.collection('submissions');

        // Students can only see their own submissions
        if (!req.isAdmin) {
            query = query.where('userId', '==', userId);
        }

        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.orderBy('submittedAt', 'desc').get();

        const submissions = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        const response: ApiResponse<{ submissions: any[] }> = {
            success: true,
            data: { submissions },
            message: 'Submissions retrieved successfully'
        };

        res.json(response);

    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get submissions'
        });
    }
});

// Get specific submission
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const doc = await db.collection('submissions').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        const submissionData = doc.data();

        // Students can only view their own submissions
        if (!req.isAdmin && submissionData?.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const response: ApiResponse<{ submission: any }> = {
            success: true,
            data: { submission: { id: doc.id, ...submissionData } },
            message: 'Submission retrieved successfully'
        };

        res.json(response);

    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get submission'
        });
    }
});

// Update submission status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback, pointsAwarded } = req.body;

        const submissionRef = db.collection('submissions').doc(id);
        const submissionDoc = await submissionRef.get();

        if (!submissionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        const submissionData = submissionDoc.data() as PostEventSubmission;

        const updateData: any = {
            status,
            reviewedAt: new Date(),
            reviewedBy: req.user!.id
        };

        if (feedback) {
            updateData.feedback = feedback;
        }

        // Award points if approved
        if (status === 'approved') {
            let totalPoints = 0;

            // Calculate points based on achievements
            if (submissionData.achievements && submissionData.achievements.length > 0) {
                for (const achievement of submissionData.achievements) {
                    totalPoints += achievement.points || 0;
                }
            }

            // Add bonus points for detailed submission
            if (submissionData.repoUrl) totalPoints += 50;
            if (submissionData.demoUrl) totalPoints += 50;
            if (submissionData.description && submissionData.description.length > 100) totalPoints += 25;

            // Use custom points if provided
            if (pointsAwarded && pointsAwarded > 0) {
                totalPoints = pointsAwarded;
            }

            updateData.pointsAwarded = totalPoints;

            // Award points to user
            if (totalPoints > 0) {
                await awardPoints(submissionData.userId, totalPoints, 'Post-event submission approved');
            }

            // Create notification for user
            await db.collection('notifications').add({
                userId: submissionData.userId,
                title: '✅ Submission Approved!',
                message: `Your post-event submission has been approved! You earned ${totalPoints} points.`,
                type: 'success',
                isRead: false,
                createdAt: new Date(),
                actionUrl: `/submissions/${id}`
            });
        } else if (status === 'rejected') {
            // Create notification for user
            await db.collection('notifications').add({
                userId: submissionData.userId,
                title: '❌ Submission Rejected',
                message: feedback || 'Your post-event submission was rejected. Please review the feedback.',
                type: 'error',
                isRead: false,
                createdAt: new Date(),
                actionUrl: `/submissions/${id}`
            });
        }

        await submissionRef.update(updateData);

        const response: ApiResponse = {
            success: true,
            message: 'Submission status updated successfully'
        };

        res.json(response);

    } catch (error) {
        console.error('Update submission status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update submission status'
        });
    }
});

// Delete submission
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const doc = await db.collection('submissions').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        const submissionData = doc.data();

        // Only owner or admin can delete
        if (!req.isAdmin && submissionData?.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Can only delete pending submissions
        if (submissionData?.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Can only delete pending submissions'
            });
        }

        await db.collection('submissions').doc(id).delete();

        const response: ApiResponse = {
            success: true,
            message: 'Submission deleted successfully'
        };

        res.json(response);

    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete submission'
        });
    }
});

export default router;
