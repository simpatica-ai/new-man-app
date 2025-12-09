import React, { useState, useEffect, useCallback } from 'react';
import { 
  hasPermission, 
  hasPermissions, 
  getUserPermissions,
  getOrganizationContext,
  type Permission,
  type OrganizationContext,
  type UserRole
} from '@/lib/rbacService';

// Hook for checking a single permission
export function usePermission(
  userId: string | null,
  resource: string,
  action: string,
  resourceId?: string
) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const checkPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allowed = await hasPermission(userId, resource, action, resourceId);
        setHasAccess(allowed);
      } catch (err) {
        console.error('Error checking permission:', err);
        setError(err instanceof Error ? err.message : 'Permission check failed');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [userId, resource, action, resourceId]);

  return { hasAccess, loading, error };
}

// Hook for checking multiple permissions
export function usePermissions(
  userId: string | null,
  permissions: { resource: string; action: string; resourceId?: string }[]
) {
  const [results, setResults] = useState<boolean[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || permissions.length === 0) {
      setResults(permissions.map(() => false));
      setLoading(false);
      return;
    }

    const checkPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await hasPermissions(userId, permissions);
        setResults(results);
      } catch (err) {
        console.error('Error checking permissions:', err);
        setError(err instanceof Error ? err.message : 'Permissions check failed');
        setResults(permissions.map(() => false));
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [userId, JSON.stringify(permissions)]);

  return { results, loading, error };
}

// Hook for getting user's organization context and roles
export function useOrganizationContext(userId: string | null) {
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshContext = useCallback(async () => {
    if (!userId) {
      setContext(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const orgContext = await getOrganizationContext(userId);
      setContext(orgContext);
    } catch (err) {
      console.error('Error getting organization context:', err);
      setError(err instanceof Error ? err.message : 'Failed to get organization context');
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  return { context, loading, error, refreshContext };
}

// Hook for getting all user permissions
export function useUserPermissions(userId: string | null) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userPermissions = await getUserPermissions(userId);
        setPermissions(userPermissions);
      } catch (err) {
        console.error('Error loading user permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [userId]);

  return { permissions, loading, error };
}

// Hook for role-based conditional rendering
export function useRoleAccess(userId: string | null, allowedRoles: UserRole[]) {
  const { context, loading, error } = useOrganizationContext(userId);
  
  const hasRoleAccess = context?.roles.some(role => allowedRoles.includes(role)) ?? false;
  
  return { hasRoleAccess, loading, error, userRoles: context?.roles || [] };
}

// Hook for checking if user can access specific practitioner data
export function usePractitionerAccess(
  userId: string | null, 
  practitionerId: string | null
) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<'self' | 'supervisor' | 'admin' | 'none'>('none');

  useEffect(() => {
    if (!userId || !practitionerId) {
      setHasAccess(false);
      setAccessType('none');
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if it's the user's own data
        if (userId === practitionerId) {
          setHasAccess(true);
          setAccessType('self');
          return;
        }
        
        // Check if user has admin access
        const adminAccess = await hasPermission(userId, 'practitioner_data', 'read');
        if (adminAccess) {
          setHasAccess(true);
          setAccessType('admin');
          return;
        }
        
        // Check if user has supervisor access to this specific practitioner
        const supervisorAccess = await hasPermission(
          userId, 
          'practitioner_data', 
          'read', 
          practitionerId
        );
        
        if (supervisorAccess) {
          setHasAccess(true);
          setAccessType('supervisor');
        } else {
          setHasAccess(false);
          setAccessType('none');
        }
      } catch (err) {
        console.error('Error checking practitioner access:', err);
        setError(err instanceof Error ? err.message : 'Access check failed');
        setHasAccess(false);
        setAccessType('none');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [userId, practitionerId]);

  return { hasAccess, accessType, loading, error };
}

// Hook for organization-scoped data access
export function useOrganizationAccess(
  userId: string | null,
  requiredOrganizationId: string | null
) {
  const { context, loading, error } = useOrganizationContext(userId);
  
  const hasAccess = context?.organizationId === requiredOrganizationId && context?.isActive;
  
  return { hasAccess, loading, error, organizationId: context?.organizationId };
}

// Utility hook for permission-based component rendering
export function usePermissionGuard(
  userId: string | null,
  resource: string,
  action: string,
  resourceId?: string
) {
  const { hasAccess, loading, error } = usePermission(userId, resource, action, resourceId);
  
  // Component wrapper that only renders children if permission is granted
  const PermissionGuard = ({ children, fallback = null }: { 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
  }) => {
    if (loading) {
      return React.createElement('div', { className: 'animate-pulse bg-gray-200 h-4 w-16 rounded' });
    }
    
    if (error) {
      return React.createElement('div', { className: 'text-red-500 text-sm' }, 'Permission error');
    }
    
    return hasAccess ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback);
  };
  
  return { hasAccess, loading, error, PermissionGuard };
}