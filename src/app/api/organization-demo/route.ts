import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

// Helper function to generate a URL-friendly slug from organization name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

// Helper function to send welcome email
async function sendWelcomeEmail(
  email: string,
  name: string,
  organizationName: string,
  tempPassword: string
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn('Email credentials not configured - skipping welcome email');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://new-man-app.simpatica.ai';
  const loginUrl = `${siteUrl}/`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #5F4339;">Welcome to New Man App!</h2>
      
      <p>Hi ${name},</p>
      
      <p>Your organization "<strong>${organizationName}</strong>" has been successfully created on New Man App. You have been assigned as the organization administrator.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      </div>
      
      <p><strong>Important:</strong> Please change your password after your first login for security.</p>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Log in using the credentials above</li>
        <li>Complete your organization setup</li>
        <li>Invite team members (coaches, therapists, practitioners)</li>
        <li>Customize your organization branding</li>
      </ol>
      
      <p>As an organization administrator, you can:</p>
      <ul>
        <li>Manage organization members and their roles</li>
        <li>View progress reports and analytics</li>
        <li>Customize organization settings and branding</li>
        <li>Access administrative tools and reports</li>
      </ul>
      
      <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
      
      <p>Welcome aboard!</p>
      <p>The New Man App Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"New Man App" <${gmailUser}>`,
    to: email,
    subject: `Welcome to New Man App - ${organizationName} Created Successfully`,
    html: emailHtml
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, organization, organizationType, message } = body;

    // Validate required fields
    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: 'Name, email, and organization are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    const userExists = existingUser.users.some(user => user.email === email);
    if (userExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please use a different email or contact support.' },
        { status: 400 }
      );
    }

    // Generate organization slug
    const baseSlug = generateSlug(organization);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existingOrg) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate temporary password or use provided password
    const tempPassword = password || (Math.random().toString(36).slice(-12) + 'A1!');

    // Create user account
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        organization_name: organization
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 500 }
      );
    }

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization,
        slug,
        description: `${organizationType ? organizationType + ' - ' : ''}${message || 'Created via self-service registration'}`,
        active_user_count: 1,
        max_users: 40
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      // Clean up user if org creation fails
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
      return NextResponse.json(
        { error: `Failed to create organization: ${orgError.message}` },
        { status: 500 }
      );
    }

    // Create user profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: name,
        role: 'admin',
        roles: ['admin', 'practitioner'],
        organization_id: orgData.id,
        is_active: true
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up user and org if profile creation fails
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
      await supabase.from('organizations').delete().eq('id', orgData.id);
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(email, name, organization, tempPassword);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the entire process if email fails
    }

    // Create session for immediate login
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://new-man-app.simpatica.ai'}/orgadmin?onboarding=true`
      }
    });

    if (sessionError) {
      console.error('Failed to generate login link:', sessionError);
    }

    return NextResponse.json({
      message: 'Organization created successfully!',
      organization: {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug
      },
      user: {
        id: authUser.user.id,
        email: authUser.user.email
      },
      loginUrl: sessionData?.properties?.action_link || null,
      redirectUrl: `/orgadmin?onboarding=true`
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing organization creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}