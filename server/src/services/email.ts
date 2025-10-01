import nodemailer from 'nodemailer';
import { EmailTemplate, EmailContext } from '../models/types.js';
import { getEmailTemplate } from '../templates/email-templates.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
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

// Legacy email templates (keeping for compatibility)
const templates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to JoinUP! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2E86AB 0%, #F18F01 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to JoinUP!</h1>
        </div>
        
        <div style="padding: 40px 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi {{userName}}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Welcome to JoinUP, the ultimate platform for students to discover, participate in, and excel at hackathons and competitions!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2E86AB; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Complete your profile setup</li>
              <li>Explore upcoming competitions</li>
              <li>Join or create teams</li>
              <li>Start earning badges and climbing the leaderboard!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background: #2E86AB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Login to Your Account
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center;">
            Happy competing! 🚀<br>
            The JoinUP Team
          </p>
        </div>
      </div>
    `
  },

  'password-changed': {
    subject: 'JoinUP Password Changed Successfully ✅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2E86AB; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Changed</h1>
        </div>
        
        <div style="padding: 40px 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi {{userName}}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your JoinUP account password has been successfully changed on {{changeTime}}.
          </p>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
            <p style="color: #155724; margin: 0; font-weight: bold;">✅ Password change confirmed</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0;">
            If you didn't make this change, please contact our support team immediately.
          </p>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Stay secure! 🔒<br>
            The JoinUP Team
          </p>
        </div>
      </div>
    `
  },

  'reset-password': {
    subject: 'Reset Your JoinUP Password 🔑',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F18F01; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        
        <div style="padding: 40px 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi {{userName}}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your JoinUP account password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background: #F18F01; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⏰ This link will expire in {{expiryTime}}. If you didn't request this reset, you can safely ignore this email.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #2E86AB;">{{resetLink}}</span>
          </p>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Stay secure! 🔒<br>
            The JoinUP Team
          </p>
        </div>
      </div>
    `
  },

  'password-reset-success': {
    subject: 'JoinUP Password Reset Successful ✅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Complete</h1>
        </div>
        
        <div style="padding: 40px 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi {{userName}}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your JoinUP account password has been successfully reset on {{resetTime}}.
          </p>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
            <p style="color: #155724; margin: 0; font-weight: bold;">✅ You can now log in with your new password</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Login Now
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If you didn't make this change, please contact our support team immediately.
          </p>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Welcome back! 🎉<br>
            The JoinUP Team
          </p>
        </div>
      </div>
    `
  },

  'registration-approved': {
    subject: '🎉 Your Registration has been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Registration Approved! 🎉</h1>
        </div>
        
        <div style="padding: 40px 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Congratulations {{userName}}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your registration for <strong>{{hackathonTitle}}</strong> has been approved.
          </p>
          
          {{#teamName}}
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">Team Details</h3>
            <p style="color: #666; margin: 0;"><strong>Team Name:</strong> {{teamName}}</p>
          </div>
          {{/teamName}}
          
          {{#feedback}}
          <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
            <p style="color: #155724; margin: 0;"><strong>Feedback:</strong> {{feedback}}</p>
          </div>
          {{/feedback}}
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0;">
            Get ready to showcase your skills and compete for amazing prizes!
          </p>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Best of luck! 🚀<br>
            The JoinUP Team
          </p>
        </div>
      </div>
    `
  }
};

// Replace template variables
const renderTemplate = (template: EmailTemplate, context: EmailContext): EmailTemplate => {
  let html = template.html;
  let subject = template.subject;

  // Simple template replacement
  Object.keys(context).forEach(key => {
    const value = context[key];
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }
  });

  // Handle conditional blocks (basic implementation)
  html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    return context[key] ? content : '';
  });

  return { ...template, html, subject };
};

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

    let emailContent: EmailTemplate;

    if (options.template && templates[options.template]) {
      // Use template
      const template = templates[options.template];
      emailContent = renderTemplate(template, options.context || {});
    } else {
      // Use direct content
      emailContent = {
        subject: options.subject || 'JoinUP Notification',
        html: options.html || '',
        text: options.text
      };
    }

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
      const emailContent = renderTemplate(templates[template], context);
      
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
