import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Initialize email transporter only if SMTP credentials are provided
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    if (smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
          port: parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10),
          secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.logger.log('Email service initialized with SMTP configuration');
      } catch (error) {
        this.logger.warn('Failed to initialize email transporter:', error);
        // Create a dummy transporter to prevent errors
        this.transporter = null as any;
      }
    } else {
      // Email service is optional - only log at debug level to reduce noise
      this.logger.debug('Email service not configured - SMTP credentials missing. Welcome emails will not be sent.');
      // Create a dummy transporter to prevent errors
      this.transporter = null as any;
    }
  }

  /**
   * Send welcome email to newly registered user
   */
  async sendWelcomeEmail(email: string, fullName?: string): Promise<void> {
    // Check if email service is configured
    if (!this.transporter) {
      this.logger.warn(`⚠️  Email service not configured - cannot send welcome email to ${email}`);
      this.logger.warn(`   Please configure SMTP settings in .env file (see EMAIL_SETUP.md)`);
      return;
    }

    const appName = 'Real time location tracking system for pets';
    const userName = fullName || 'there';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🐾 Welcome to ${appName}!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hello ${userName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for joining <strong>${appName}</strong>! We're excited to help you keep track of your furry friends and ensure their safety.
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Your account has been successfully created. You can now:
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                <li>Track your pet's location in real-time</li>
                <li>Set up safe zones (geofences) for your pets</li>
                <li>Receive instant alerts for boundary escapes and low battery</li>
                <li>View location history and manage your devices</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8001'}/auth" 
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Get Started
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                If you have any questions or need assistance, feel free to reach out to our support team.
              </p>
              
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                Best regards,<br>
                <strong>The ${appName} Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
                Developed by <strong>Animesh Baral</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Welcome to ${appName}!

Hello ${userName},

Thank you for joining ${appName}! We're excited to help you keep track of your furry friends and ensure their safety.

Your account has been successfully created. You can now:
- Track your pet's location in real-time
- Set up safe zones (geofences) for your pets
- Receive instant alerts for boundary escapes and low battery
- View location history and manage your devices

Get started: ${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8001'}/auth

If you have any questions or need assistance, feel free to reach out to our support team.

Best regards,
The ${appName} Team

© ${new Date().getFullYear()} ${appName}. All rights reserved.
Developed by Animesh Baral
    `;

    try {
      const mailOptions = {
        from: `"${appName}" <${this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER')}>`,
        to: email,
        subject: `Welcome to ${appName}! 🐾`,
        text: textContent,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send welcome email to ${email}:`, error.message || error);
      this.logger.error(`   Error details:`, error);
      // Don't throw error - registration should succeed even if email fails
      // In production, you might want to queue this for retry
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      // Email service not configured - return false silently
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

