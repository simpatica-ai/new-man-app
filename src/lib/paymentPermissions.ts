import { userContextService, UserContext, UserType } from './userContextService';

export interface PaymentPermissionCheck {
  allowed: boolean;
  reason?: string;
  userType?: UserType;
  organizationId?: string;
}

export class PaymentPermissionService {
  /**
   * Check if user can access payment interface
   */
  async canAccessPaymentInterface(userId: string): Promise<PaymentPermissionCheck> {
    try {
      const context = await userContextService.getUserContext(userId);
      
      if (!context) {
        return {
          allowed: false,
          reason: 'User context not found',
        };
      }

      if (!context.isActive) {
        return {
          allowed: false,
          reason: 'User account is inactive',
          userType: context.userType,
        };
      }

      // Organization members cannot access payment interface
      if (context.userType === 'organization_member') {
        return {
          allowed: false,
          reason: 'Organization members cannot make payments - payments are handled by organization administrators',
          userType: context.userType,
          organizationId: context.organizationId,
        };
      }

      // Individual practitioners and organization admins can access payment interface
      if (context.userType === 'individual' || context.userType === 'organization_admin') {
        return {
          allowed: true,
          userType: context.userType,
          organizationId: context.organizationId,
        };
      }

      return {
        allowed: false,
        reason: 'Unknown user type',
        userType: context.userType,
      };
    } catch (error) {
      console.error('Error checking payment interface access:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
      };
    }
  }

  /**
   * Check if user can make a specific payment
   */
  async canMakePayment(userId: string, amount: number): Promise<PaymentPermissionCheck> {
    try {
      // First check basic payment interface access
      const interfaceCheck = await this.canAccessPaymentInterface(userId);
      if (!interfaceCheck.allowed) {
        return interfaceCheck;
      }

      const context = await userContextService.getUserContext(userId);
      if (!context) {
        return {
          allowed: false,
          reason: 'User context not found',
        };
      }

      // Check payment permissions
      if (!context.paymentPermissions.canMakePayments) {
        return {
          allowed: false,
          reason: 'User does not have payment permissions',
          userType: context.userType,
        };
      }

      // Validate amount (Requirements 5.1: $1.00 to $10,000.00)
      if (amount < 1 || amount > 10000) {
        return {
          allowed: false,
          reason: 'Payment amount must be between $1.00 and $10,000.00',
          userType: context.userType,
        };
      }

      return {
        allowed: true,
        userType: context.userType,
        organizationId: context.organizationId,
      };
    } catch (error) {
      console.error('Error checking payment permission:', error);
      return {
        allowed: false,
        reason: 'Error checking payment permissions',
      };
    }
  }

  /**
   * Check if user can view payment history
   */
  async canViewPaymentHistory(userId: string): Promise<PaymentPermissionCheck> {
    try {
      const context = await userContextService.getUserContext(userId);
      
      if (!context) {
        return {
          allowed: false,
          reason: 'User context not found',
        };
      }

      if (!context.isActive) {
        return {
          allowed: false,
          reason: 'User account is inactive',
          userType: context.userType,
        };
      }

      if (!context.paymentPermissions.canViewPaymentHistory) {
        return {
          allowed: false,
          reason: 'User does not have permission to view payment history',
          userType: context.userType,
        };
      }

      return {
        allowed: true,
        userType: context.userType,
        organizationId: context.organizationId,
      };
    } catch (error) {
      console.error('Error checking payment history permission:', error);
      return {
        allowed: false,
        reason: 'Error checking payment history permissions',
      };
    }
  }

  /**
   * Check if user can manage subscriptions
   */
  async canManageSubscriptions(userId: string): Promise<PaymentPermissionCheck> {
    try {
      const context = await userContextService.getUserContext(userId);
      
      if (!context) {
        return {
          allowed: false,
          reason: 'User context not found',
        };
      }

      if (!context.isActive) {
        return {
          allowed: false,
          reason: 'User account is inactive',
          userType: context.userType,
        };
      }

      if (!context.paymentPermissions.canManageSubscriptions) {
        return {
          allowed: false,
          reason: 'User does not have permission to manage subscriptions',
          userType: context.userType,
        };
      }

      return {
        allowed: true,
        userType: context.userType,
        organizationId: context.organizationId,
      };
    } catch (error) {
      console.error('Error checking subscription management permission:', error);
      return {
        allowed: false,
        reason: 'Error checking subscription management permissions',
      };
    }
  }

  /**
   * Get payment context for a user (includes permissions and user type info)
   */
  async getPaymentContext(userId: string): Promise<{
    userContext: UserContext | null;
    permissions: {
      canAccessInterface: PaymentPermissionCheck;
      canMakePayments: PaymentPermissionCheck;
      canViewHistory: PaymentPermissionCheck;
      canManageSubscriptions: PaymentPermissionCheck;
    };
  }> {
    const userContext = await userContextService.getUserContext(userId);
    
    const permissions = {
      canAccessInterface: await this.canAccessPaymentInterface(userId),
      canMakePayments: await this.canMakePayment(userId, 100), // Test with valid amount
      canViewHistory: await this.canViewPaymentHistory(userId),
      canManageSubscriptions: await this.canManageSubscriptions(userId),
    };

    return {
      userContext,
      permissions,
    };
  }

  /**
   * Check if user should see payment interface based on their type
   * This is the main function used by UI components
   */
  async shouldShowPaymentInterface(userId: string): Promise<boolean> {
    const check = await this.canAccessPaymentInterface(userId);
    return check.allowed;
  }

  /**
   * Get user-friendly message explaining why payment interface is hidden
   */
  async getPaymentInterfaceMessage(userId: string): Promise<string | null> {
    const check = await this.canAccessPaymentInterface(userId);
    
    if (check.allowed) {
      return null; // No message needed if interface is allowed
    }

    // Return user-friendly messages based on user type
    switch (check.userType) {
      case 'organization_member':
        return 'Your organization handles payments for all members. Contact your organization administrator if you have questions about billing.';
      
      default:
        return check.reason || 'Payment interface is not available for your account type.';
    }
  }

  /**
   * Validate payment operation with detailed error information
   */
  async validatePaymentOperation(
    userId: string, 
    operation: 'create_payment' | 'view_history' | 'manage_subscription',
    amount?: number
  ): Promise<PaymentPermissionCheck> {
    switch (operation) {
      case 'create_payment':
        if (amount === undefined) {
          return {
            allowed: false,
            reason: 'Payment amount is required',
          };
        }
        return this.canMakePayment(userId, amount);
      
      case 'view_history':
        return this.canViewPaymentHistory(userId);
      
      case 'manage_subscription':
        return this.canManageSubscriptions(userId);
      
      default:
        return {
          allowed: false,
          reason: 'Unknown payment operation',
        };
    }
  }
}

// Export singleton instance
export const paymentPermissionService = new PaymentPermissionService();

// Utility functions for common permission checks
export const checkPaymentAccess = (userId: string) => 
  paymentPermissionService.canAccessPaymentInterface(userId);

export const checkPaymentPermission = (userId: string, amount: number) => 
  paymentPermissionService.canMakePayment(userId, amount);

export const shouldShowPayments = (userId: string) => 
  paymentPermissionService.shouldShowPaymentInterface(userId);

export const getPaymentMessage = (userId: string) => 
  paymentPermissionService.getPaymentInterfaceMessage(userId);