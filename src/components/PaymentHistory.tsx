'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PaymentHistoryProps {
  userId: string;
  organizationId?: string;
  className?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: 'one-time' | 'recurring';
  created_at: string;
  stripe_payment_intent_id: string;
}

interface PaymentStats {
  totalAmount: number;
  totalPayments: number;
  oneTimePayments: number;
  recurringPayments: number;
  averageAmount: number;
  currencyBreakdown: Record<string, { amount: number; count: number }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function PaymentHistory({ userId, organizationId, className }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPaymentHistory = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: '10',
      });

      if (organizationId) {
        params.append('organizationId', organizationId);
      }

      const response = await fetch(`/api/payments/history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }

      setPayments(data.payments || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch('/api/payments/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment statistics');
      }

      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching payment stats:', err);
      // Don't show error for stats, just log it
    }
  };

  useEffect(() => {
    fetchPaymentHistory(currentPage);
    fetchPaymentStats();
  }, [userId, organizationId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    return type === 'recurring' ? (
      <Badge variant="outline" className="text-amber-700 border-amber-300">
        <Calendar className="h-3 w-3 mr-1" />
        Monthly
      </Badge>
    ) : (
      <Badge variant="outline" className="text-stone-700 border-stone-300">
        <CreditCard className="h-3 w-3 mr-1" />
        One-time
      </Badge>
    );
  };

  if (isLoading && payments.length === 0) {
    return (
      <Card className={`border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
            <span className="ml-2 text-stone-600">Loading payment history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Statistics */}
      {stats && (
        <Card className="border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-amber-600" />
              <div>
                <CardTitle className="text-stone-800 font-medium">Contribution Summary</CardTitle>
                <CardDescription className="text-stone-600">
                  Your generosity impact overview
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-stone-800">
                  {formatAmount(stats.totalAmount, 'usd')}
                </div>
                <div className="text-sm text-stone-600">Total Contributed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stone-800">{stats.totalPayments}</div>
                <div className="text-sm text-stone-600">Total Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stone-800">
                  {formatAmount(stats.averageAmount, 'usd')}
                </div>
                <div className="text-sm text-stone-600">Average Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-stone-800">{stats.recurringPayments}</div>
                <div className="text-sm text-stone-600">Active Subscriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <History className="h-6 w-6 text-amber-600" />
            <div>
              <CardTitle className="text-stone-800 font-medium">Payment History</CardTitle>
              <CardDescription className="text-stone-600">
                View all your contributions and transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {payments.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-600 mb-2">No payments yet</h3>
              <p className="text-stone-500">
                Your contribution history will appear here once you make your first payment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-stone-200 rounded-lg bg-white/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {payment.payment_type === 'recurring' ? (
                        <Calendar className="h-5 w-5 text-amber-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-stone-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-stone-800">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                        {getPaymentTypeBadge(payment.payment_type)}
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-stone-600">
                        {formatDate(payment.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-500">
                      ID: {payment.stripe_payment_intent_id.slice(-8)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-stone-600">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} payments
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-stone-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}