'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  CreditCard, 
  History, 
  Building2, 
  AlertCircle, 
  Loader2,
  TrendingUp
} from 'lucide-react';
import PaymentContainer, { PaymentResult } from '@/components/PaymentContainer';
import PaymentHistory from '@/components/PaymentHistory';
import { supabase } from '@/lib/supabaseClient';

interface OrganizationPaymentCardProps {
  organizationId: string;
  className?: string;
}

interface UserContext {
  userId: string;
  userType: 'organization_admin';
  organizationId: string;
  isActive: boolean;
}

export default function OrganizationPaymentCard({ 
  organizationId, 
  className 
}: OrganizationPaymentCardProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastPayment, setLastPayment] = useState<PaymentResult | null>(null);
  const [activeTab, setActiveTab] = useState('contribute');

  useEffect(() => {
    loadUserContext();
  }, [organizationId]);

  const loadUserContext = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Verify user is admin of this organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('roles, organization_id')
        .eq('id', user.id)
        .single();

      if (!profile || 
          profile.organization_id !== organizationId || 
          !profile.roles?.includes('admin')) {
        setError('Access denied: Organization admin privileges required');
        return;
      }

      const context: UserContext = {
        userId: user.id,
        userType: 'organization_admin',
        organizationId,
        isActive: true,
      };

      setUserContext(context);
    } catch (err) {
      console.error('Error loading user context:', err);
      setError('Failed to load payment interface');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setLastPayment(result);
    // Switch to history tab to show the new payment
    setActiveTab('history');
  };

  const handlePaymentError = (error: string) => {
    console.error('Organization payment error:', error);
    // Error is already handled by PaymentContainer
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
            <span className="ml-2 text-stone-600">Loading payment interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-amber-600" />
            <span>Organization Contributions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!userContext) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6 text-amber-600" />
            <div>
              <CardTitle className="text-stone-800 font-medium">
                Organization Contributions
              </CardTitle>
              <CardDescription>
                Support the platform on behalf of your organization
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Building2 className="h-3 w-3" />
            <span>Organization</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Success Message */}
        {lastPayment && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Thank you for your organization's ${lastPayment.amount} contribution!
                </p>
                <p className="text-sm text-green-700">
                  {lastPayment.paymentType === 'recurring' 
                    ? 'Your monthly subscription is now active.' 
                    : 'Your one-time contribution has been processed.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contribute" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Make Contribution</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Payment History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contribute" className="mt-6">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Organization Contribution</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This contribution will be made on behalf of your organization and will appear 
                      in your organization's payment history and reports.
                    </p>
                  </div>
                </div>
              </div>

              <PaymentContainer
                userId={userContext.userId}
                userType={userContext.userType}
                organizationId={userContext.organizationId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <PaymentHistory
              userId={userContext.userId}
              organizationId={userContext.organizationId}
            />
          </TabsContent>
        </Tabs>

        {/* Information Footer */}
        <div className="mt-6 pt-4 border-t border-stone-200">
          <div className="flex items-start space-x-2">
            <TrendingUp className="h-4 w-4 text-stone-500 mt-0.5" />
            <div className="text-xs text-stone-500">
              <p className="font-medium">Organization Benefits</p>
              <p>
                Your organization's contributions help sustain the platform and support 
                the development of features that benefit all your members.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}