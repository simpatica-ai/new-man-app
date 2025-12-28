import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
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
  organizationName: string
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn('Email credentials not configured - skipping welcome email');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://new-man-app.simpatica.ai';

  const transporter = nodemailer.createTransporter({
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
      
      <p>As an organization administrator, you can:</p>
      <ul>
        <li>Manage organization members and their roles</li>
        <li>View progress reports and analytics</li>
        <li>Customize organization settings and branding</li>
        <li>Access administrative tools and reports</li>
      </ul>
      
      <p><a href="${siteUrl}/orgadmin" style="background-color: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Organization Dashboard</a></p>
      
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
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organization, organizationType, message } = body;

    // Validate required fields
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Check if user already has an organization
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('organization_id, roles')
      .eq('id', user.id)
      .single();

    if (existingProfile?.organization_id) {
      return NextResponse.json(
        { error: 'You already belong to an organization' },
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

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization,
        slug,
        description: `${organizationType ? organizationType + ' - ' : ''}${message || 'Created via self-service'}`,
        active_user_count: 1,
        max_users: 40
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.json(
        { error: `Failed to create organization: ${orgError.message}` },
        { status: 500 }
      );
    }

    // Update user profile to admin role and link to organization
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        roles: ['admin', 'practitioner'],
        organization_id: orgData.id
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Clean up organization if profile update fails
      await supabase.from('organizations').delete().eq('id', orgData.id);
      return NextResponse.json(
        { error: `Failed to update user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Store the organization request for admin tracking
    try {
      await supabase
        .from('organization_demo_requests' as 'profiles') // Type assertion for missing table type
        .insert({
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
          organization,
          organization_type: organizationType,
          message,
          status: 'completed',
          organization_id: orgData.id,
          user_id: user.id
        });
    } catch (trackingError) {
      console.error('Failed to store demo request tracking:', trackingError);
      // Don't fail the entire process if tracking fails
    }

    // Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(
        user.email || '', 
        user.user_metadata?.full_name || user.email || 'User', 
        organization
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the entire process if email fails
    }

    return NextResponse.json({
      message: 'Organization created successfully!',
      organization: {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing organization creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}