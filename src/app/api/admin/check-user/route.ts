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
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId required' }, { status: 400 });
    }

    // Get auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 });
    }

    let targetUser = null;
    if (email) {
      targetUser = authUsers.users.find(u => u.email === email);
    } else if (userId) {
      targetUser = authUsers.users.find(u => u.id === userId);
    }

    if (!targetUser) {
      return NextResponse.json({ 
        found: false, 
        message: 'User not found in auth',
        searchCriteria: { email, userId }
      });
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single();

    return NextResponse.json({
      found: true,
      authUser: {
        id: targetUser.id,
        email: targetUser.email,
        created_at: targetUser.created_at,
        email_confirmed_at: targetUser.email_confirmed_at,
        last_sign_in_at: targetUser.last_sign_in_at
      },
      profile: profile || null,
      profileError: profileError?.message || null
    });

  } catch (error) {
    console.error('Error in check-user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}