import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Upload file to Google Drive
export const uploadToGoogleDrive = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<string> => {
  try {
    // Create folder structure if it doesn't exist
    const targetFolderId = await ensureFolderStructure(fileName, folderId);
    
    const fileStream = new Readable();
    fileStream.push(fileBuffer);
    fileStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: fileName.split('/').pop(), // Get just the filename, not the full path
        parents: [targetFolderId],
      },
      media: {
        mimeType,
        body: fileStream,
      },
    });

    // Make file accessible (optional - for direct access)
    if (response.data.id) {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    return response.data.id!;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
};

// Create folder structure in Google Drive
const ensureFolderStructure = async (filePath: string, baseFolderId?: string): Promise<string> => {
  const pathParts = filePath.split('/');
  pathParts.pop(); // Remove filename, keep only folder path
  
  let currentFolderId = baseFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID!;
  
  for (const folderName of pathParts) {
    if (!folderName) continue;
    
    // Check if folder exists
    const existingFolder = await findFolder(folderName, currentFolderId);
    
    if (existingFolder) {
      currentFolderId = existingFolder;
    } else {
      // Create new folder
      const response = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId],
        },
      });
      currentFolderId = response.data.id!;
    }
  }
  
  return currentFolderId;
};

// Find folder by name in parent
const findFolder = async (folderName: string, parentId: string): Promise<string | null> => {
  try {
    const response = await drive.files.list({
      q: `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    return response.data.files && response.data.files.length > 0 
      ? response.data.files[0].id! 
      : null;
  } catch (error) {
    console.error('Error finding folder:', error);
    return null;
  }
};

// Get file download link
export const getFileDownloadLink = async (fileId: string): Promise<string> => {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'webContentLink, webViewLink',
    });

    return response.data.webViewLink || response.data.webContentLink || '';
  } catch (error) {
    console.error('Error getting download link:', error);
    throw new Error('Failed to get file download link');
  }
};

// Delete file from Google Drive
export const deleteFromGoogleDrive = async (fileId: string): Promise<void> => {
  try {
    await drive.files.delete({
      fileId,
    });
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw new Error('Failed to delete file from Google Drive');
  }
};

// List files in folder
export const listFilesInFolder = async (folderId: string): Promise<any[]> => {
  try {
    const response = await drive.files.list({
      q: `parents in '${folderId}'`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
      orderBy: 'createdTime desc',
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
};

// Get folder ID for user certificates
export const getUserCertificatesFolderId = async (userId: string, hackathonId: string): Promise<string> => {
  const folderPath = `certificates/${userId}/${hackathonId}`;
  return await ensureFolderStructure(folderPath + '/dummy.txt');
};

// Get folder ID for user profile pictures
export const getUserProfilePicturesFolderId = async (userId: string): Promise<string> => {
  const folderPath = `profile-pictures/${userId}`;
  return await ensureFolderStructure(folderPath + '/dummy.txt');
};
