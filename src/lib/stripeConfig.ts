// Stripe configuration constants and validation

export const STRIPE_CONFIG = {
  // Payment amount limits (Requirements 5.1)
  MIN_AMOUNT: 1.00,
  MAX_AMOUNT: 10000.00,
  
  // Default currency
  DEFAULT_CURRENCY: 'usd',
  
  // Supported currencies
  SUPPORTED_CURRENCIES: ['usd', 'eur', 'gbp', 'cad', 'aud'],
  
  // Payment types
  PAYMENT_TYPES: {
    ONE_TIME: 'one-time',
    RECURRING: 'recurring',
  } as const,
  
  // Payment statuses
  PAYMENT_STATUSES: {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    CANCELED: 'canceled',
  } as const,
  
  // Subscription statuses
  SUBSCRIPTION_STATUSES: {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    PAST_DUE: 'past_due',
    UNPAID: 'unpaid',
    INCOMPLETE: 'incomplete',
  } as const,
  
  // Subscription intervals
  SUBSCRIPTION_INTERVALS: {
    MONTH: 'month',
    YEAR: 'year',
  } as const,
} as const;

export type PaymentType = typeof STRIPE_CONFIG.PAYMENT_TYPES[keyof typeof STRIPE_CONFIG.PAYMENT_TYPES];
export type PaymentStatus = typeof STRIPE_CONFIG.PAYMENT_STATUSES[keyof typeof STRIPE_CONFIG.PAYMENT_STATUSES];
export type SubscriptionStatus = typeof STRIPE_CONFIG.SUBSCRIPTION_STATUSES[keyof typeof STRIPE_CONFIG.SUBSCRIPTION_STATUSES];
export type SubscriptionInterval = typeof STRIPE_CONFIG.SUBSCRIPTION_INTERVALS[keyof typeof STRIPE_CONFIG.SUBSCRIPTION_INTERVALS];

/**
 * Validate payment amount according to requirements
 */
export function validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (amount < STRIPE_CONFIG.MIN_AMOUNT) {
    return { isValid: false, error: `Amount must be at least $${STRIPE_CONFIG.MIN_AMOUNT}` };
  }
  
  if (amount > STRIPE_CONFIG.MAX_AMOUNT) {
    return { isValid: false, error: `Amount cannot exceed $${STRIPE_CONFIG.MAX_AMOUNT}` };
  }
  
  return { isValid: true };
}

/**
 * Validate currency code
 */
export function validateCurrency(currency: string): { isValid: boolean; error?: string } {
  if (!currency || typeof currency !== 'string') {
    return { isValid: false, error: 'Currency is required' };
  }
  
  const normalizedCurrency = currency.toLowerCase();
  if (!STRIPE_CONFIG.SUPPORTED_CURRENCIES.includes(normalizedCurrency as typeof STRIPE_CONFIG.SUPPORTED_CURRENCIES[number])) {
    return { 
      isValid: false, 
      error: `Currency ${currency} is not supported. Supported currencies: ${STRIPE_CONFIG.SUPPORTED_CURRENCIES.join(', ')}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = STRIPE_CONFIG.DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Convert amount to cents for Stripe API
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to amount from Stripe API
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Validate Stripe environment configuration
 */
export function validateStripeEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check publishable key
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  } else if (!publishableKey.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_');
  }
  
  // Check secret key (server-side only)
  if (typeof window === 'undefined') {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      errors.push('STRIPE_SECRET_KEY is not set');
    } else if (!secretKey.startsWith('sk_')) {
      errors.push('STRIPE_SECRET_KEY must start with sk_');
    }
    
    // Check webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      errors.push('STRIPE_WEBHOOK_SECRET is not set');
    } else if (!webhookSecret.startsWith('whsec_')) {
      errors.push('STRIPE_WEBHOOK_SECRET must start with whsec_');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}