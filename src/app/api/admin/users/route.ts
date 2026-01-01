import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the user is authenticated and get their profile
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users with their organization information
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        organization_id,
        roles,
        created_at,
        organizations(name)
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get auth users to get email addresses
    const { data: authUsers, error: authError2 } = await supabaseAdmin.auth.admin.listUsers();
    if (authError2) {
      console.error('Error fetching auth users:', authError2);
      return NextResponse.json({ error: 'Failed to fetch user emails' }, { status: 500 });
    }

    // Combine profile and auth data
    const combinedUsers = users.map(profile => {
      const authUser = authUsers.users.find(au => au.id === profile.id);
      return {
        id: profile.id,
        full_name: profile.full_name,
        email: authUser?.email || null,
        organization_id: profile.organization_id,
        organization_name: profile.organizations?.name || null,
        roles: profile.roles || [],
        created_at: profile.created_at
      };
    });

    return NextResponse.json({ users: combinedUsers });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}