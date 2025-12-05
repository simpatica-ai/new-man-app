import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationName,
      organizationType,
      organizationSize,
      organizationDescription,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionTier
    } = body;

    // Validate required fields
    if (!organizationName || !organizationType || !organizationSize || 
        !adminName || !adminEmail || !adminPassword || !subscriptionTier) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Create organization slug from name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name already exists' },
        { status: 409 }
      );
    }

    // Create the admin user account first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName,
        }
      }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return NextResponse.json(
        { error: 'Failed to create admin account: ' + authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create admin account' },
        { status: 400 }
      );
    }

    // Create the organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          name: organizationName,
          slug: slug,
          subscription_tier: subscriptionTier,
          subscription_status: 'trial', // Start with trial period
          max_users: 40,
          active_user_count: 1,
          settings: {
            organization_type: organizationType,
            organization_size: organizationSize,
            description: organizationDescription
          }
        }
      ])
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      // Clean up the user account if organization creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Update the user profile with organization and admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: orgData.id,
        roles: ['admin'],
        full_name: adminName,
        is_active: true
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      // Clean up created resources
      await supabase.from('organizations').delete().eq('id', orgData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to set up admin profile' },
        { status: 500 }
      );
    }

    // TODO: Send welcome email to admin
    // TODO: Create initial organization setup tasks
    // TODO: Set up billing with Stripe (future implementation)

    return NextResponse.json(
      {
        message: 'Organization created successfully',
        organizationId: orgData.id,
        organizationSlug: orgData.slug,
        userId: authData.user.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing organization signup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}