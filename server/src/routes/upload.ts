import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { ApiResponse } from '../models/types.js';
import { generateCertificateFileName } from '../utils/crypto.js';
import { uploadToGoogleDrive, getUserCertificatesFolderId, getUserProfilePicturesFolderId, getFileDownloadLink } from '../services/googleDrive.js';

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

// Upload certificate files
router.post('/certificates', 
  authenticateToken, 
  upload.array('certificates', 5), 
  async (req, res) => {
    try {
      const { hackathonId } = req.body;
      const files = req.files as Express.Multer.File[];
      const userId = req.user!.id;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }
      
      if (!hackathonId) {
        return res.status(400).json({
          success: false,
          error: 'Hackathon ID is required'
        });
      }
      
      // Upload files to Google Drive
      const uploadedFiles = [];
      
      for (const file of files) {
        const fileName = generateCertificateFileName(userId, hackathonId, file.originalname);
        
        try {
          // Upload to Google Drive
          const googleDriveFileId = await uploadToGoogleDrive(
            file.buffer,
            fileName,
            file.mimetype
          );
          
          uploadedFiles.push({
            fileName,
            originalName: file.originalname,
            googleDriveFileId,
            uploadedAt: new Date(),
            fileSize: file.size,
            mimeType: file.mimetype
          });
          
        } catch (error) {
          console.error(`Failed to upload file ${file.originalname}:`, error);
          throw new Error(`Failed to upload file: ${file.originalname}`);
        }
      }
      
      const response: ApiResponse<{ uploadedFiles: any[] }> = {
        success: true,
        data: { uploadedFiles },
        message: 'Files uploaded successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files'
      });
    }
  }
);

// Upload profile picture
router.post('/profile-picture', 
  authenticateToken, 
  upload.single('profilePicture'), 
  async (req, res) => {
    try {
      const file = req.file;
      const userId = req.user!.id;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }
      
      // Check if file is an image
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: 'File must be an image'
        });
      }
      
      // Upload to Google Drive
      const fileName = `profile-pictures/${userId}/${Date.now()}_${file.originalname}`;
      
      try {
        const googleDriveFileId = await uploadToGoogleDrive(
          file.buffer,
          fileName,
          file.mimetype
        );
        
        // Get shareable link
        const profilePictureUrl = await getFileDownloadLink(googleDriveFileId);
        
        // TODO: Update user profile with new profile picture URL in database
        // await db.collection('users').doc(userId).update({
        //   profilePicture: profilePictureUrl
        // });
      
        const response: ApiResponse<{ 
          profilePictureUrl: string;
          fileName: string;
          googleDriveFileId: string;
        }> = {
          success: true,
          data: {
            profilePictureUrl,
            fileName,
            googleDriveFileId
          },
          message: 'Profile picture uploaded successfully'
        };
        
        res.json(response);
        
      } catch (error) {
        console.error('Profile picture upload error:', error);
        throw new Error('Failed to upload profile picture to Google Drive');
      }
      
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload profile picture'
      });
    }
  }
);

// TODO: Implement Google Drive service
// This would include:
// - Setting up Google Drive API credentials
// - Creating folders for different file types
// - Uploading files to specific folders
// - Managing file permissions
// - Getting shareable links

export default router;
