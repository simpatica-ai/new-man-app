import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const emailSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address'),
  organizationSlug: z.string().min(1, 'Organization slug is required'),
  userExists: z.boolean()
});

export async function POST(request: NextRequest) {
  try {
    console.log('Org admin invitation email API called');
    
    const body = await request.json();
    
    // Server-side validation
    const validation = emailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { organizationName, contactName, contactEmail, organizationSlug, userExists } = validation.data;
    console.log('Request data:', { organizationName, contactName, contactEmail, userExists });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    
    console.log('Gmail user:', gmailUser);
    console.log('Gmail password exists:', !!gmailPassword);

    if (!gmailUser || !gmailPassword) {
      console.error('Missing Gmail credentials');
      return NextResponse.json(
        { error: 'Gmail credentials not configured' },
        { status: 500 }
      );
    }

    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://new-man-app.simpatica.ai';

    console.log('Sending email...');
    const mailOptions = {
      from: `"A New Man App" <new-man-app@simpatica.ai>`,
      to: contactEmail,
      subject: `🎉 ${organizationName} - Organization Approved!`,
      html: userExists ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">🎉 Organization Approved!</h2>
          <p>Dear ${contactName},</p>
          <p>Congratulations! Your organization request for <strong>${organizationName}</strong> has been approved and your organizational account is now ready.</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #166534; margin-top: 0;">✅ You're All Set!</h3>
            <p style="color: #166534; margin-bottom: 0;">Since you already have an account with us, you've been automatically assigned as the Organization Administrator. Simply log in to access your new organizational features.</p>
          </div>

          <h3 style="color: #44403c;">🚀 Getting Started as Organization Administrator</h3>
          
          <p><strong>We recommend you first experience the app as a practitioner would:</strong></p>
          <ul style="color: #57534e;">
            <li>Complete the virtue assessment to understand the user journey</li>
            <li>Try creating journal entries and exploring virtue workspaces</li>
            <li>Familiarize yourself with the practitioner experience</li>
          </ul>

          <p><strong>Then access your Organization Admin features:</strong></p>
          <ul style="color: #57534e;">
            <li>Look for the <strong>"Admin"</strong> button in the app header</li>
            <li>Invite team members to join your organization</li>
            <li>Customize your organization's branding and settings</li>
            <li>Monitor member progress and engagement</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}" 
               style="background-color: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Access Your Organization
            </a>
          </div>

          <p>Welcome to the New Man App organizational community!</p>
          <p>Best regards,<br>The A New Man Team</p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">🎉 Organization Approved!</h2>
          <p>Dear ${contactName},</p>
          <p>Congratulations! Your organization request for <strong>${organizationName}</strong> has been approved and your organizational account is now ready.</p>
          
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">📝 Next Step: Create Your Account</h3>
            <p style="color: #92400e; margin-bottom: 10px;">To get started, please create your account using this email address (${contactEmail}):</p>
            <div style="text-align: center; margin: 15px 0;">
              <a href="${baseUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Create Account & Sign In</a>
            </div>
            <p style="color: #92400e; font-size: 14px; margin-bottom: 0;">You can sign up using either email/password or Google authentication.</p>
          </div>

          <h3 style="color: #44403c;">🚀 Getting Started as Organization Administrator</h3>
          
          <p><strong>We recommend you first experience the app as a practitioner would:</strong></p>
          <ul style="color: #57534e;">
            <li>Complete the virtue assessment to understand the user journey</li>
            <li>Try creating journal entries and exploring virtue workspaces</li>
            <li>Familiarize yourself with the practitioner experience</li>
          </ul>

          <p><strong>Then access your Organization Admin features:</strong></p>
          <ul style="color: #57534e;">
            <li>Look for the <strong>"Admin"</strong> button in the app header</li>
            <li>Invite team members to join your organization</li>
            <li>Customize your organization's branding and settings</li>
            <li>Monitor member progress and engagement</li>
          </ul>

          <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>

          <p>Welcome to the New Man App organizational community!</p>
          <p>Best regards,<br>The A New Man Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);

    return NextResponse.json({ success: true, message: 'Organization admin invitation email sent successfully' });
  } catch (error) {
    console.error('Email error details:', error);
    return NextResponse.json(
      { error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function generateEmailContent({ 
  organizationName, 
  contactName, 
  contactEmail, 
  organizationSlug, 
  userExists 
}: {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  organizationSlug: string;
  userExists: boolean;
}) {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://newmanapp.com';

  const subject = `Welcome! Your ${organizationName} organization has been approved`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #78716c; margin-bottom: 10px;">🎉 Organization Approved!</h1>
        <h2 style="color: #44403c; margin-top: 0;">${organizationName}</h2>
      </div>

      <p>Dear ${contactName},</p>

      <p>Congratulations! Your organization request for <strong>${organizationName}</strong> has been approved and your organizational account is now ready.</p>

      ${userExists ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #166534; margin-top: 0;">✅ You're All Set!</h3>
          <p style="color: #166534; margin-bottom: 0;">Since you already have an account with us, you've been automatically assigned as the Organization Administrator. Simply log in to access your new organizational features.</p>
        </div>
      ` : `
        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">📝 Next Step: Create Your Account</h3>
          <p style="color: #92400e; margin-bottom: 10px;">To get started, please create your account using this email address (${contactEmail}):</p>
          <div style="text-align: center; margin: 15px 0;">
            <a href="${baseUrl}" style="background-color: #78716c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Create Account & Sign In</a>
          </div>
          <p style="color: #92400e; font-size: 14px; margin-bottom: 0;">You can sign up using either email/password or Google authentication.</p>
        </div>
      `}

      <h3 style="color: #44403c;">🚀 Getting Started as Organization Administrator</h3>
      
      <p><strong>We recommend you first experience the app as a practitioner would:</strong></p>
      <ul style="color: #57534e;">
        <li>Complete the virtue assessment to understand the user journey</li>
        <li>Try creating journal entries and exploring virtue workspaces</li>
        <li>Familiarize yourself with the practitioner experience</li>
      </ul>

      <p><strong>Then access your Organization Admin features:</strong></p>
      <ul style="color: #57534e;">
        <li>Look for the <strong>"Admin"</strong> button in the app header</li>
        <li>Invite team members to join your organization</li>
        <li>Customize your organization's branding and settings</li>
        <li>Monitor member progress and engagement</li>
      </ul>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #475569; margin-top: 0;">📋 Organization Details</h4>
        <p style="color: #64748b; margin: 5px 0;"><strong>Organization:</strong> ${organizationName}</p>
        <p style="color: #64748b; margin: 5px 0;"><strong>Admin Email:</strong> ${contactEmail}</p>
        <p style="color: #64748b; margin: 5px 0;"><strong>Organization ID:</strong> ${organizationSlug}</p>
      </div>

      <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>

      <p>Welcome to the New Man App organizational community!</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
        <p>New Man App - Transforming Character Through Virtue Development</p>
        <p><a href="${baseUrl}" style="color: #78716c;">Visit New Man App</a></p>
      </div>
    </div>
  `;

  return { subject, body };
}