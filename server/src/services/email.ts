import nodemailer from 'nodemailer';
import { EmailTemplate, EmailContext } from '../models/types';
import { getEmailTemplate } from '../templates/email-templates.js';



// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email function

// Main email sending function
export const sendEmail = async (options: {
  to: string;
  subject?: string;
  template?: string;
  context?: EmailContext;
  html?: string;
  text?: string;

}): Promise<void> => {
  try {
    const transporter = createTransporter();

    let emailContent: {
      subject: string;
      html: string;
      text?: string;
    };

    if (options.template) {
      // Use template from email-templates.ts
      console.log(`🔍 Generating email from template: ${options.template}`);
      emailContent = getEmailTemplate(
        options.template,
        options.context || {}
      );
    } else {
      // Use direct content
      emailContent = {
        subject: options.subject || 'JoinUP Notification',
        html: options.html || '',
        text: options.text || ''
      };
    }

    console.log('📝 Email content generated:', {
      to: options.to,
      subject: emailContent.subject,
      htmlLength: emailContent.html?.length || 0,
      textLength: emailContent.text?.length || 0,
      htmlPreview: emailContent.html?.substring(0, 100) + '...',
      textPreview: emailContent.text?.substring(0, 100) + '...'
    });

    const mailOptions = {
      from: {
        name: 'JoinUP Platform',
        address: process.env.SMTP_USER!
      },
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Send bulk emails (for notifications)
export const sendBulkEmails = async (recipients: Array<{
  to: string;
  context?: EmailContext;
}>, template: string, baseContext?: EmailContext): Promise<void> => {
  try {
    const transporter = createTransporter();

    const emailPromises = recipients.map(async (recipient) => {
      const context = { ...baseContext, ...recipient.context };
      const emailContent = getEmailTemplate(template, context);

      return transporter.sendMail({
        from: {
          name: 'JoinUP Platform',
          address: process.env.SMTP_USER!
        },
        to: recipient.to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
    });

    await Promise.all(emailPromises);
    console.log(`Bulk emails sent successfully to ${recipients.length} recipients`);

  } catch (error) {
    console.error('Bulk email send error:', error);
    throw error;
  }
};

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};
