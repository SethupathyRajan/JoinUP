import { google } from 'googleapis';
import { Readable } from 'stream';

console.log('📦 googleDrive service module loaded');

// Initialize Google Drive API lazily to ensure environment variables are loaded
let driveInstance: any = null;

const getDrive = () => {
  if (driveInstance) return driveInstance;

  // Robust private key parsing to handle different environment variable formats
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (privateKey) {
    // Replace literal \n with real newlines and remove any external quotes
    privateKey = privateKey.replace(/\\n/g, '\n').trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    // Final check for \n that might have been missed or added by mistake
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      private_key: privateKey,
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveInstance = google.drive({ version: 'v3', auth });
  return driveInstance;
};

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

    const response = await getDrive().files.create({
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
      await getDrive().permissions.create({
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

  let currentFolderId = baseFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Verify if baseFolderId actually exists/is accessible
  if (currentFolderId) {
    try {
      console.log(`📡 Verifying base folder ID: "${currentFolderId}"`);
      await getDrive().files.get({ fileId: currentFolderId });
      console.log('✅ Base folder is accessible.');
    } catch (err: any) {
      console.warn(`⚠️ Base folder ID verification failed: ${err.message}`);
      console.log(`🔎 Checking with "root" instead.`);
      currentFolderId = undefined; // Fallback to root
    }
  }

  // If no base folder ID or it failed verification, we'll start from root ('root' is a special alias in Drive API)
  let parentIdForSearch: string = currentFolderId || 'root';

  for (const folderName of pathParts) {
    if (!folderName) continue;

    // Check if folder exists
    const existingFolder = await findFolder(folderName, parentIdForSearch);

    if (existingFolder) {
      parentIdForSearch = existingFolder;
    } else {
      // Create new folder
      try {
        const response = await getDrive().files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentIdForSearch],
          },
        });
        parentIdForSearch = response.data.id!;
      } catch (err: any) {
        console.error(`Failed to create folder ${folderName}:`, err.message);
        throw new Error(`Cloud storage structure error: ${err.message}`);
      }
    }
  }

  return parentIdForSearch;
};

// Find folder by name in parent
const findFolder = async (folderName: string, parentId: string): Promise<string | null> => {
  try {
    const listResponse = await getDrive().files.list({
      q: `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    return listResponse.data.files && listResponse.data.files.length > 0
      ? listResponse.data.files[0].id!
      : null;
  } catch (error) {
    console.error('Error finding folder:', error);
    return null;
  }
};

// Get file download link
export const getFileDownloadLink = async (fileId: string): Promise<string> => {
  try {
    const response = await getDrive().files.get({
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
    await getDrive().files.delete({
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
    const response = await getDrive().files.list({
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
