import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripeService';
import { auditLogger } from '@/lib/auditLogger';
import { headers } from 'next/headers';
import Stripe from 'stripe';

/**
 * Stripe webhook handler for processing payment events
 * Handles payment success/failure, subscription changes, and other Stripe events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // Construct and verify the webhook event
    let event: Stripe.Event;
    try {
      event = stripeService.constructWebhookEvent(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`🔔 Received Stripe webhook: ${event.type}`);

    // Log webhook receipt
    await auditLogger.logWebhookReceived(event.type, event.id, { event_data: event.data });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        console.log(`⚠️  Unhandled webhook event type: ${event.type}`);
        // Log unhandled events for monitoring
        await logWebhookEvent(event, 'unhandled');
    }

    // Log successful webhook processing
    await logWebhookEvent(event, 'processed');

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log failed webhook processing
    try {
      await logWebhookEvent(null, 'error', error instanceof Error ? error.message : 'Unknown error');
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`✅ Payment succeeded: ${paymentIntent.id} for ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
  
  try {
    // Log successful payment
    await auditLogger.logPaymentSucceeded(
      paymentIntent.id,
      paymentIntent.amount / 100,
      paymentIntent.currency,
      paymentIntent.metadata
    );

    // Update payment record in database
    await updatePaymentRecord(paymentIntent.id, {
      status: 'succeeded',
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: paymentIntent.customer as string,
      metadata: paymentIntent.metadata,
    });

    // Send confirmation email or notification (if implemented)
    await sendPaymentConfirmation(paymentIntent);

  } catch (error) {
    console.error('Error handling payment success:', error);
    await auditLogger.logError(`Payment success handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, paymentIntent.id);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`);
  
  try {
    // Log failed payment
    await auditLogger.logPaymentFailed(
      paymentIntent.id,
      paymentIntent.last_payment_error?.message || 'Payment failed',
      paymentIntent.metadata
    );

    // Update payment record in database
    await updatePaymentRecord(paymentIntent.id, {
      status: 'failed',
      stripePaymentIntentId: paymentIntent.id,
      errorMessage: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata,
    });

    // Send failure notification (if implemented)
    await sendPaymentFailureNotification(paymentIntent);

  } catch (error) {
    console.error('Error handling payment failure:', error);
    await auditLogger.logError(`Payment failure handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, paymentIntent.id);
    throw error;
  }
}

/**
 * Handle successful invoice payment (for subscriptions)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`✅ Invoice payment succeeded: ${invoice.id} for subscription ${invoice.subscription}`);
  
  try {
    // Update subscription payment record
    await updateSubscriptionPayment(invoice.subscription as string, {
      status: 'succeeded',
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    });

    // Send subscription confirmation
    await sendSubscriptionPaymentConfirmation(invoice);

  } catch (error) {
    console.error('Error handling invoice payment success:', error);
    throw error;
  }
}

/**
 * Handle failed invoice payment (for subscriptions)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Invoice payment failed: ${invoice.id} for subscription ${invoice.subscription}`);
  
  try {
    // Update subscription payment record
    await updateSubscriptionPayment(invoice.subscription as string, {
      status: 'failed',
      invoiceId: invoice.id,
      errorMessage: 'Invoice payment failed',
      attemptCount: invoice.attempt_count,
    });

    // Send payment failure notification
    await sendSubscriptionPaymentFailureNotification(invoice);

  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription created: ${subscription.id} for customer ${subscription.customer}`);
  
  try {
    // Create subscription record in database
    await createSubscriptionRecord({
      stripeSubscriptionId: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      metadata: subscription.metadata,
    });

    // Send subscription welcome notification
    await sendSubscriptionWelcomeNotification(subscription);

  } catch (error) {
    console.error('Error handling subscription creation:', error);
    throw error;
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id} - status: ${subscription.status}`);
  
  try {
    // Update subscription record in database
    await updateSubscriptionRecord(subscription.id, {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      metadata: subscription.metadata,
    });

    // Handle status-specific updates
    if (subscription.status === 'canceled') {
      await sendSubscriptionCancellationNotification(subscription);
    } else if (subscription.status === 'past_due') {
      await sendSubscriptionPastDueNotification(subscription);
    }

  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);
  
  try {
    // Update subscription record as canceled
    await updateSubscriptionRecord(subscription.id, {
      status: 'canceled',
      canceledAt: new Date(),
      metadata: subscription.metadata,
    });

    // Send cancellation confirmation
    await sendSubscriptionCancellationNotification(subscription);

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

/**
 * Handle customer creation
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log(`👤 Customer created: ${customer.id} - ${customer.email}`);
  
  try {
    // Create customer record in database if needed
    await createCustomerRecord({
      stripeCustomerId: customer.id,
      email: customer.email,
      name: customer.name,
      metadata: customer.metadata,
    });

  } catch (error) {
    console.error('Error handling customer creation:', error);
    throw error;
  }
}

/**
 * Handle customer updates
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log(`👤 Customer updated: ${customer.id}`);
  
  try {
    // Update customer record in database
    await updateCustomerRecord(customer.id, {
      email: customer.email,
      name: customer.name,
      metadata: customer.metadata,
    });

  } catch (error) {
    console.error('Error handling customer update:', error);
    throw error;
  }
}

/**
 * Handle payment method attachment
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`💳 Payment method attached: ${paymentMethod.id} to customer ${paymentMethod.customer}`);
  
  try {
    // Log payment method attachment
    await logPaymentMethodEvent(paymentMethod.id, 'attached', {
      customerId: paymentMethod.customer as string,
      type: paymentMethod.type,
    });

  } catch (error) {
    console.error('Error handling payment method attachment:', error);
    throw error;
  }
}

/**
 * Handle payment method detachment
 */
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`💳 Payment method detached: ${paymentMethod.id}`);
  
  try {
    // Log payment method detachment
    await logPaymentMethodEvent(paymentMethod.id, 'detached', {
      type: paymentMethod.type,
    });

  } catch (error) {
    console.error('Error handling payment method detachment:', error);
    throw error;
  }
}

// Database operations - implemented with Supabase
async function updatePaymentRecord(paymentIntentId: string, data: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabaseClient');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available');
      return;
    }
    
    console.log(`🔄 Attempting to update payment record for ${paymentIntentId}`, data);
    
    const { data: result, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: data.status as string,
        updated_at: new Date().toISOString(),
        metadata: data.metadata || {},
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select();

    if (error) {
      console.error('❌ Error updating payment record:', error);
      throw error;
    }
    
    if (!result || result.length === 0) {
      console.warn(`⚠️  No payment record found for ${paymentIntentId}`);
    } else {
      console.log(`✅ Successfully updated payment record for ${paymentIntentId}`, result);
    }
  } catch (error) {
    console.error('❌ Failed to update payment record:', error);
    // Log but don't throw - webhook should still succeed
  }
}

async function updateSubscriptionPayment(subscriptionId: string, data: Record<string, unknown>) {
  // TODO: Implement database update for subscription payments
  console.log(`📝 Would update subscription payment for ${subscriptionId}:`, data);
}

async function createSubscriptionRecord(data: Record<string, unknown>) {
  // TODO: Implement database creation for subscription records
  console.log(`📝 Would create subscription record:`, data);
}

async function updateSubscriptionRecord(subscriptionId: string, data: Record<string, unknown>) {
  // TODO: Implement database update for subscription records
  console.log(`📝 Would update subscription record for ${subscriptionId}:`, data);
}

async function createCustomerRecord(data: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabaseClient');
    
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return;
    }
    
    const { error } = await supabaseAdmin
      .from('user_stripe_customers')
      .upsert({
        stripe_customer_id: data.stripeCustomerId as string,
        user_id: data.metadata?.userId as string,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating customer record:', error);
      throw error;
    }
    
    console.log(`✅ Created customer record for ${data.stripeCustomerId}`);
  } catch (error) {
    console.error('Failed to create customer record:', error);
    // Log but don't throw - webhook should still succeed
  }
}

async function updateCustomerRecord(customerId: string, data: Record<string, unknown>) {
  // TODO: Implement database update for customer records
  console.log(`📝 Would update customer record for ${customerId}:`, data);
}

async function logPaymentMethodEvent(paymentMethodId: string, event: string, data: Record<string, unknown>) {
  // TODO: Implement logging for payment method events
  console.log(`📝 Would log payment method event ${event} for ${paymentMethodId}:`, data);
}

async function logWebhookEvent(event: Stripe.Event | null, status: string, error?: string) {
  // TODO: Implement webhook event logging
  console.log(`📝 Would log webhook event:`, { 
    eventType: event?.type, 
    eventId: event?.id, 
    status, 
    error 
  });
}

// Notification stubs - these would be implemented with your notification system
async function sendPaymentConfirmation(paymentIntent: Stripe.PaymentIntent) {
  // TODO: Implement payment confirmation notification
  console.log(`📧 Would send payment confirmation for ${paymentIntent.id}`);
}

async function sendPaymentFailureNotification(paymentIntent: Stripe.PaymentIntent) {
  // TODO: Implement payment failure notification
  console.log(`📧 Would send payment failure notification for ${paymentIntent.id}`);
}

async function sendSubscriptionPaymentConfirmation(invoice: Stripe.Invoice) {
  // TODO: Implement subscription payment confirmation
  console.log(`📧 Would send subscription payment confirmation for ${invoice.id}`);
}

async function sendSubscriptionPaymentFailureNotification(invoice: Stripe.Invoice) {
  // TODO: Implement subscription payment failure notification
  console.log(`📧 Would send subscription payment failure notification for ${invoice.id}`);
}

async function sendSubscriptionWelcomeNotification(subscription: Stripe.Subscription) {
  // TODO: Implement subscription welcome notification
  console.log(`📧 Would send subscription welcome notification for ${subscription.id}`);
}

async function sendSubscriptionCancellationNotification(subscription: Stripe.Subscription) {
  // TODO: Implement subscription cancellation notification
  console.log(`📧 Would send subscription cancellation notification for ${subscription.id}`);
}

async function sendSubscriptionPastDueNotification(subscription: Stripe.Subscription) {
  // TODO: Implement subscription past due notification
  console.log(`📧 Would send subscription past due notification for ${subscription.id}`);
}