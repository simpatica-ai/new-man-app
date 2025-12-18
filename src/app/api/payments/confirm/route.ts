import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe to get current status
    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Update payment record in database with current status
    const { data: updatedPayment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: paymentIntent.status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select();

    if (error) {
      console.error('Error updating payment status:', error.message);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    if (!updatedPayment || updatedPayment.length === 0) {
      console.warn('No payment record found to update for intent:', paymentIntentId);
    }

    return NextResponse.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}