'use client';

import React, { useState } from 'react';
import PaymentContainer, { PaymentResult } from '@/components/PaymentContainer';
import PaymentHistory from '@/components/PaymentHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, History, User, Building2 } from 'lucide-react';

export default function TestPaymentsPage() {
  const [userType, setUserType] = useState<'individual' | 'organization_admin'>('individual');
  const [lastPayment, setLastPayment] = useState<PaymentResult | null>(null);
  
  // Mock user data for testing
  const mockUserId = 'test-user-123';
  const mockOrgId = userType === 'organization_admin' ? 'test-org-456' : undefined;

  const handlePaymentSuccess = (result: PaymentResult) => {
    console.log('Payment successful:', result);
    setLastPayment(result);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-stone-800">Payment System Test</h1>
          <p className="text-stone-600">
            Test the PaymentContainer and PaymentHistory components
          </p>
          
          {/* User Type Selector */}
          <div className="flex justify-center space-x-4">
            <Button
              variant={userType === 'individual' ? 'default' : 'outline'}
              onClick={() => setUserType('individual')}
              className="flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Individual Practitioner</span>
            </Button>
            <Button
              variant={userType === 'organization_admin' ? 'default' : 'outline'}
              onClick={() => setUserType('organization_admin')}
              className="flex items-center space-x-2"
            >
              <Building2 className="h-4 w-4" />
              <span>Organization Admin</span>
            </Button>
          </div>
          
          <Badge variant="secondary" className="text-sm">
            Current User Type: {userType === 'individual' ? 'Individual Practitioner' : 'Organization Administrator'}
          </Badge>
        </div>

        {/* Last Payment Result */}
        {lastPayment && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Last Payment Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-green-800">Amount</div>
                  <div className="text-green-700">${lastPayment.amount}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Type</div>
                  <div className="text-green-700">{lastPayment.paymentType}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Currency</div>
                  <div className="text-green-700">{lastPayment.currency.toUpperCase()}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Payment ID</div>
                  <div className="text-green-700 font-mono text-xs">
                    {lastPayment.paymentIntentId.slice(-8)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Make Payment</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Payment History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment" className="space-y-6">
            <PaymentContainer
              userId={mockUserId}
              userType={userType}
              organizationId={mockOrgId}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <PaymentHistory
              userId={mockUserId}
              organizationId={mockOrgId}
            />
          </TabsContent>
        </Tabs>

        {/* Development Notes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Development Notes</CardTitle>
            <CardDescription className="text-amber-700">
              This is a test page for the payment components
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 space-y-2">
            <div>• Use Stripe test card numbers for testing (e.g., 4242 4242 4242 4242)</div>
            <div>• Any future expiry date and any 3-digit CVC will work</div>
            <div>• The payment system integrates with your Stripe test environment</div>
            <div>• Switch between user types to see different interface variations</div>
            <div>• Check the browser console for detailed payment logs</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}