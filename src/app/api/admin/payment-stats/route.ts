import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/auditLogger';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get the session from cookies (Next.js 13+ approach)
    const cookieStore = cookies();
    const authToken = cookieStore.get('sb-access-token')?.value || 
                     cookieStore.get('supabase-auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user with the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin - check both role field and roles array
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, roles')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || 
                   (profile?.roles && Array.isArray(profile.roles) && profile.roles.includes('admin'));

    if (profileError || !isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get payment statistics
    const stats = await auditLogger.getPaymentStats();
    
    // Get recent audit logs
    const recentLogs = await auditLogger.getRecentLogs(20);

    return NextResponse.json({
      stats,
      recentLogs,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}