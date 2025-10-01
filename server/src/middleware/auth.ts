import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../server.js';
import { User } from '../models/types.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAdmin?: boolean;
    }
  }
}

// Email validation regex patterns
const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.tce\.edu$/;
const ADMIN_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@tce\.edu$/;

// Check if email is valid student email
export const isValidStudentEmail = (email: string): boolean => {
  return STUDENT_EMAIL_REGEX.test(email);
};

// Check if email is valid admin/faculty email
export const isValidAdminEmail = (email: string): boolean => {
  return ADMIN_EMAIL_REGEX.test(email) && !STUDENT_EMAIL_REGEX.test(email);
};

// Check if email is in admin list
export const isAdminEmail = (email: string): boolean => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  console.log('Checking admin email:', email, 'against list:', adminEmails);
  return adminEmails.includes(email);
};

// Middleware to verify Firebase token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user data from Firestore
    const { db } = await import('../server.js');
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    // Check if this is an admin user
    const isAdmin = isAdminEmail(decodedToken.email!);
    
    if (!userDoc.exists) {
      // If user doesn't exist in Firestore, check if they're an admin
      if (isAdmin) {
        // Create a temporary user object for admin
        const adminUser: User = {
          id: decodedToken.uid,
          email: decodedToken.email!,
          name: decodedToken.name || 'Admin User',
          department: 'Administration',
          year: 0,
          rollNumber: '',
          registerNumber: '',
          phoneNumber: '',
          profilePicture: '',
          isAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        req.user = adminUser;
        req.isAdmin = true;
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      const userData = userDoc.data() as User;
      
      // Check if email matches token email
      if (userData.email !== decodedToken.email) {
        return res.status(403).json({ error: 'Token email mismatch' });
      }

      req.user = userData;
      req.isAdmin = isAdmin;
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to require admin privileges
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// Middleware to allow only students
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAdmin) {
    return res.status(403).json({ error: 'This endpoint is for students only' });
  }
  next();
};

// Middleware to validate user can access resource (own data or admin)
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceUserId = req.params[userIdParam];
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.id !== resourceUserId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

// Rate limiting for sensitive operations
export const sensitiveOperationLimiter = async (req: Request, res: Response, next: NextFunction) => {
  // This would integrate with a Redis-based rate limiter in production
  // For now, we'll use a simple in-memory approach
  
  const key = `${req.ip}-${req.path}`;
  const limit = 5; // 5 attempts
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // In production, use Redis for distributed rate limiting
  // For demo purposes, we'll just log the rate limiting attempt
  console.log(`Rate limiting check for ${key}`);
  
  next();
};
