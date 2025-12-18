import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/auditLogger';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
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