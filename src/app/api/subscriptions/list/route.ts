import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';

/**
 * GET /api/subscriptions/list
 * Retrieve subscriptions for a user or organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get Stripe customer ID from user/organization data
    // For now, we'll use a placeholder implementation
    const customerId = await getStripeCustomerId(userId, organizationId);
    
    if (!customerId) {
      return NextResponse.json({
        subscriptions: [],
        message: 'No customer found'
      });
    }

    // Get subscription history from Stripe
    const stripeSubscriptions = await stripeService.getSubscriptionHistory(customerId, 20);

    // Transform Stripe subscriptions to our format
    const subscriptions = stripeSubscriptions.map(sub => ({
      id: sub.id,
      stripeSubscriptionId: sub.id,
      amount: sub.items.data[0]?.price.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
      currency: sub.items.data[0]?.price.currency || 'usd',
      status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      createdAt: new Date(sub.created * 1000),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
      metadata: sub.metadata,
    }));

    return NextResponse.json({
      subscriptions,
      total: subscriptions.length,
    });

  } catch (error) {
    console.error('Error retrieving subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get Stripe customer ID from user/organization
 * TODO: Implement with actual database lookup
 */
async function getStripeCustomerId(userId: string, organizationId?: string | null): Promise<string | null> {
  // TODO: Implement database lookup to get Stripe customer ID
  // This would typically involve:
  // 1. Query user/organization table for Stripe customer ID
  // 2. If no customer ID exists, return null
  // 3. If customer ID exists, return it
  
  console.log(`Looking up Stripe customer ID for user: ${userId}, org: ${organizationId}`);
  
  // Placeholder implementation - in real app, this would be a database query
  return null;
}