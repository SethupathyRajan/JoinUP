
import dotenv from 'dotenv';
import { uploadToGoogleDrive } from './services/googleDrive.js';

dotenv.config();

async function debugDrive() {
    console.log('🚀 Starting Google Drive debug test...');

    try {
        const testContent = Buffer.from('Hello Google Drive! This is a test file.');
        const fileName = `debug-tests/test-${Date.now()}.txt`;

        console.log(`📤 Uploading file: ${fileName}`);
        const fileId = await uploadToGoogleDrive(
            testContent,
            fileName,
            'text/plain'
        );

        console.log(`✅ File uploaded successfully! File ID: ${fileId}`);
    } catch (error) {
        console.error('❌ Google Drive debug failed:', error);
    }
}

debugDrive();
