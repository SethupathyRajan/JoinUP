
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Use: npx tsx src/setup-drive-cred.ts <path-to-json-file>

const jsonPath = process.argv[2];
const envPath = path.resolve(process.cwd(), '.env');

if (!jsonPath) {
    console.error('❌ Error: Please provide the path to your Google Service Account JSON file.');
    console.error('Usage: npx tsx src/setup-drive-cred.ts service-account.json');
    process.exit(1);
}

try {
    const credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const privateKey = credentials.private_key;
    const clientEmail = credentials.client_email;

    if (!privateKey || !clientEmail) {
        throw new Error('Invalid JSON: Missing private_key or client_email');
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    const newLines = lines.map(line => {
        if (line.startsWith('GOOGLE_DRIVE_PRIVATE_KEY=')) {
            // Escape newlines for .env if not using quotes, but we'll use double quotes and literal \n
            const escapedKey = privateKey.replace(/\n/g, '\\n');
            return `GOOGLE_DRIVE_PRIVATE_KEY="${escapedKey}"`;
        }
        if (line.startsWith('GOOGLE_DRIVE_CLIENT_EMAIL=')) {
            return `GOOGLE_DRIVE_CLIENT_EMAIL=${clientEmail}`;
        }
        return line;
    });

    // Ensure fields exist if they weren't in the file
    if (!newLines.some(l => l.startsWith('GOOGLE_DRIVE_PRIVATE_KEY='))) {
        newLines.push(`GOOGLE_DRIVE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
    }
    if (!newLines.some(l => l.startsWith('GOOGLE_DRIVE_CLIENT_EMAIL='))) {
        newLines.push(`GOOGLE_DRIVE_CLIENT_EMAIL=${clientEmail}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n').trim() + '\n');

    console.log('✅ Success! .env file updated with Google Drive credentials.');
    console.log('📧 Client Email:', clientEmail);
    console.log('🚀 You can now run the verification script: npx tsx src/verify-fixes.ts');

} catch (error) {
    console.error('❌ Error updating credentials:', error.message);
    process.exit(1);
}
