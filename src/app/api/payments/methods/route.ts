import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';

/**
 * GET /api/payments/methods
 * Retrieve payment methods for a user or organization
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
    const customerId = await getStripeCustomerId(userId, organizationId);
    
    if (!customerId) {
      return NextResponse.json({
        paymentMethods: [],
        message: 'No customer found'
      });
    }

    // Get payment methods from Stripe
    const stripePaymentMethods = await stripeService.getCustomerPaymentMethods(customerId);

    // Transform Stripe payment methods to our format
    const paymentMethods = stripePaymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      } : undefined,
      created: new Date(pm.created * 1000),
    }));

    return NextResponse.json({
      paymentMethods,
      total: paymentMethods.length,
    });

  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment methods' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments/methods
 * Remove a payment method
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Detach payment method from customer
    await stripeService.detachPaymentMethod(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully'
    });

  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
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
  console.log(`Looking up Stripe customer ID for user: ${userId}, org: ${organizationId}`);
  
  // Placeholder implementation - in real app, this would be a database query
  return null;
}