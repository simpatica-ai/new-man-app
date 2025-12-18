import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Build query based on user type
    let query = supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If organizationId is provided, include organization payments
    if (organizationId) {
      query = supabaseAdmin
        .from('payments')
        .select('*', { count: 'exact' })
        .or(`user_id.eq.${userId},organization_id.eq.${organizationId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Error fetching payment history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      payments: payments || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (error) {
    console.error('Error retrieving payment history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment history' },
      { status: 500 }
    );
  }
}

// Get payment statistics for a user or organization
export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId, startDate, endDate } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Build base query
    let query = supabaseAdmin
      .from('payments')
      .select('amount, currency, status, payment_type, created_at')
      .eq('user_id', userId)
      .eq('status', 'succeeded'); // Only count successful payments

    // Add organization filter if provided
    if (organizationId) {
      query = query.or(`user_id.eq.${userId},organization_id.eq.${organizationId}`);
    }

    // Add date range filter if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payment statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      totalAmount: 0,
      totalPayments: payments?.length || 0,
      oneTimePayments: 0,
      recurringPayments: 0,
      averageAmount: 0,
      currencyBreakdown: {} as Record<string, { amount: number; count: number }>,
    };

    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        stats.totalAmount += payment.amount;
        
        if (payment.payment_type === 'one_time') {
          stats.oneTimePayments++;
        } else if (payment.payment_type === 'recurring') {
          stats.recurringPayments++;
        }

        // Currency breakdown
        if (!stats.currencyBreakdown[payment.currency]) {
          stats.currencyBreakdown[payment.currency] = { amount: 0, count: 0 };
        }
        stats.currencyBreakdown[payment.currency].amount += payment.amount;
        stats.currencyBreakdown[payment.currency].count++;
      });

      stats.averageAmount = stats.totalAmount / stats.totalPayments;
    }

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error calculating payment statistics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate payment statistics' },
      { status: 500 }
    );
  }
}