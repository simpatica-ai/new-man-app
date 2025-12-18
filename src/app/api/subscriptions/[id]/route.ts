import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Verify subscription exists in our database
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripeService.cancelSubscription(subscriptionId);

    // Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      // Continue anyway - the subscription was canceled in Stripe
    }

    return NextResponse.json({
      subscriptionId: canceledSubscription.id,
      status: canceledSubscription.status,
      canceledAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;
    const { amount } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount < 1 || amount > 10000) {
      return NextResponse.json(
        { error: 'Amount must be between $1.00 and $10,000.00' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Verify subscription exists in our database
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, user_id, stripe_price_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Create new price for the updated amount
    const newPrice = await stripeService.createPrice(amount, 'usd', 'month');

    // Update subscription in Stripe with new price
    const updatedSubscription = await stripeService.updateSubscription(subscriptionId, {
      items: [{
        id: subscription.stripe_price_id,
        price: newPrice.id,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update subscription in database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        amount,
        stripe_price_id: newPrice.id,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
      // Continue anyway - the subscription was updated in Stripe
    }

    return NextResponse.json({
      subscriptionId: updatedSubscription.id,
      amount,
      status: updatedSubscription.status,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get subscription from database
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscription,
    });

  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription' },
      { status: 500 }
    );
  }
}