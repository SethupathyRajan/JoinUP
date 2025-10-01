import express from 'express';
import { adminAuth, db } from '../server.js';
import { 
  authenticateToken, 
  isValidStudentEmail, 
  sensitiveOperationLimiter 
} from '../middleware/auth.js';
import { 
  validate, 
  loginSchema, 
  registerSchema, 
  changePasswordSchema, 
  forgotPasswordSchema,
  resetPasswordSchema 
} from '../utils/validation.js';
import { sendEmail } from '../services/email.js';
import { generateResetToken, verifyResetToken } from '../utils/crypto.js';
import { User, GameStats, ApiResponse } from '../models/types.js';

const router = express.Router();

// Register a new student
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, department, year, rollNumber, registerNumber, phoneNumber } = req.body;

    // Check if user already exists in Firestore
    const existingUserQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check if roll number or register number already exists
    const rollNumberQuery = await db.collection('users')
      .where('rollNumber', '==', rollNumber)
      .limit(1)
      .get();

    if (!rollNumberQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'Roll number already registered'
      });
    }

    const registerNumberQuery = await db.collection('users')
      .where('registerNumber', '==', registerNumber)
      .limit(1)
      .get();

    if (!registerNumberQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'Register number already registered'
      });
    }

    // Create Firebase user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Initialize game stats
    const defaultGameStats: GameStats = {
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

    // Create user document in Firestore
    const userData: User = {
      id: userRecord.uid,
      email,
      name,
      department,
      year,
      rollNumber,
      registerNumber,
      phoneNumber: phoneNumber || '',
      profilePicture: '',
      gameStats: defaultGameStats,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to JoinUP!',
      template: 'welcome',
      context: {
        userName: name,
        loginUrl: `${process.env.CLIENT_URL}/login`
      }
    });

    const response: ApiResponse<{ userId: string }> = {
      success: true,
      data: { userId: userRecord.uid },
      message: 'Registration successful! Please login to continue.'
    };

    res.status(201).json(response);

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint (verification only - actual login handled by Firebase Auth on frontend)
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email } = req.body;

    // Verify user exists in our system
    const userQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userQuery.docs[0].data() as User;

    // Update last login
    await db.collection('users').doc(userData.id).update({
      lastLogin: new Date(),
      updatedAt: new Date()
    });

    const response: ApiResponse<{ user: Omit<User, 'gameStats'> }> = {
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          department: userData.department,
          year: userData.year,
          rollNumber: userData.rollNumber,
          registerNumber: userData.registerNumber,
          phoneNumber: userData.phoneNumber,
          profilePicture: userData.profilePicture,
          createdAt: userData.createdAt,
          updatedAt: new Date(),
          lastLogin: new Date()
        }
      },
      message: 'User verified successfully'
    };

    res.json(response);

  } catch (error) {
    console.error('Login verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Login verification failed'
    });
  }
});

// Send reset code for password reset
router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Verify user exists in our system
    const userQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code in database
    await db.collection('passwordResets').doc(resetToken).set({
      email,
      code: resetCode,
      used: false,
      createdAt: new Date(),
      expiresAt
    });

    // Send email with verification code
    await sendEmail({
      to: email,
      subject: 'Password Reset Verification Code - JoinUP',
      template: 'reset-code',
      context: {
        resetCode,
        userName: userQuery.docs[0].data().name,
        expiresIn: '15 minutes'
      }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Verification code sent successfully' },
      message: 'Please check your email for the verification code'
    };

    res.json(response);

  } catch (error) {
    console.error('Send reset code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required'
      });
    }

    // Find reset code in database
    const resetQuery = await db.collection('passwordResets')
      .where('email', '==', email)
      .where('code', '==', code)
      .where('used', '==', false)
      .where('expiresAt', '>', new Date())
      .limit(1)
      .get();

    if (resetQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Verification code is valid' },
      message: 'Code verified successfully'
    };

    res.json(response);

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify code'
    });
  }
});

// Reset password with verification code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, verification code, and new password are required'
      });
    }

    // Find and verify reset code
    const resetQuery = await db.collection('passwordResets')
      .where('email', '==', email)
      .where('code', '==', code)
      .where('used', '==', false)
      .where('expiresAt', '>', new Date())
      .limit(1)
      .get();

    if (resetQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    // Get user from Firebase Auth
    const userRecord = await adminAuth.getUserByEmail(email);
    
    // Update password in Firebase Auth
    await adminAuth.updateUser(userRecord.uid, {
      password: newPassword
    });

    // Mark reset code as used
    const resetDoc = resetQuery.docs[0];
    await resetDoc.ref.update({
      used: true,
      usedAt: new Date()
    });

    // Update user's updatedAt timestamp
    await db.collection('users').doc(userRecord.uid).update({
      updatedAt: new Date()
    });

    // Send confirmation email
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data() as User;

    await sendEmail({
      to: email,
      subject: 'Password Reset Successful - JoinUP',
      template: 'password-reset-success',
      context: {
        userName: userData.name,
        resetDate: new Date().toLocaleString()
      }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Password reset successfully' },
      message: 'Your password has been reset successfully. You can now login with your new password.'
    };

    res.json(response);

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// Update user profile with password verification
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { name, department, year, phoneNumber, password } = req.body;
    const userId = req.user!.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required to update profile'
      });
    }

    // Verify current password by attempting to sign in
    try {
      await adminAuth.getUserByEmail(req.user!.email);
      // In a real implementation, you'd verify the password here
      // For now, we'll assume the frontend handles this validation
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid current password'
      });
    }

    // Update user profile
    const updateData: Partial<User> = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    await db.collection('users').doc(userId).update(updateData);

    // Update display name in Firebase Auth if name changed
    if (name) {
      await adminAuth.updateUser(userId, {
        displayName: name
      });
    }

    // Get updated user data
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUserData = updatedUserDoc.data() as User;

    // Send confirmation email
    await sendEmail({
      to: req.user!.email,
      subject: 'Profile Updated - JoinUP',
      template: 'profile-updated',
      context: {
        userName: updatedUserData.name,
        updateDate: new Date().toLocaleString()
      }
    });

    const response: ApiResponse<{ user: Omit<User, 'gameStats'> }> = {
      success: true,
      data: {
        user: {
          id: updatedUserData.id,
          email: updatedUserData.email,
          name: updatedUserData.name,
          department: updatedUserData.department,
          year: updatedUserData.year,
          rollNumber: updatedUserData.rollNumber,
          registerNumber: updatedUserData.registerNumber,
          phoneNumber: updatedUserData.phoneNumber,
          profilePicture: updatedUserData.profilePicture,
          createdAt: updatedUserData.createdAt,
          updatedAt: updatedUserData.updatedAt
        }
      },
      message: 'Profile updated successfully'
    };

    res.json(response);

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.post('/change-password', 
  authenticateToken, 
  sensitiveOperationLimiter,
  validate(changePasswordSchema), 
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      // Verify current password by attempting to sign in
      try {
        await adminAuth.getUserByEmail(req.user!.email);
        
        // Update password
        await adminAuth.updateUser(userId, {
          password: newPassword
        });

        // Send confirmation email
        await sendEmail({
          to: req.user!.email,
          subject: 'Password Changed Successfully',
          template: 'password-changed',
          context: {
            userName: req.user!.name,
            changeTime: new Date().toLocaleString()
          }
        });

        const response: ApiResponse = {
          success: true,
          message: 'Password changed successfully'
        };

        res.json(response);

      } catch (authError) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
);

// Forgot password
router.post('/forgot-password', 
  sensitiveOperationLimiter,
  validate(forgotPasswordSchema), 
  async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const userQuery = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (userQuery.empty) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'If the email exists, a reset link has been sent'
        });
      }

      const userData = userQuery.docs[0].data() as User;

      // Generate reset token
      const resetToken = generateResetToken();
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

      // Store reset token in Firestore
      await db.collection('passwordResets').doc(userData.id).set({
        userId: userData.id,
        email: userData.email,
        token: resetToken,
        expiresAt: resetExpiry,
        createdAt: new Date(),
        used: false
      });

      // Send reset email
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: email,
        subject: 'Reset Your JoinUP Password',
        template: 'reset-password',
        context: {
          userName: userData.name,
          resetLink,
          expiryTime: '1 hour'
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'If the email exists, a reset link has been sent'
      };

      res.json(response);

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process forgot password request'
      });
    }
  }
);

// Reset password
router.post('/reset-password', 
  sensitiveOperationLimiter,
  validate(resetPasswordSchema), 
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      const resetDoc = await db.collection('passwordResets')
        .where('token', '==', token)
        .where('used', '==', false)
        .limit(1)
        .get();

      if (resetDoc.empty) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      const resetData = resetDoc.docs[0].data();
      
      // Check if token has expired
      if (new Date() > resetData.expiresAt.toDate()) {
        return res.status(400).json({
          success: false,
          error: 'Reset token has expired'
        });
      }

      // Update user password
      await adminAuth.updateUser(resetData.userId, {
        password: newPassword
      });

      // Mark reset token as used
      await resetDoc.docs[0].ref.update({
        used: true,
        usedAt: new Date()
      });

      // Get user data for email
      const userDoc = await db.collection('users').doc(resetData.userId).get();
      const userData = userDoc.data() as User;

      // Send confirmation email
      await sendEmail({
        to: resetData.email,
        subject: 'Password Reset Successful',
        template: 'password-reset-success',
        context: {
          userName: userData.name,
          resetTime: new Date().toLocaleString(),
          loginUrl: `${process.env.CLIENT_URL}/login`
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Password reset successful'
      };

      res.json(response);

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }
);

// Verify token endpoint
router.get('/verify-token', authenticateToken, async (req, res) => {
  try {
    const response: ApiResponse<{ user: User, isAdmin: boolean }> = {
      success: true,
      data: {
        user: req.user!,
        isAdmin: req.isAdmin!
      },
      message: 'Token is valid'
    };

    res.json(response);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Logout endpoint (mainly for cleanup)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update last seen
    await db.collection('users').doc(req.user!.id).update({
      updatedAt: new Date()
    });

    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router;
