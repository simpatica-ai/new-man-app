'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Settings, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subscription {
  id: string;
  stripeSubscriptionId: string;
  amount: number;
  currency: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface SubscriptionDashboardProps {
  userId: string;
  userType: 'individual' | 'organization';
  organizationId?: string;
}

export function SubscriptionDashboard({ userId, userType, organizationId }: SubscriptionDashboardProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [userId, organizationId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subscriptions and payment methods
      const [subscriptionsResponse, paymentMethodsResponse] = await Promise.all([
        fetch(`/api/subscriptions/list?userId=${userId}&organizationId=${organizationId || ''}`),
        fetch(`/api/payments/methods?userId=${userId}&organizationId=${organizationId || ''}`)
      ]);

      if (!subscriptionsResponse.ok || !paymentMethodsResponse.ok) {
        throw new Error('Failed to load subscription data');
      }

      const subscriptionsData = await subscriptionsResponse.json();
      const paymentMethodsData = await paymentMethodsResponse.json();

      setSubscriptions(subscriptionsData.subscriptions || []);
      setPaymentMethods(paymentMethodsData.paymentMethods || []);

    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError('Failed to load subscription information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecurringContribution = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to stop this recurring contribution? You can always set up a new recurring contribution later. Your access to the platform will not be affected.')) {
      return;
    }

    try {
      setActionLoading(subscriptionId);
      
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to stop recurring contribution');
      }

      // Reload data to reflect changes
      await loadSubscriptionData();

    } catch (error) {
      console.error('Error stopping recurring contribution:', error);
      setError('Failed to stop recurring contribution. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateContribution = async (subscriptionId: string) => {
    const currentSubscription = subscriptions.find(s => s.id === subscriptionId);
    if (!currentSubscription) return;

    const newAmountStr = prompt(
      `Update monthly contribution amount:\n\nCurrent: $${currentSubscription.amount.toFixed(2)}/month\n\nEnter new amount (minimum $1.00, maximum $10,000.00):`,
      currentSubscription.amount.toString()
    );

    if (!newAmountStr) return; // User canceled

    const newAmount = parseFloat(newAmountStr);
    if (isNaN(newAmount) || newAmount < 1 || newAmount > 10000) {
      alert('Please enter a valid amount between $1.00 and $10,000.00');
      return;
    }

    if (newAmount === currentSubscription.amount) {
      return; // No change
    }

    try {
      setActionLoading(subscriptionId);
      
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newAmount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contribution');
      }

      // Reload data to reflect changes
      await loadSubscriptionData();
      alert(`Contribution updated successfully! Your new monthly contribution is $${newAmount.toFixed(2)}.`);

    } catch (error) {
      console.error('Error updating contribution:', error);
      setError(error instanceof Error ? error.message : 'Failed to update contribution. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'incomplete':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recurring Contributions
          </CardTitle>
          <CardDescription>
            Manage your ongoing monthly contributions to support the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recurring Contributions</h3>
              <p className="text-gray-500 mb-4">
                You don't have any recurring contributions set up yet. Setting up a monthly contribution helps support the platform's ongoing development and maintenance.
              </p>
              <Button onClick={() => window.location.reload()}>
                Set Up Monthly Contribution
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(subscription.status)}
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">
                              {formatCurrency(subscription.amount, subscription.currency)} / month
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Next contribution: {formatDate(subscription.currentPeriodEnd)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Started: {formatDate(subscription.createdAt)}
                          {subscription.canceledAt && (
                            <span> • Stopped: {formatDate(subscription.canceledAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {subscription.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateContribution(subscription.id)}
                              disabled={actionLoading === subscription.id}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Update Amount
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStopRecurringContribution(subscription.id)}
                              disabled={actionLoading === subscription.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {actionLoading === subscription.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Stop Contribution
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {subscription.status === 'past_due' && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your recurring contribution payment failed. Please update your payment method to continue supporting the platform. Your access will not be affected.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Section */}
      {paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your saved payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
                      </div>
                      <div className="text-sm text-gray-500">
                        Expires {method.card?.exp_month}/{method.card?.exp_year}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SubscriptionDashboard;