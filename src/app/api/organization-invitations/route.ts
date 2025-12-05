import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';

import { supabase } from '@/lib/supabaseClient';
import { generateOrganizationInvitationEmail } from '@/lib/emailTemplate';
import { shouldEnableTestMode } from '@/lib/testMode';

// Validation schemas
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  roles: z.array(z.enum(['admin', 'coach', 'therapist', 'practitioner'])).min(1, 'At least one role is required'),
  organizationId: z.string().uuid('Invalid organization ID')
});

const resendInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID')
});

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  // In development/preview environments, allow test requests without authentication
  if (shouldEnableTestMode(request)) {
    // Return a mock user for testing
    return {
      id: 'test-user-id',
      email: 'test@example.com'
    };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid authentication');
  }

  return user;
}

// Helper function to send invitation email
async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  roles: string[],
  token: string,
  organizationLogo?: string,
  primaryColor?: string
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    throw new Error('Email credentials not configured');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://new-man-app.simpatica.ai';
  const invitationLink = `${siteUrl}/organization/accept-invitation?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  });

  const emailHtml = generateOrganizationInvitationEmail({
    inviteeEmail: email,
    organizationName,
    inviterName,
    roles,
    invitationLink,
    organizationLogo,
    primaryColor
  });

  await transporter.sendMail({
    from: `"A New Man App" <new-man-app@simpatica.ai>`,
    to: email,
    subject: `You're invited to join ${organizationName} - A New Man App`,
    html: emailHtml
  });
}

// POST - Create and send invitation
export async function POST(request: NextRequest) {
  try {
    const testMode = shouldEnableTestMode(request);
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    
    // Validate request body
    const validation = createInvitationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { email, roles, organizationId } = validation.data;

    // Get organization details (using any to bypass type issues until types are regenerated)
    let organization;
    
    if (testMode) {
      // In test mode, create a mock organization
      organization = {
        id: organizationId,
        name: 'Test Organization',
        logo_url: null,
        primary_color: '#5F4339'
      };
    } else {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, logo_url, primary_color')
        .eq('id', organizationId)
        .single();

      if (orgError || !orgData) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      organization = orgData;
    }

    // Get inviter details
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, organization_id, roles')
      .eq('id', user.id)
      .single();

    // In development test mode, create a mock profile
    // testMode already declared above
    const profile = testMode ? {
      full_name: 'Test Admin',
      organization_id: organizationId,
      roles: ['admin']
    } : inviterProfile;

    if (!testMode && (!profile || profile.organization_id !== organizationId)) {
      return NextResponse.json(
        { error: 'You do not have permission to invite users to this organization' },
        { status: 403 }
      );
    }

    // Check if user has admin role
    if (!testMode && !profile.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Only admins can send invitations' },
        { status: 403 }
      );
    }

    const inviterName = profile?.full_name || user.email || 'Someone';

    // Create real invitation using the invitation service
    const { createInvitation } = await import('@/lib/invitationService');
    
    const invitation = await createInvitation({
      organizationId,
      email,
      roles,
      invitedBy: user.id
    });

    // Send invitation email
    try {
      await sendInvitationEmail(
        email,
        organization.name,
        inviterName,
        roles,
        invitation.token,
        organization.logo_url || undefined,
        organization.primary_color
      );
      console.log('Invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation created and email sent successfully!',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        roles: invitation.roles,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// GET - List organization invitations
export async function GET(request: NextRequest) {
  try {
    const testMode = shouldEnableTestMode(request);
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check user permissions
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, roles')
      .eq('id', user.id)
      .single();

    // In development test mode, create a mock profile
    // testMode already declared above
    const profile = testMode ? {
      organization_id: organizationId,
      roles: ['admin']
    } : userProfile;

    if (!testMode && (!profile || profile.organization_id !== organizationId)) {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations for this organization' },
        { status: 403 }
      );
    }

    if (!testMode && !profile.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Only admins can view invitations' },
        { status: 403 }
      );
    }

    // Get invitations - use mock data in test mode
    let invitations;
    
    if (testMode) {
      // Return mock invitations for testing
      invitations = [
        {
          id: 'test-invitation-1',
          email: 'test@example.com',
          roles: ['coach'],
          invited_by: 'test-user-id',
          token: 'test-token-123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          profiles: {
            full_name: 'Test Admin'
          }
        }
      ];
    } else {
      const { getOrganizationInvitations } = await import('@/lib/invitationService');
      invitations = await getOrganizationInvitations(organizationId, includeExpired);
    }
    
    return NextResponse.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// PUT - Resend invitation
export async function PUT(request: NextRequest) {
  try {
    const testMode = shouldEnableTestMode(request);
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    
    // Validate request body
    const validation = resendInvitationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { invitationId } = validation.data;

    // Check user permissions and get invitation details
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organizations!inner(name, logo_url, primary_color)
      `)
      .eq('id', invitationId)
      .is('accepted_at', null)
      .single();

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    // Check if user has permission to resend this invitation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, roles, full_name')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.organization_id !== invitation.organization_id) {
      return NextResponse.json(
        { error: 'You do not have permission to resend this invitation' },
        { status: 403 }
      );
    }

    if (!userProfile.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Only admins can resend invitations' },
        { status: 403 }
      );
    }

    // Resend invitation using the invitation service
    const { resendInvitation } = await import('@/lib/invitationService');
    const updatedInvitation = await resendInvitation(invitationId);

    // Send email again
    try {
      await sendInvitationEmail(
        invitation.email,
        invitation.organizations.name,
        userProfile.full_name || user.email || 'Someone',
        invitation.roles,
        invitation.token,
        invitation.organizations.logo_url || undefined,
        invitation.organizations.primary_color
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: updatedInvitation
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel invitation
export async function DELETE(request: NextRequest) {
  try {
    const testMode = shouldEnableTestMode(request);
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Check user permissions and get invitation details
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select('organization_id')
      .eq('id', invitationId)
      .is('accepted_at', null)
      .single();

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    // Check if user has permission to cancel this invitation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, roles')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.organization_id !== invitation.organization_id) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this invitation' },
        { status: 403 }
      );
    }

    if (!userProfile.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Only admins can cancel invitations' },
        { status: 403 }
      );
    }

    // Cancel invitation using the invitation service
    const { cancelInvitation } = await import('@/lib/invitationService');
    await cancelInvitation(invitationId);

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}