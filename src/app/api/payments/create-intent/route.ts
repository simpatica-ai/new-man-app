import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';
import { validatePaymentAmount, STRIPE_CONFIG } from '@/lib/stripeConfig';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', userId, organizationId, metadata } = await request.json();

    // Validate required fields
    if (!amount || !userId) {
      return NextResponse.json(
        { error: 'Amount and userId are required' },
        { status: 400 }
      );
    }

    // Validate amount range (Requirements 5.1: $1.00 to $10,000.00)
    const amountValidation = validatePaymentAmount(amount);
    if (!amountValidation.isValid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Check if user already has a Stripe customer ID
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

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency,
      customerId,
      metadata: {
        userId,
        organizationId: organizationId || '',
        ...metadata,
      },
    });

    // Store payment record in database
    const { data: insertedPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        organization_id: organizationId || null,
        stripe_payment_intent_id: paymentIntent.id,
        amount,
        currency,
        status: STRIPE_CONFIG.PAYMENT_STATUSES.PENDING,
        payment_type: STRIPE_CONFIG.PAYMENT_TYPES.ONE_TIME,
        metadata: metadata || {},
      })
      .select();

    if (paymentError) {
      console.error('Error storing payment record:', paymentError.message);
      // Continue anyway - the payment intent was created successfully
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}