'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  CreditCard, 
  History, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PaymentContainer, { PaymentResult } from '@/components/PaymentContainer';
import PaymentHistory from '@/components/PaymentHistory';
import PaymentAccessGuard from '@/components/PaymentAccessGuard';
import { getPaymentUIContext } from '@/lib/paymentApiHelpers';
import { supabase } from '@/lib/supabaseClient';

interface PaymentActionCardProps {
  className?: string;
}

interface UserContext {
  userId: string;
  userType: 'individual' | 'organization_admin' | 'organization_member';
  organizationId?: string;
  isActive: boolean;
}

export default function PaymentActionCard({ className }: PaymentActionCardProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showPaymentInterface, setShowPaymentInterface] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastPayment, setLastPayment] = useState<PaymentResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Get user profile and organization membership
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('User profile not found');
        return;
      }

      // Determine user type based on organization membership
      let userType: 'individual' | 'organization_admin' | 'organization_member' = 'individual';
      let organizationId: string | undefined;

      if (profile.organization_id) {
        organizationId = profile.organization_id;
        
        // Check if user is organization admin
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', profile.organization_id)
          .single();

        if (orgMember?.role === 'admin') {
          userType = 'organization_admin';
        } else {
          // Any organization member who is not admin should not see payment interface
          userType = 'organization_member';
        }
      }

      const context: UserContext = {
        userId: user.id,
        userType,
        organizationId,
        isActive: true, // Assume active for now
      };

      setUserContext(context);

      // Check if payment interface should be shown
      // CRITICAL: Only show payment interface for individual practitioners and organization admins
      // Organization members should NEVER see the payment interface
      if (userType === 'individual' || userType === 'organization_admin') {
        setShowPaymentInterface(true);
      } else {
        // Explicitly set to false for organization members
        setShowPaymentInterface(false);
      }
    } catch (err) {
      console.error('Error loading user context:', err);
      setError('Failed to load payment interface');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setLastPayment(result);
    // Optionally show success message or refresh history
    if (showHistory) {
      // Trigger history refresh by toggling
      setShowHistory(false);
      setTimeout(() => setShowHistory(true), 100);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Error is already handled by PaymentContainer
  };

  if (isLoading) {
    return (
      <Card className={`bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
            <span className="ml-2 text-sm text-stone-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle ${className}`}>
        <CardContent className="pt-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Don't show payment interface for organization members
  if (!showPaymentInterface || !userContext) {
    return null;
  }

  return (
    <PaymentAccessGuard className={`bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle ${className}`}>
      <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="h-6 w-6 text-amber-600" />
              <div>
                <CardTitle className="text-stone-800 font-medium text-base">
                  Generosity
                </CardTitle>
                <p className="text-xs text-stone-600">
                  Support the platform
                </p>
              </div>
            </div>
            {userContext?.userType === 'organization_admin' && (
              <Badge variant="outline" className="text-xs">
                Organization
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Last Payment Success Message */}
          {lastPayment && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Thank you for your ${lastPayment.amount} contribution!
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setExpanded(!expanded)}
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Make Contribution</span>
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide History' : 'View History'}
            </Button>
          </div>

          {/* Expanded Payment Interface */}
          {expanded && userContext && (
            <div className="pt-2 border-t border-stone-200">
              <PaymentContainer
                userId={userContext.userId}
                userType={userContext.userType as 'individual' | 'organization_admin'}
                organizationId={userContext.organizationId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </div>
          )}

          {/* Payment History */}
          {showHistory && userContext && (
            <div className="pt-2 border-t border-stone-200">
              <PaymentHistory
                userId={userContext.userId}
                organizationId={userContext.organizationId}
              />
            </div>
          )}

          {/* Information Text */}
          {!expanded && !showHistory && (
            <div className="text-xs text-stone-500 text-center">
              <p>
                Your voluntary contributions help sustain and improve the platform for everyone.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PaymentAccessGuard>
  );
}