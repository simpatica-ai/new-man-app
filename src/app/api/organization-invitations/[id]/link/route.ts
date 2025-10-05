import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { shouldEnableTestMode } from '@/lib/testMode';

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

// Helper function to check user permissions
async function checkUserPermissions(userId: string, organizationId: string, testMode: boolean = false) {
  if (testMode) {
    // In test mode, return mock permissions
    return {
      organization_id: organizationId,
      roles: ['admin']
    };
  }

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('organization_id, roles')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('User profile not found');
  }

  if (profile.organization_id !== organizationId) {
    throw new Error('User does not belong to this organization');
  }

  if (!profile.roles?.includes('admin')) {
    throw new Error('Insufficient permissions - admin role required');
  }

  return profile;
}

// GET - Get invitation link
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const invitationId = params.id;

    // Get invitation details (using any to bypass type issues until types are regenerated)
    const { data: invitation, error } = await (supabase as any)
      .from('organization_invitations')
      .select('organization_id, token, email, expires_at, accepted_at')
      .eq('id', invitationId)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check user permissions
    const testMode = shouldEnableTestMode(request);
    await checkUserPermissions(user.id, invitation.organization_id, testMode);

    // Generate invitation link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://new-man-app.simpatica.ai';
    const invitationLink = `${siteUrl}/organization/accept-invitation?token=${invitation.token}`;

    return NextResponse.json({
      success: true,
      invitation_link: invitationLink,
      email: invitation.email,
      expires_at: invitation.expires_at
    });
  } catch (error) {
    console.error('Error getting invitation link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get invitation link' },
      { status: 500 }
    );
  }
}