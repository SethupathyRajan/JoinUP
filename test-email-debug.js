
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './server/src/services/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function test() {
    console.log('🚀 Starting email test...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);

    try {
        await sendEmail({
            to: process.env.SMTP_USER, // Send to self
            template: 'reset-code',
            context: {
                resetCode: '123456',
                userName: 'Test User',
                expiresIn: '15 minutes'
            }
        });
        console.log('✅ Test email sent successfully!');
    } catch (error) {
        console.error('❌ Test email failed:', error);
    }
}

test();
