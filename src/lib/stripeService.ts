import Stripe from 'stripe';
import { 
  validatePaymentAmount, 
  validateCurrency, 
  amountToCents
} from './stripeConfig';

// Initialize Stripe with secret key (only on server-side)
let stripe: Stripe | null = null;

const getStripeInstance = (): Stripe => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripe;
};

export interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionData {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    try {
      // Validate amount
      const amountValidation = validatePaymentAmount(data.amount);
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }

      // Validate currency
      const currencyValidation = validateCurrency(data.currency);
      if (!currencyValidation.isValid) {
        throw new Error(currencyValidation.error);
      }

      const paymentIntent = await getStripeInstance().paymentIntents.create({
        amount: amountToCents(data.amount),
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        metadata: data.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Retrieve a payment intent by ID
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await getStripeInstance().paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error('Failed to retrieve payment intent');
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
    try {
      return await getStripeInstance().customers.create({
        email,
        name,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Retrieve a customer by ID
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await getStripeInstance().customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw new Error('Failed to retrieve customer');
    }
  }

  /**
   * Create a subscription for recurring payments
   */
  async createSubscription(data: SubscriptionData): Promise<Stripe.Subscription> {
    try {
      return await getStripeInstance().subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        metadata: data.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await getStripeInstance().subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string, 
    updates: Partial<Stripe.SubscriptionUpdateParams>
  ): Promise<Stripe.Subscription> {
    try {
      return await getStripeInstance().subscriptions.update(subscriptionId, updates);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Retrieve payment history for a customer
   */
  async getPaymentHistory(customerId: string, limit: number = 10): Promise<Stripe.PaymentIntent[]> {
    try {
      const paymentIntents = await getStripeInstance().paymentIntents.list({
        customer: customerId,
        limit,
      });
      return paymentIntents.data;
    } catch (error) {
      console.error('Error retrieving payment history:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }

  /**
   * Retrieve subscription history for a customer
   */
  async getSubscriptionHistory(customerId: string, limit: number = 10): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await getStripeInstance().subscriptions.list({
        customer: customerId,
        limit,
        status: 'all',
      });
      return subscriptions.data;
    } catch (error) {
      console.error('Error retrieving subscription history:', error);
      throw new Error('Failed to retrieve subscription history');
    }
  }

  /**
   * Retrieve a subscription by ID
   */
  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await getStripeInstance().subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Get customer's payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await getStripeInstance().paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw new Error('Failed to retrieve payment methods');
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await getStripeInstance().paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw new Error('Failed to detach payment method');
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string, 
    updates: Partial<Stripe.CustomerUpdateParams>
  ): Promise<Stripe.Customer> {
    try {
      return await getStripeInstance().customers.update(customerId, updates);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  /**
   * Get comprehensive payment and subscription data for a customer
   */
  async getCustomerFinancialSummary(customerId: string): Promise<{
    customer: Stripe.Customer;
    paymentHistory: Stripe.PaymentIntent[];
    subscriptions: Stripe.Subscription[];
    paymentMethods: Stripe.PaymentMethod[];
    totalPaid: number;
    currency: string;
  }> {
    try {
      const [customer, paymentHistory, subscriptions, paymentMethods] = await Promise.all([
        this.retrieveCustomer(customerId),
        this.getPaymentHistory(customerId, 50), // Get more history for summary
        this.getSubscriptionHistory(customerId, 20),
        this.getCustomerPaymentMethods(customerId),
      ]);

      // Calculate total amount paid from successful payments
      const totalPaid = paymentHistory
        .filter(payment => payment.status === 'succeeded')
        .reduce((total, payment) => total + payment.amount, 0) / 100; // Convert from cents

      // Get the most common currency from payments
      const currencies = paymentHistory.map(p => p.currency);
      const currency = currencies.length > 0 ? currencies[0] : 'usd';

      return {
        customer,
        paymentHistory,
        subscriptions,
        paymentMethods,
        totalPaid,
        currency,
      };
    } catch (error) {
      console.error('Error getting customer financial summary:', error);
      throw new Error('Failed to get customer financial summary');
    }
  }

  /**
   * Create a price for subscription billing
   */
  async createPrice(
    amount: number, 
    currency: string, 
    interval: 'month' | 'year' = 'month'
  ): Promise<Stripe.Price> {
    try {
      // Validate amount
      const amountValidation = validatePaymentAmount(amount);
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }

      // Validate currency
      const currencyValidation = validateCurrency(currency);
      if (!currencyValidation.isValid) {
        throw new Error(currencyValidation.error);
      }

      // First create a product
      const product = await getStripeInstance().products.create({
        name: 'Generosity Payment',
        description: 'Voluntary contribution to support the platform',
      });

      // Then create a price for the product
      return await getStripeInstance().prices.create({
        unit_amount: amountToCents(amount),
        currency: currency.toLowerCase(),
        recurring: { interval },
        product: product.id,
      });
    } catch (error) {
      console.error('Error creating price:', error);
      throw new Error('Failed to create price');
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // For local development without webhooks, you can skip signature verification
    if (!webhookSecret) {
      console.warn('⚠️  Stripe webhook secret not configured - skipping signature verification (development only)');
      // Parse the payload directly without verification (DEVELOPMENT ONLY)
      return JSON.parse(payload.toString()) as Stripe.Event;
    }

    try {
      return getStripeInstance().webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Validate Stripe configuration and connectivity
   */
  async validateStripeConnection(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test basic connectivity by retrieving account info
      const account = await getStripeInstance().accounts.retrieve();
      
      if (!account.charges_enabled) {
        errors.push('Stripe account is not enabled for charges');
      }
      
      if (!account.payouts_enabled) {
        errors.push('Stripe account is not enabled for payouts');
      }

      // Test webhook endpoint configuration
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        errors.push('Webhook secret not configured');
      }

    } catch (error) {
      errors.push(`Stripe connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get Stripe account information
   */
  async getAccountInfo(): Promise<Stripe.Account> {
    try {
      return await getStripeInstance().accounts.retrieve();
    } catch (error) {
      console.error('Error retrieving account info:', error);
      throw new Error('Failed to retrieve account information');
    }
  }

  /**
   * Search for customers by email
   */
  async searchCustomersByEmail(email: string): Promise<Stripe.Customer[]> {
    try {
      const customers = await getStripeInstance().customers.search({
        query: `email:"${email}"`,
      });
      return customers.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  }

  /**
   * Retry a failed payment intent
   */
  async retryPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent.status !== 'requires_payment_method') {
        throw new Error('Payment intent cannot be retried in current state');
      }

      // Confirm the payment intent to retry
      return await getStripeInstance().paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      console.error('Error retrying payment intent:', error);
      throw new Error('Failed to retry payment');
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();