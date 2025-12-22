/**
 * Simple audit logging system for payment transactions
 * Logs to console and database for production monitoring
 */

import { supabaseAdmin } from './supabaseClient';

export interface AuditLogEntry {
  event_type: 'payment_created' | 'payment_succeeded' | 'payment_failed' | 'subscription_created' | 'subscription_canceled' | 'subscription_updated' | 'webhook_received' | 'error_occurred';
  user_id?: string;
  organization_id?: string;
  stripe_id?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

class AuditLogger {
  /**
   * Log a payment-related event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Always log to console for immediate visibility
    console.log(`[AUDIT ${timestamp}] ${entry.event_type}:`, {
      user_id: entry.user_id,
      organization_id: entry.organization_id,
      stripe_id: entry.stripe_id,
      amount: entry.amount,
      currency: entry.currency,
      error: entry.error_message,
      metadata: entry.metadata,
    });

    // Log to database if available
    try {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            event_type: entry.event_type,
            user_id: entry.user_id || null,
            organization_id: entry.organization_id || null,
            stripe_id: entry.stripe_id || null,
            amount: entry.amount || null,
            currency: entry.currency || null,
            metadata: entry.metadata || {},
            error_message: entry.error_message || null,
            ip_address: entry.ip_address || null,
            user_agent: entry.user_agent || null,
            created_at: timestamp,
          });
      }
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Failed to write audit log to database:', error);
    }
  }

  /**
   * Log payment creation
   */
  async logPaymentCreated(userId: string, organizationId: string | undefined, stripeId: string, amount: number, currency: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'payment_created',
      user_id: userId,
      organization_id: organizationId,
      stripe_id: stripeId,
      amount,
      currency,
      metadata,
    });
  }

  /**
   * Log successful payment
   */
  async logPaymentSucceeded(stripeId: string, amount: number, currency: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'payment_succeeded',
      stripe_id: stripeId,
      amount,
      currency,
      metadata,
    });
  }

  /**
   * Log failed payment
   */
  async logPaymentFailed(stripeId: string, errorMessage: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'payment_failed',
      stripe_id: stripeId,
      error_message: errorMessage,
      metadata,
    });
  }

  /**
   * Log subscription creation
   */
  async logSubscriptionCreated(userId: string, organizationId: string | undefined, stripeId: string, amount: number, currency: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'subscription_created',
      user_id: userId,
      organization_id: organizationId,
      stripe_id: stripeId,
      amount,
      currency,
      metadata,
    });
  }

  /**
   * Log subscription cancellation
   */
  async logSubscriptionCanceled(stripeId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'subscription_canceled',
      stripe_id: stripeId,
      metadata,
    });
  }

  /**
   * Log subscription update
   */
  async logSubscriptionUpdated(stripeId: string, amount: number, currency: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'subscription_updated',
      stripe_id: stripeId,
      amount,
      currency,
      metadata,
    });
  }

  /**
   * Log webhook received
   */
  async logWebhookReceived(eventType: string, stripeId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'webhook_received',
      stripe_id: stripeId,
      metadata: { webhook_type: eventType, ...metadata },
    });
  }

  /**
   * Log error
   */
  async logError(errorMessage: string, userId?: string, stripeId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'error_occurred',
      user_id: userId,
      stripe_id: stripeId,
      error_message: errorMessage,
      metadata,
    });
  }

  /**
   * Get recent audit logs for monitoring
   */
  async getRecentLogs(limit: number = 50): Promise<any[]> {
    try {
      if (!supabaseAdmin) {
        return [];
      }

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Get payment statistics for monitoring
   */
  async getPaymentStats(): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalRevenue: number;
    activeSubscriptions: number;
  }> {
    try {
      if (!supabaseAdmin) {
        return {
          totalPayments: 0,
          successfulPayments: 0,
          failedPayments: 0,
          totalRevenue: 0,
          activeSubscriptions: 0,
        };
      }

      const [paymentsResult, subscriptionsResult] = await Promise.all([
        supabaseAdmin
          .from('payments')
          .select('status, amount')
          .in('status', ['succeeded', 'failed']),
        supabaseAdmin
          .from('subscriptions')
          .select('status, amount')
          .eq('status', 'active'),
      ]);

      const payments = paymentsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      const successfulPayments = payments.filter(p => p.status === 'succeeded');
      const failedPayments = payments.filter(p => p.status === 'failed');
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        totalPayments: payments.length,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        totalRevenue,
        activeSubscriptions: subscriptions.length,
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      return {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
      };
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();