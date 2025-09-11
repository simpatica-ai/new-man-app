import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Query assessment requests (proxy for AI usage)
    const { data: monthlyData } = await supabase
      .from('user_assessments')
      .select('created_at')
      .gte('created_at', startOfMonth.toISOString());

    const { data: dailyData } = await supabase
      .from('user_assessments')
      .select('created_at')
      .gte('created_at', startOfDay.toISOString());

    // Query virtue analyses (actual AI calls)
    const { data: monthlyAnalyses } = await supabase
      .from('virtue_analysis')
      .select('created_at')
      .gte('created_at', startOfMonth.toISOString());

    const { data: dailyAnalyses } = await supabase
      .from('virtue_analysis')
      .select('created_at')
      .gte('created_at', startOfDay.toISOString());

    // Calculate metrics
    const monthlyRequests = monthlyAnalyses?.length || 0;
    const dailyRequests = dailyAnalyses?.length || 0;
    
    // Estimate costs (adjust based on your actual Cloud Run pricing)
    const costPerAIRequest = 0.002; // $0.002 per AI analysis request
    const monthlySpend = monthlyRequests * costPerAIRequest;
    const costPerRequest = monthlyRequests > 0 ? monthlySpend / monthlyRequests : 0;

    // Mock performance metrics (replace with actual Cloud Monitoring API calls)
    const avgResponseTime = 2500 + Math.random() * 1000; // 2.5-3.5s typical for AI
    const errorRate = Math.random() * 2; // 0-2% error rate

    const metrics = {
      monthlySpend,
      dailyRequests,
      monthlyRequests,
      errorRate,
      avgResponseTime,
      costPerRequest
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Cloud Run metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}