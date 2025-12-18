import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';
import { validatePaymentAmount } from '@/lib/stripeConfig';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', interval = 'month', userId, organizationId, metadata } = await request.json();

    // Validate required fields
    if (!amount || !userId) {
      return NextResponse.json(
        { error: 'Amount and userId are required' },
        { status: 400 }
      );
    }

    // Validate amount range
    const amountValidation = validatePaymentAmount(amount);
    if (!amountValidation.isValid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      );
    }

    // Validate interval
    if (!['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Interval must be "month" or "year"' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    
    const { data: existingCustomer } = await supabaseAdmin
      .from('user_stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Get user email and profile info
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      // Get user profile for full name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      // Create new Stripe customer
      const stripeCustomer = await stripeService.createCustomer(
        authUser.user.email,
        profile?.full_name || undefined,
        { userId, organizationId: organizationId || '' }
      );

      customerId = stripeCustomer.id;

      // Store customer ID in database
      await supabaseAdmin
        .from('user_stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId,
          created_at: new Date().toISOString(),
        });
    }

    // Create price for subscription
    const price = await stripeService.createPrice(amount, currency, interval as 'month' | 'year');

    // Create subscription
    const subscription = await stripeService.createSubscription({
      customerId,
      priceId: price.id,
      metadata: {
        userId,
        organizationId: organizationId || '',
        ...metadata,
      },
    });

    // Store subscription record in database
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        organization_id: organizationId || null,
        stripe_subscription_id: subscription.id,
        stripe_price_id: price.id,
        amount,
        currency,
        interval,
        status: subscription.status,
        current_period_start: new Date((subscription as { current_period_start: number }).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as { current_period_end: number }).current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: metadata || {},
      });

    if (subscriptionError) {
      console.error('Error storing subscription record:', subscriptionError);
      // Continue anyway - the subscription was created successfully
    }

    // Get client secret from the subscription's latest invoice
    const latestInvoice = subscription.latest_invoice as { payment_intent?: { client_secret?: string } };
    const clientSecret = latestInvoice?.payment_intent?.client_secret;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}