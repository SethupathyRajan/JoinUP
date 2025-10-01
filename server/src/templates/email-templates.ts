export const emailTemplates = {
  'reset-code': {
    subject: 'Password Reset Verification Code - JoinUP',
    html: (context: { resetCode: string; userName: string; expiresIn: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">JoinUP</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${context.userName},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password for your JoinUP account. Use the verification code below to proceed with your password reset:
          </p>
          
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Verification Code:</h3>
            <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
              ${context.resetCode}
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This code will expire in <strong>${context.expiresIn}</strong>. If you didn't request this password reset, please ignore this email or contact our support team.
          </p>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; color: #888; font-size: 14px;">
            <p>Best regards,<br>The JoinUP Team</p>
            <p>Thiagarajar College of Engineering</p>
          </div>
        </div>
      </div>
    `,
    text: (context: { resetCode: string; userName: string; expiresIn: string }) => `
      Hello ${context.userName},

      We received a request to reset your password for your JoinUP account.

      Your verification code is: ${context.resetCode}

      This code will expire in ${context.expiresIn}. If you didn't request this password reset, please ignore this email.

      Best regards,
      The JoinUP Team
      Thiagarajar College of Engineering
    `
  },

  'password-reset-success': {
    subject: 'Password Reset Successful - JoinUP',
    html: (context: { userName: string; resetDate: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">JoinUP</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Successful</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${context.userName},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your password has been successfully reset on ${context.resetDate}. You can now log in to your JoinUP account with your new password.
          </p>
          
          <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #004085;">
              <strong>Security Tip:</strong> Make sure to use a strong, unique password and keep it secure. If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login to JoinUP
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; color: #888; font-size: 14px;">
            <p>Best regards,<br>The JoinUP Team</p>
            <p>Thiagarajar College of Engineering</p>
          </div>
        </div>
      </div>
    `,
    text: (context: { userName: string; resetDate: string }) => `
      Hello ${context.userName},

      Your password has been successfully reset on ${context.resetDate}. You can now log in to your JoinUP account with your new password.

      If you didn't make this change, please contact our support team immediately.

      Best regards,
      The JoinUP Team
      Thiagarajar College of Engineering
    `
  },

  'profile-updated': {
    subject: 'Profile Updated Successfully - JoinUP',
    html: (context: { userName: string; updateDate: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">JoinUP</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Profile Update Confirmation</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${context.userName},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your profile information has been successfully updated on ${context.updateDate}.
          </p>
          
          <div style="background: #f0f8ff; border-left: 4px solid #1890ff; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #004085;">
              <strong>Security Notice:</strong> If you didn't make these changes, please contact our support team immediately and consider changing your password.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/profile" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Your Profile
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; color: #888; font-size: 14px;">
            <p>Best regards,<br>The JoinUP Team</p>
            <p>Thiagarajar College of Engineering</p>
          </div>
        </div>
      </div>
    `,
    text: (context: { userName: string; updateDate: string }) => `
      Hello ${context.userName},

      Your profile information has been successfully updated on ${context.updateDate}.

      If you didn't make these changes, please contact our support team immediately.

      Best regards,
      The JoinUP Team
      Thiagarajar College of Engineering
    `
  },

  'welcome': {
    subject: 'Welcome to JoinUP!',
    html: (context: { userName: string; loginUrl: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to JoinUP!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your gateway to competitions and hackathons</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${context.userName},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Congratulations! Your JoinUP account has been successfully created. You're now part of the Thiagarajar College of Engineering's premier competition platform.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <h3 style="color: #333; margin-top: 0;">What you can do with JoinUP:</h3>
            <ul style="color: #666; padding-left: 20px;">
              <li>Discover exciting hackathons and competitions</li>
              <li>Register individually or form teams</li>
              <li>Track your progress with our gamification system</li>
              <li>Earn points, badges, and climb the leaderboard</li>
              <li>View your participation history</li>
              <li>Manage certificates and achievements</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Get Started - Login Now
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; color: #888; font-size: 14px;">
            <p>Best regards,<br>The JoinUP Team</p>
            <p>Thiagarajar College of Engineering</p>
          </div>
        </div>
      </div>
    `,
    text: (context: { userName: string; loginUrl: string }) => `
      Hello ${context.userName},

      Welcome to JoinUP! Your account has been successfully created.

      With JoinUP, you can:
      - Discover exciting hackathons and competitions
      - Register individually or form teams  
      - Track your progress with our gamification system
      - Earn points, badges, and climb the leaderboard
      - View your participation history
      - Manage certificates and achievements

      Get started by logging in: ${context.loginUrl}

      Best regards,
      The JoinUP Team
      Thiagarajar College of Engineering
    `
  }
};

export const getEmailTemplate = (templateName: string, context: any) => {
  const template = emailTemplates[templateName as keyof typeof emailTemplates];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  return {
    subject: template.subject,
    html: template.html(context),
    text: template.text(context)
  };
};
