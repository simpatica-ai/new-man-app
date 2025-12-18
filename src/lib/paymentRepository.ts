import { supabaseAdmin } from './supabaseClient';
import {
  Payment,
  Subscription,
  UserStripeCustomer,
  PaymentRow,
  PaymentInsert,
  PaymentUpdate,
  SubscriptionRow,
  SubscriptionInsert,
  SubscriptionUpdate,
  UserStripeCustomerRow,
  UserStripeCustomerInsert,
  PaymentHistoryOptions,
  SubscriptionQueryOptions,
  PaymentStatistics,
  PaymentModel,
  SubscriptionModel,
  UserStripeCustomerModel,
  CreatePaymentData,
  CreateSubscriptionData,
} from './paymentModels';

export class PaymentRepository {
  /**
   * Create a new payment record
   */
  async createPayment(data: CreatePaymentData, stripePaymentIntentId: string): Promise<Payment | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const insertData: PaymentInsert = {
        ...PaymentModel.createInsertData(data),
        stripe_payment_intent_id: stripePaymentIntentId,
      };

      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        return null;
      }

      return PaymentModel.create(payment);
    } catch (error) {
      console.error('Error in createPayment:', error);
      return null;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        return null;
      }

      return PaymentModel.create(payment);
    } catch (error) {
      console.error('Error in getPaymentById:', error);
      return null;
    }
  }

  /**
   * Get payment by Stripe payment intent ID
   */
  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', stripePaymentIntentId)
        .single();

      if (error || !payment) {
        return null;
      }

      return PaymentModel.create(payment);
    } catch (error) {
      console.error('Error in getPaymentByStripeId:', error);
      return null;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: PaymentRow['status']): Promise<Payment | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const updateData: PaymentUpdate = {
        status,
        updated_at: new Date().toISOString(),
      };

      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error || !payment) {
        console.error('Error updating payment status:', error);
        return null;
      }

      return PaymentModel.create(payment);
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error);
      return null;
    }
  }

  /**
   * Update payment by Stripe payment intent ID
   */
  async updatePaymentByStripeId(
    stripePaymentIntentId: string, 
    updates: Partial<PaymentUpdate>
  ): Promise<Payment | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const updateData: PaymentUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .update(updateData)
        .eq('stripe_payment_intent_id', stripePaymentIntentId)
        .select()
        .single();

      if (error || !payment) {
        console.error('Error updating payment by Stripe ID:', error);
        return null;
      }

      return PaymentModel.create(payment);
    } catch (error) {
      console.error('Error in updatePaymentByStripeId:', error);
      return null;
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(options: PaymentHistoryOptions): Promise<Payment[]> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      let query = supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', options.userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.paymentType) {
        query = query.eq('payment_type', options.paymentType);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: payments, error } = await query;

      if (error) {
        console.error('Error getting payment history:', error);
        return [];
      }

      return payments?.map(payment => PaymentModel.create(payment)) || [];
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return [];
    }
  }

  /**
   * Get payment statistics for a user
   */
  async getPaymentStatistics(userId: string): Promise<PaymentStatistics> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Get all payments for user
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId);

      if (paymentsError) {
        console.error('Error getting payments for statistics:', paymentsError);
        throw paymentsError;
      }

      // Get all subscriptions for user
      const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subscriptionsError) {
        console.error('Error getting subscriptions for statistics:', subscriptionsError);
        throw subscriptionsError;
      }

      const successfulPayments = payments?.filter(p => p.status === 'succeeded') || [];
      const failedPayments = payments?.filter(p => p.status === 'failed' || p.status === 'canceled') || [];
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];

      const totalAmount = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthlyRecurringRevenue = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

      const lastPayment = successfulPayments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        totalAmount,
        totalPayments: payments?.length || 0,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        averageAmount: successfulPayments.length > 0 ? totalAmount / successfulPayments.length : 0,
        lastPaymentDate: lastPayment ? new Date(lastPayment.created_at) : null,
        totalSubscriptions: subscriptions?.length || 0,
        activeSubscriptions: activeSubscriptions.length,
        monthlyRecurringRevenue,
      };
    } catch (error) {
      console.error('Error in getPaymentStatistics:', error);
      return {
        totalAmount: 0,
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        averageAmount: 0,
        lastPaymentDate: null,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        monthlyRecurringRevenue: 0,
      };
    }
  }
}

export class SubscriptionRepository {
  /**
   * Create a new subscription record
   */
  async createSubscription(data: CreateSubscriptionData, stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const insertData: SubscriptionInsert = {
        ...SubscriptionModel.createInsertData(data),
        stripe_subscription_id: stripeSubscriptionId,
      };

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return null;
      }

      return SubscriptionModel.create(subscription);
    } catch (error) {
      console.error('Error in createSubscription:', error);
      return null;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error || !subscription) {
        return null;
      }

      return SubscriptionModel.create(subscription);
    } catch (error) {
      console.error('Error in getSubscriptionById:', error);
      return null;
    }
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (error || !subscription) {
        return null;
      }

      return SubscriptionModel.create(subscription);
    } catch (error) {
      console.error('Error in getSubscriptionByStripeId:', error);
      return null;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string, 
    updates: Partial<SubscriptionUpdate>
  ): Promise<Subscription | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const updateData: SubscriptionUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error || !subscription) {
        console.error('Error updating subscription:', error);
        return null;
      }

      return SubscriptionModel.create(subscription);
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return null;
    }
  }

  /**
   * Update subscription by Stripe ID
   */
  async updateSubscriptionByStripeId(
    stripeSubscriptionId: string, 
    updates: Partial<SubscriptionUpdate>
  ): Promise<Subscription | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const updateData: SubscriptionUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .select()
        .single();

      if (error || !subscription) {
        console.error('Error updating subscription by Stripe ID:', error);
        return null;
      }

      return SubscriptionModel.create(subscription);
    } catch (error) {
      console.error('Error in updateSubscriptionByStripeId:', error);
      return null;
    }
  }

  /**
   * Get subscriptions for a user
   */
  async getUserSubscriptions(options: SubscriptionQueryOptions): Promise<Subscription[]> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      let query = supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', options.userId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: subscriptions, error } = await query;

      if (error) {
        console.error('Error getting user subscriptions:', error);
        return [];
      }

      return subscriptions?.map(subscription => SubscriptionModel.create(subscription)) || [];
    } catch (error) {
      console.error('Error in getUserSubscriptions:', error);
      return [];
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.updateSubscription(subscriptionId, { status: 'canceled' });
  }
}

export class UserStripeCustomerRepository {
  /**
   * Create user-Stripe customer mapping
   */
  async createUserStripeCustomer(userId: string, stripeCustomerId: string): Promise<UserStripeCustomer | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const insertData = UserStripeCustomerModel.createInsertData(userId, stripeCustomerId);

      const { data: customer, error } = await supabaseAdmin
        .from('user_stripe_customers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user Stripe customer:', error);
        return null;
      }

      return UserStripeCustomerModel.create(customer);
    } catch (error) {
      console.error('Error in createUserStripeCustomer:', error);
      return null;
    }
  }

  /**
   * Get Stripe customer ID for user
   */
  async getStripeCustomerId(userId: string): Promise<string | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: customer, error } = await supabaseAdmin
        .from('user_stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (error || !customer) {
        return null;
      }

      return customer.stripe_customer_id;
    } catch (error) {
      console.error('Error in getStripeCustomerId:', error);
      return null;
    }
  }

  /**
   * Get user ID by Stripe customer ID
   */
  async getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: customer, error } = await supabaseAdmin
        .from('user_stripe_customers')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (error || !customer) {
        return null;
      }

      return customer.user_id;
    } catch (error) {
      console.error('Error in getUserIdByStripeCustomerId:', error);
      return null;
    }
  }
}

// Export singleton instances
export const paymentRepository = new PaymentRepository();
export const subscriptionRepository = new SubscriptionRepository();
export const userStripeCustomerRepository = new UserStripeCustomerRepository();