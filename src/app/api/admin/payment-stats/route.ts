import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/auditLogger';

export async function GET() {
  try {
    console.log('Payment stats API called');
    
    // Get payment statistics using the audit logger (which uses supabaseAdmin)
    const stats = await auditLogger.getPaymentStats();
    
    // Get recent audit logs
    const recentLogs = await auditLogger.getRecentLogs(20);

    console.log('Payment stats retrieved:', stats);

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