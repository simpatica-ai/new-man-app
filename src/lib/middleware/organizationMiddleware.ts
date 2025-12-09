import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  validateOrganizationAccess, 
  hasPermission, 
  getOrganizationContext 
} from '@/lib/rbacService';

export interface OrganizationRequest extends NextRequest {
  user?: {
    id: string;
    email?: string;
  };
  organizationId?: string;
  userRoles?: string[];
}

// Middleware to validate organization context and user permissions
export function withOrganizationAuth(
  handler: (req: OrganizationRequest) => Promise<NextResponse>,
  options: {
    requireOrganization?: boolean;
    requiredPermission?: {
      resource: string;
      action: string;
    };
  } = {}
) {
  return async (req: OrganizationRequest) => {
    try {
      // TODO: Implement proper auth token extraction from request headers
      // For now, this is a placeholder implementation
      
      // Get authenticated user - this would need to be implemented based on your auth system
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Placeholder user extraction - implement based on your JWT/session handling
      const user = { id: 'placeholder-user-id', email: 'user@example.com' };
      const authError = null;
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Add user to request
      req.user = {
        id: user.id,
        email: user.email
      };
      
      // Get organization context
      const context = await getOrganizationContext(user.id);
      
      // Check if organization is required
      if (options.requireOrganization && !context) {
        return NextResponse.json(
          { error: 'Organization membership required' },
          { status: 403 }
        );
      }
      
      // Add organization context to request
      if (context) {
        req.organizationId = context.organizationId;
        req.userRoles = context.roles;
        
        // Check if user is active
        if (!context.isActive) {
          return NextResponse.json(
            { error: 'Account is inactive' },
            { status: 403 }
          );
        }
      }
      
      // Check required permission if specified
      if (options.requiredPermission && context) {
        const hasAccess = await hasPermission(
          user.id,
          options.requiredPermission.resource,
          options.requiredPermission.action
        );
        
        if (!hasAccess) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              required: options.requiredPermission
            },
            { status: 403 }
          );
        }
      }
      
      // Call the actual handler
      return await handler(req);
      
    } catch (error) {
      console.error('Organization middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Middleware specifically for organization-scoped data access
export function withOrganizationScope(
  handler: (req: OrganizationRequest) => Promise<NextResponse>
) {
  return withOrganizationAuth(handler, {
    requireOrganization: true
  });
}

// Middleware for admin-only endpoints
export function withAdminAuth(
  handler: (req: OrganizationRequest) => Promise<NextResponse>
) {
  return withOrganizationAuth(handler, {
    requireOrganization: true,
    requiredPermission: {
      resource: 'organization',
      action: 'read'
    }
  });
}

// Middleware for user management endpoints
export function withUserManagementAuth(
  handler: (req: OrganizationRequest) => Promise<NextResponse>
) {
  return withOrganizationAuth(handler, {
    requireOrganization: true,
    requiredPermission: {
      resource: 'users',
      action: 'read'
    }
  });
}

// Middleware for practitioner data access with resource-specific validation
export function withPractitionerDataAuth(
  handler: (req: OrganizationRequest) => Promise<NextResponse>,
  getPractitionerId: (req: OrganizationRequest) => string | undefined
) {
  return async (req: OrganizationRequest) => {
    try {
      // First apply basic organization auth
      const basicAuthResult = await withOrganizationAuth(
        async (authReq) => {
          // Get practitioner ID from request
          const practitionerId = getPractitionerId(authReq);
          
          if (!practitionerId) {
            return NextResponse.json(
              { error: 'Practitioner ID required' },
              { status: 400 }
            );
          }
          
          // Check if user has access to this specific practitioner's data
          const hasAccess = await hasPermission(
            authReq.user!.id,
            'practitioner_data',
            'read',
            practitionerId
          );
          
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Access denied to practitioner data' },
              { status: 403 }
            );
          }
          
          // Call the actual handler
          return await handler(authReq);
        },
        { requireOrganization: true }
      )(req);
      
      return basicAuthResult;
      
    } catch (error) {
      console.error('Practitioner data auth error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Utility function to extract organization ID from request path
export function getOrganizationIdFromPath(req: NextRequest): string | undefined {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  
  // Look for organization ID in common patterns
  const orgIndex = pathSegments.findIndex(segment => 
    segment === 'organizations' || segment === 'org'
  );
  
  if (orgIndex !== -1 && pathSegments[orgIndex + 1]) {
    return pathSegments[orgIndex + 1];
  }
  
  return undefined;
}

// Utility function to extract practitioner ID from request path
export function getPractitionerIdFromPath(req: NextRequest): string | undefined {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  
  // Look for practitioner ID in common patterns
  const practitionerIndex = pathSegments.findIndex(segment => 
    segment === 'practitioners' || segment === 'users'
  );
  
  if (practitionerIndex !== -1 && pathSegments[practitionerIndex + 1]) {
    return pathSegments[practitionerIndex + 1];
  }
  
  return undefined;
}

// Utility function to extract practitioner ID from request body
export async function getPractitionerIdFromBody(req: NextRequest): Promise<string | undefined> {
  try {
    const body = await req.json();
    return body.practitionerId || body.userId || body.user_id;
  } catch {
    return undefined;
  }
}

// Utility function to validate organization membership for a specific user
export async function validateUserOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    return await validateOrganizationAccess(userId, organizationId);
  } catch (error) {
    console.error('Error validating organization membership:', error);
    return false;
  }
}

// Rate limiting middleware for organization endpoints
export function withRateLimit(
  handler: (req: OrganizationRequest) => Promise<NextResponse>,
  options: {
    maxRequests: number;
    windowMs: number;
  } = { maxRequests: 100, windowMs: 60000 }
) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return async (req: OrganizationRequest) => {
    const clientId = req.user?.id || req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
    
    // Check current request count
    const current = requestCounts.get(clientId);
    
    if (current && current.count >= options.maxRequests) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      );
    }
    
    // Update request count
    if (current) {
      current.count++;
    } else {
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + options.windowMs
      });
    }
    
    return await handler(req);
  };
}