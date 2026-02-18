
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

async function checkFolder() {
    const folderId = '1QJLcd3jm_Ge-y2EKk5vXRl_rW-YX4aB0';
    console.log(`🔍 Inspecting folder ID: ${folderId}`);

    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, '\n').trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }
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

    const drive = google.drive({ version: 'v3', auth });

    try {
        const response = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, capabilities, owners, permissions',
        });

        console.log('✅ Folder found!');
        console.log('- NAME:', response.data.name);
        console.log('- CAPABILITIES:', JSON.stringify(response.data.capabilities, null, 2));

    } catch (error) {
        console.error('❌ Error accessing folder:', error.message);
        if (error.message.includes('404')) {
            console.log('👉 This means the service account cannot see the folder at all.');
            console.log('👉 Double check that you shared with:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
        }
    }
}

checkFolder();
