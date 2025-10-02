import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Temporarily disabled for development deployment
  return NextResponse.json({
    monthlySpend: 0,
    dailyRequests: 0,
    monthlyRequests: 0,
    errorRate: 0,
    avgResponseTime: 0,
    costPerRequest: 0
  });
}
