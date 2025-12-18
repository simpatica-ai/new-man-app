import { supabase } from './supabaseClient';
import { UserRole, UserProfile, getOrganizationContext } from './rbacService';

export type UserType = 'individual' | 'organization_admin' | 'organization_member';

export interface PaymentPermissions {
  canMakePayments: boolean;
  canViewPaymentHistory: boolean;
  canManageSubscriptions: boolean;
}

export interface UserContext {
  userId: string;
  userType: UserType;
  organizationId?: string;
  organizationRole?: UserRole;
  paymentPermissions: PaymentPermissions;
  isActive: boolean;
}

// Cache for user contexts to optimize performance
const userContextCache = new Map<string, { context: UserContext; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class UserContextService {
  /**
   * Get comprehensive user context including payment permissions
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      // Check cache first
      const cached = userContextCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.context;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, roles, organization_id, is_active')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      // Get organization context if user has organization
      let organizationContext = null;
      if (profile.organization_id) {
        organizationContext = await getOrganizationContext(userId);
      }

      // Determine user type based on organization membership and role
      const userType = this.determineUserType(profile, organizationContext);

      // Calculate payment permissions based on user type and role
      const paymentPermissions = this.calculatePaymentPermissions(userType, profile.roles);

      const context: UserContext = {
        userId,
        userType,
        organizationId: profile.organization_id || undefined,
        organizationRole: organizationContext?.roles?.[0] || undefined,
        paymentPermissions,
        isActive: profile.is_active,
      };

      // Cache the result
      userContextCache.set(userId, {
        context,
        timestamp: Date.now(),
      });

      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Check if user is an individual practitioner (not part of organization)
   */
  async isIndividualPractitioner(userId: string): Promise<boolean> {
    const context = await this.getUserContext(userId);
    return context?.userType === 'individual';
  }

  /**
   * Check if user is an organization administrator
   */
  async isOrganizationAdmin(userId: string): Promise<boolean> {
    const context = await this.getUserContext(userId);
    return context?.userType === 'organization_admin';
  }

  /**
   * Check if user is an organization member (non-admin)
   */
  async isOrganizationMember(userId: string): Promise<boolean> {
    const context = await this.getUserContext(userId);
    return context?.userType === 'organization_member';
  }

  /**
   * Get organization ID for a user (if they belong to one)
   */
  async getOrganizationId(userId: string): Promise<string | null> {
    const context = await this.getUserContext(userId);
    return context?.organizationId || null;
  }

  /**
   * Check if user can make payments
   */
  async canMakePayments(userId: string): Promise<boolean> {
    const context = await this.getUserContext(userId);
    return context?.paymentPermissions.canMakePayments || false;
  }

  /**
   * Check if user can view payment history
   */
  async canViewPaymentHistory(userId: string): Promise<boolean> {
    const context = await this.getUserContext(userId);
    return context?.paymentPermissions.canViewPaymentHistory || false;
  }

  /**
   * Check if user can manage subscriptions
   */
  async canManageSubscriptions(userId: string): Promise<boolean> {
    const context = await this.getUserContext(userId);
    return context?.paymentPermissions.canManageSubscriptions || false;
  }

  /**
   * Clear cache for a specific user (useful when user context changes)
   */
  clearUserCache(userId: string): void {
    userContextCache.delete(userId);
  }

  /**
   * Clear all cached user contexts
   */
  clearAllCache(): void {
    userContextCache.clear();
  }

  /**
   * Determine user type based on profile and organization context
   */
  private determineUserType(
    profile: UserProfile, 
    organizationContext: any
  ): UserType {
    // If user has no organization, they are individual
    if (!profile.organization_id || !organizationContext) {
      return 'individual';
    }

    // Check if user has admin role in organization
    const roles = profile.roles || [];
    const organizationRoles = organizationContext.roles || [];
    
    const isAdmin = roles.includes('admin') || organizationRoles.includes('admin');
    
    if (isAdmin) {
      return 'organization_admin';
    }

    // Otherwise, they are a regular organization member
    return 'organization_member';
  }

  /**
   * Calculate payment permissions based on user type and roles
   */
  private calculatePaymentPermissions(
    userType: UserType, 
    roles: UserRole[]
  ): PaymentPermissions {
    switch (userType) {
      case 'individual':
        // Individual practitioners can make payments and manage their own subscriptions
        return {
          canMakePayments: true,
          canViewPaymentHistory: true,
          canManageSubscriptions: true,
        };

      case 'organization_admin':
        // Organization admins can make payments on behalf of organization
        return {
          canMakePayments: true,
          canViewPaymentHistory: true,
          canManageSubscriptions: true,
        };

      case 'organization_member':
        // Organization members cannot make payments (organization pays for them)
        return {
          canMakePayments: false,
          canViewPaymentHistory: false,
          canManageSubscriptions: false,
        };

      default:
        // Default to no permissions
        return {
          canMakePayments: false,
          canViewPaymentHistory: false,
          canManageSubscriptions: false,
        };
    }
  }

  /**
   * Refresh user context (clears cache and fetches fresh data)
   */
  async refreshUserContext(userId: string): Promise<UserContext | null> {
    this.clearUserCache(userId);
    return this.getUserContext(userId);
  }

  /**
   * Batch get user contexts for multiple users (useful for admin interfaces)
   */
  async getBatchUserContexts(userIds: string[]): Promise<Map<string, UserContext | null>> {
    const results = new Map<string, UserContext | null>();
    
    // Process in parallel but limit concurrency to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (userId) => {
        const context = await this.getUserContext(userId);
        return { userId, context };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ userId, context }) => {
        results.set(userId, context);
      });
    }
    
    return results;
  }
}

// Export singleton instance
export const userContextService = new UserContextService();