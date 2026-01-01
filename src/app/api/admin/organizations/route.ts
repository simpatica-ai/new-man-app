import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
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

    // Fetch all organizations
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, active_user_count, max_users, created_at, subscription_status')
      .order('created_at', { ascending: false });

    if (orgsError) {
      return NextResponse.json(
        { error: `Failed to fetch organizations: ${orgsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizations: organizations || []
    });

  } catch (error) {
    console.error('Organizations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}