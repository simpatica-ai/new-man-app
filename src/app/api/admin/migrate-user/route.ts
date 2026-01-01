import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, organizationId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'join') {
      // Move user to organization
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID required for join action' },
          { status: 400 }
        );
      }

      // Verify organization exists and has capacity
      const { data: organization, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError || !organization) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      if (organization.active_user_count >= organization.max_users) {
        return NextResponse.json(
          { error: 'Organization has reached maximum user capacity' },
          { status: 400 }
        );
      }

      // Update user profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          organization_id: organizationId,
          roles: ['practitioner'], // Reset to basic practitioner role
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update user profile: ${updateError.message}` },
          { status: 500 }
        );
      }

      // Update organization user count
      const { error: orgUpdateError } = await supabaseAdmin
        .from('organizations')
        .update({
          active_user_count: organization.active_user_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (orgUpdateError) {
        console.error('Failed to update organization count:', orgUpdateError);
        // Don't fail the request for this
      }

      // If user was previously in another organization, decrement that count
      if (userProfile.organization_id && userProfile.organization_id !== organizationId) {
        const { error: prevOrgError } = await supabaseAdmin
          .from('organizations')
          .update({
            active_user_count: Math.max(0, (await supabaseAdmin
              .from('organizations')
              .select('active_user_count')
              .eq('id', userProfile.organization_id)
              .single()).data?.active_user_count - 1 || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', userProfile.organization_id);

        if (prevOrgError) {
          console.error('Failed to update previous organization count:', prevOrgError);
        }
      }

      return NextResponse.json({
        message: 'User successfully migrated to organization',
        user: {
          id: userId,
          organization_id: organizationId,
          organization_name: organization.name
        }
      });

    } else if (action === 'leave') {
      // Convert user to individual practitioner
      if (!userProfile.organization_id) {
        return NextResponse.json(
          { error: 'User is not in an organization' },
          { status: 400 }
        );
      }

      const previousOrgId = userProfile.organization_id;

      // Update user profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          organization_id: null,
          roles: ['practitioner'], // Reset to basic practitioner role
          role: 'user', // Reset role to user
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update user profile: ${updateError.message}` },
          { status: 500 }
        );
      }

      // Update previous organization user count
      const { data: prevOrg } = await supabaseAdmin
        .from('organizations')
        .select('active_user_count')
        .eq('id', previousOrgId)
        .single();

      if (prevOrg) {
        const { error: orgUpdateError } = await supabaseAdmin
          .from('organizations')
          .update({
            active_user_count: Math.max(0, prevOrg.active_user_count - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', previousOrgId);

        if (orgUpdateError) {
          console.error('Failed to update organization count:', orgUpdateError);
        }
      }

      return NextResponse.json({
        message: 'User successfully converted to individual practitioner',
        user: {
          id: userId,
          organization_id: null
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "join" or "leave"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}