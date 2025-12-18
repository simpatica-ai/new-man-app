'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface PaymentAccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallbackForMembers?: boolean;
  className?: string;
}

interface UserAccessContext {
  userId: string;
  userType: 'individual' | 'organization_admin' | 'organization_member';
  organizationId?: string;
  hasPaymentAccess: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * PaymentAccessGuard - A security component that ensures only authorized users
 * can access payment functionality. Organization members are explicitly excluded.
 * 
 * This component implements the core security requirement:
 * "Organization members should never see payment interfaces"
 */
export default function PaymentAccessGuard({ 
  children, 
  fallback,
  showFallbackForMembers = false,
  className 
}: PaymentAccessGuardProps) {
  const [accessContext, setAccessContext] = useState<UserAccessContext>({
    userId: '',
    userType: 'individual',
    hasPaymentAccess: false,
    isLoading: true,
  });

  useEffect(() => {
    checkPaymentAccess();
  }, []);

  const checkPaymentAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccessContext(prev => ({
          ...prev,
          isLoading: false,
          error: 'User not authenticated',
          hasPaymentAccess: false,
        }));
        return;
      }

      // Get user profile and organization membership
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, organization_id, roles')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setAccessContext(prev => ({
          ...prev,
          isLoading: false,
          error: 'User profile not found',
          hasPaymentAccess: false,
        }));
        return;
      }

      let userType: 'individual' | 'organization_admin' | 'organization_member' = 'individual';
      let organizationId: string | undefined;
      let hasPaymentAccess = false;

      if (profile.organization_id) {
        organizationId = profile.organization_id;
        
        // Check if user has admin role in their roles array
        const isAdmin = profile.roles && Array.isArray(profile.roles) && profile.roles.includes('admin');

        if (isAdmin) {
          userType = 'organization_admin';
          hasPaymentAccess = true; // Organization admins can make payments
        } else {
          userType = 'organization_member';
          hasPaymentAccess = false; // Organization members CANNOT make payments
        }
      } else {
        // Individual practitioner
        userType = 'individual';
        hasPaymentAccess = true; // Individual practitioners can make payments
      }

      setAccessContext({
        userId: user.id,
        userType,
        organizationId,
        hasPaymentAccess,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error checking payment access:', error);
      setAccessContext(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to verify payment access',
        hasPaymentAccess: false,
      }));
    }
  };

  // Loading state
  if (accessContext.isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
            <span className="ml-2 text-sm text-stone-600">Verifying access...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (accessContext.error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {accessContext.error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Access granted - show payment interface
  if (accessContext.hasPaymentAccess) {
    return <>{children}</>;
  }

  // Access denied - organization member
  if (accessContext.userType === 'organization_member') {
    if (showFallbackForMembers && fallback) {
      return <>{fallback}</>;
    }
    
    // Default: don't show anything for organization members
    return null;
  }

  // Fallback for other cases
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Payment functionality is not available for your account type.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to get payment access context
 */
export function usePaymentAccess() {
  const [accessContext, setAccessContext] = useState<UserAccessContext>({
    userId: '',
    userType: 'individual',
    hasPaymentAccess: false,
    isLoading: true,
  });

  useEffect(() => {
    checkPaymentAccess();
  }, []);

  const checkPaymentAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccessContext(prev => ({
          ...prev,
          isLoading: false,
          error: 'User not authenticated',
          hasPaymentAccess: false,
        }));
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, organization_id, roles')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setAccessContext(prev => ({
          ...prev,
          isLoading: false,
          error: 'User profile not found',
          hasPaymentAccess: false,
        }));
        return;
      }

      let userType: 'individual' | 'organization_admin' | 'organization_member' = 'individual';
      let organizationId: string | undefined;
      let hasPaymentAccess = false;

      if (profile.organization_id) {
        organizationId = profile.organization_id;
        
        // Check if user has admin role in their roles array
        const isAdmin = profile.roles && Array.isArray(profile.roles) && profile.roles.includes('admin');

        if (isAdmin) {
          userType = 'organization_admin';
          hasPaymentAccess = true;
        } else {
          userType = 'organization_member';
          hasPaymentAccess = false;
        }
      } else {
        userType = 'individual';
        hasPaymentAccess = true;
      }

      setAccessContext({
        userId: user.id,
        userType,
        organizationId,
        hasPaymentAccess,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error checking payment access:', error);
      setAccessContext(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to verify payment access',
        hasPaymentAccess: false,
      }));
    }
  };

  return accessContext;
}