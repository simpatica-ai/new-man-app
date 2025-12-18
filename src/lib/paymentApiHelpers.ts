import { paymentPermissionService } from './paymentPermissions';
import { userContextService } from './userContextService';

/**
 * Helper functions for payment API integration
 */

export interface PaymentApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  userType?: string;
  organizationId?: string;
}

/**
 * Middleware helper for payment API routes
 */
export async function validatePaymentApiAccess(
  userId: string,
  operation: 'create_payment' | 'view_history' | 'manage_subscription',
  amount?: number
): Promise<PaymentApiResponse> {
  try {
    // Get user context
    const userContext = await userContextService.getUserContext(userId);
    if (!userContext) {
      return {
        success: false,
        error: 'User not found or invalid session',
      };
    }

    // Check if user is active
    if (!userContext.isActive) {
      return {
        success: false,
        error: 'User account is inactive',
        userType: userContext.userType,
      };
    }

    // Validate specific operation
    const permissionCheck = await paymentPermissionService.validatePaymentOperation(
      userId,
      operation,
      amount
    );

    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.reason || 'Operation not allowed',
        userType: permissionCheck.userType,
        organizationId: permissionCheck.organizationId,
      };
    }

    return {
      success: true,
      data: {
        userContext,
        permissionCheck,
      },
      userType: userContext.userType,
      organizationId: userContext.organizationId,
    };
  } catch (error) {
    console.error('Error validating payment API access:', error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Get user ID from request (placeholder - implement based on your auth system)
 */
export function getUserIdFromRequest(request: Request): string | null {
  // TODO: Implement based on your authentication system
  // This could extract from JWT token, session, etc.
  
  // For now, return a placeholder
  // In a real implementation, you would:
  // 1. Extract auth token from Authorization header
  // 2. Verify and decode the token
  // 3. Return the user ID from the token payload
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  // Placeholder implementation
  console.warn('getUserIdFromRequest: Using placeholder implementation');
  return 'placeholder-user-id';
}

/**
 * Create standardized API error response
 */
export function createPaymentApiError(
  message: string,
  statusCode: number = 400,
  userType?: string,
  organizationId?: string
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      userType,
      organizationId,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create standardized API success response
 */
export function createPaymentApiSuccess<T>(
  data: T,
  userType?: string,
  organizationId?: string
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      userType,
      organizationId,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Wrapper for payment API routes with automatic permission checking
 */
export function withPaymentPermissions(
  operation: 'create_payment' | 'view_history' | 'manage_subscription'
) {
  return function (
    handler: (
      request: Request,
      context: {
        userId: string;
        userType: string;
        organizationId?: string;
      }
    ) => Promise<Response>
  ) {
    return async function (request: Request): Promise<Response> {
      try {
        // Extract user ID from request
        const userId = getUserIdFromRequest(request);
        if (!userId) {
          return createPaymentApiError('Authentication required', 401);
        }

        // Get amount from request body if needed for payment creation
        let amount: number | undefined;
        if (operation === 'create_payment') {
          try {
            const body = await request.json();
            amount = body.amount;
          } catch {
            return createPaymentApiError('Invalid request body', 400);
          }
        }

        // Validate permissions
        const validation = await validatePaymentApiAccess(userId, operation, amount);
        if (!validation.success) {
          return createPaymentApiError(
            validation.error || 'Permission denied',
            403,
            validation.userType,
            validation.organizationId
          );
        }

        // Call the actual handler with validated context
        return handler(request, {
          userId,
          userType: validation.userType!,
          organizationId: validation.organizationId,
        });
      } catch (error) {
        console.error('Payment API wrapper error:', error);
        return createPaymentApiError('Internal server error', 500);
      }
    };
  };
}

/**
 * Helper to get payment context for UI components
 */
export async function getPaymentUIContext(userId: string) {
  try {
    const context = await paymentPermissionService.getPaymentContext(userId);
    
    return {
      userContext: context.userContext,
      permissions: context.permissions,
      shouldShowInterface: context.permissions.canAccessInterface.allowed,
      message: await paymentPermissionService.getPaymentInterfaceMessage(userId),
    };
  } catch (error) {
    console.error('Error getting payment UI context:', error);
    return {
      userContext: null,
      permissions: null,
      shouldShowInterface: false,
      message: 'Error loading payment interface',
    };
  }
}