import crypto from 'crypto';

// Generate a secure random token for password reset
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify reset token format
export const verifyResetToken = (token: string): boolean => {
  // Check if token is 64 characters long and contains only hex characters
  const hexRegex = /^[a-fA-F0-9]{64}$/;
  return hexRegex.test(token);
};

// Generate a random string of specified length
export const generateRandomString = (length: number): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Hash a string using SHA-256
export const hashString = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

// Generate a secure random UUID
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Create HMAC signature
export const createHMAC = (data: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Verify HMAC signature
export const verifyHMAC = (data: string, signature: string, secret: string): boolean => {
  const expectedSignature = createHMAC(data, secret);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
};

// Generate filename for Google Drive (to map certificate->user->event)
export const generateCertificateFileName = (
  userId: string, 
  hackathonId: string, 
  originalFileName: string
): string => {
  const timestamp = Date.now();
  const fileExtension = originalFileName.split('.').pop();
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `certificates/${userId}/${hackathonId}/${timestamp}_${sanitizedFileName}`;
};

// Parse certificate filename to extract metadata
export const parseCertificateFileName = (fileName: string): {
  userId?: string;
  hackathonId?: string;
  timestamp?: number;
  originalName?: string;
} => {
  try {
    // Expected format: certificates/userId/hackathonId/timestamp_originalname.ext
    const parts = fileName.split('/');
    
    if (parts.length >= 4 && parts[0] === 'certificates') {
      const userId = parts[1];
      const hackathonId = parts[2];
      const fileNamePart = parts[3];
      
      const underscoreIndex = fileNamePart.indexOf('_');
      if (underscoreIndex > 0) {
        const timestamp = parseInt(fileNamePart.substring(0, underscoreIndex));
        const originalName = fileNamePart.substring(underscoreIndex + 1);
        
        return {
          userId,
          hackathonId,
          timestamp,
          originalName
        };
      }
    }
    
    return {};
  } catch (error) {
    console.error('Error parsing certificate filename:', error);
    return {};
  }
};
