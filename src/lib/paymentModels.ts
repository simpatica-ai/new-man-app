import { Database } from './database.types';

// Extract types from database schema
export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

export type UserStripeCustomerRow = Database['public']['Tables']['user_stripe_customers']['Row'];
export type UserStripeCustomerInsert = Database['public']['Tables']['user_stripe_customers']['Insert'];
export type UserStripeCustomerUpdate = Database['public']['Tables']['user_stripe_customers']['Update'];

// Enhanced models with additional business logic
export interface Payment extends PaymentRow {
  // Computed properties
  readonly formattedAmount: string;
  readonly isSuccessful: boolean;
  readonly isPending: boolean;
  readonly isFailed: boolean;
}

export interface Subscription extends SubscriptionRow {
  // Computed properties
  readonly formattedAmount: string;
  readonly isActive: boolean;
  readonly isCanceled: boolean;
  readonly daysUntilRenewal: number;
  readonly monthlyAmount: number;
}

export interface UserStripeCustomer extends UserStripeCustomerRow {
  readonly isActive: boolean;
}

// Payment creation data (what we need to create a payment)
export interface CreatePaymentData {
  userId: string;
  amount: number;
  currency?: string;
  paymentType: 'one-time' | 'recurring';
  subscriptionId?: string;
  metadata?: Record<string, unknown>;
}

// Subscription creation data
export interface CreateSubscriptionData {
  userId: string;
  stripePriceId: string;
  amount: number;
  currency?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

// Payment history query options
export interface PaymentHistoryOptions {
  userId: string;
  limit?: number;
  offset?: number;
  status?: PaymentRow['status'];
  paymentType?: PaymentRow['payment_type'];
  startDate?: Date;
  endDate?: Date;
}

// Subscription query options
export interface SubscriptionQueryOptions {
  userId: string;
  status?: SubscriptionRow['status'];
  limit?: number;
  offset?: number;
}

// Payment statistics
export interface PaymentStatistics {
  totalAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  averageAmount: number;
  lastPaymentDate: Date | null;
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

// Model factory functions
export class PaymentModel {
  static create(data: PaymentRow): Payment {
    return {
      ...data,
      get formattedAmount(): string {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: data.currency.toUpperCase(),
        }).format(data.amount);
      },
      get isSuccessful(): boolean {
        return data.status === 'succeeded';
      },
      get isPending(): boolean {
        return data.status === 'pending';
      },
      get isFailed(): boolean {
        return data.status === 'failed' || data.status === 'canceled';
      },
    };
  }

  static createInsertData(data: CreatePaymentData): PaymentInsert {
    return {
      user_id: data.userId,
      stripe_payment_intent_id: '', // Will be set by Stripe service
      amount: data.amount,
      currency: data.currency || 'usd',
      status: 'pending',
      payment_type: data.paymentType,
      subscription_id: data.subscriptionId || null,
      metadata: data.metadata || {},
    };
  }
}

export class SubscriptionModel {
  static create(data: SubscriptionRow): Subscription {
    return {
      ...data,
      get formattedAmount(): string {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: data.currency.toUpperCase(),
        }).format(data.amount);
      },
      get isActive(): boolean {
        return data.status === 'active';
      },
      get isCanceled(): boolean {
        return data.status === 'canceled';
      },
      get daysUntilRenewal(): number {
        const now = new Date();
        const renewalDate = new Date(data.current_period_end);
        const diffTime = renewalDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      get monthlyAmount(): number {
        // Assuming all subscriptions are monthly for now
        return data.amount;
      },
    };
  }

  static createInsertData(data: CreateSubscriptionData): SubscriptionInsert {
    return {
      user_id: data.userId,
      stripe_subscription_id: '', // Will be set by Stripe service
      stripe_price_id: data.stripePriceId,
      amount: data.amount,
      currency: data.currency || 'usd',
      status: 'incomplete', // Initial status
      current_period_start: data.currentPeriodStart.toISOString(),
      current_period_end: data.currentPeriodEnd.toISOString(),
    };
  }
}

export class UserStripeCustomerModel {
  static create(data: UserStripeCustomerRow): UserStripeCustomer {
    return {
      ...data,
    };
  }

  static createInsertData(userId: string, stripeCustomerId: string): UserStripeCustomerInsert {
    return {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
    };
  }
}

// Validation functions
export function validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (amount < 1) {
    return { isValid: false, error: 'Amount must be at least $1.00' };
  }
  
  if (amount > 10000) {
    return { isValid: false, error: 'Amount cannot exceed $10,000.00' };
  }
  
  return { isValid: true };
}

export function validateCurrency(currency: string): { isValid: boolean; error?: string } {
  const supportedCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
  
  if (!currency || typeof currency !== 'string') {
    return { isValid: false, error: 'Currency is required' };
  }
  
  if (!supportedCurrencies.includes(currency.toLowerCase())) {
    return { 
      isValid: false, 
      error: `Currency ${currency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}` 
    };
  }
  
  return { isValid: true };
}

// Helper functions for payment status
export function isPaymentSuccessful(payment: PaymentRow): boolean {
  return payment.status === 'succeeded';
}

export function isPaymentPending(payment: PaymentRow): boolean {
  return payment.status === 'pending';
}

export function isPaymentFailed(payment: PaymentRow): boolean {
  return payment.status === 'failed' || payment.status === 'canceled';
}

export function isSubscriptionActive(subscription: SubscriptionRow): boolean {
  return subscription.status === 'active';
}

export function isSubscriptionCanceled(subscription: SubscriptionRow): boolean {
  return subscription.status === 'canceled';
}