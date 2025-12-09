import { supabase } from './supabaseClient';

// Role definitions
export type UserRole = 'admin' | 'therapist' | 'coach' | 'practitioner';

export interface UserProfile {
  id: string;
  full_name: string | null;
  roles: UserRole[];
  organization_id: string | null;
  is_active: boolean;
  last_activity: string | null;
  current_virtue_id: number | null;
  current_stage: number | null;
}

export interface OrganizationContext {
  organizationId: string;
  userId: string;
  roles: UserRole[];
  isActive: boolean;
}

// Permission definitions
export interface Permission {
  resource: string;
  action: string;
  condition?: (context: OrganizationContext, resourceId?: string) => Promise<boolean>;
}

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Organization management
    { resource: 'organization', action: 'read' },
    { resource: 'organization', action: 'update' },
    { resource: 'organization', action: 'delete' },
    { resource: 'organization', action: 'manage_settings' },
    
    // User management
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'invite' },
    { resource: 'users', action: 'archive' },
    { resource: 'users', action: 'reactivate' },
    { resource: 'users', action: 'assign_roles' },
    { resource: 'users', action: 'manage_assignments' },
    
    // Practitioner data (full access)
    { resource: 'practitioner_data', action: 'read' },
    { resource: 'practitioner_data', action: 'write' },
    
    // Reports and analytics
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'generate' },
    { resource: 'analytics', action: 'read' },
    
    // Billing and subscription
    { resource: 'billing', action: 'read' },
    { resource: 'billing', action: 'manage' }
  ],
  
  therapist: [
    // Assigned practitioner data (full access)
    { 
      resource: 'practitioner_data', 
      action: 'read',
      condition: async (context, practitionerId) => 
        practitionerId ? await isAssignedPractitioner(context.userId, practitionerId, 'therapist') : true
    },
    { 
      resource: 'practitioner_data', 
      action: 'write',
      condition: async (context, practitionerId) => 
        practitionerId ? await isAssignedPractitioner(context.userId, practitionerId, 'therapist') : true
    },
    
    // Clinical notes and observations
    { resource: 'clinical_notes', action: 'read' },
    { resource: 'clinical_notes', action: 'write' },
    
    // Reports for assigned practitioners
    { 
      resource: 'reports', 
      action: 'read',
      condition: async (context, practitionerId) => 
        practitionerId ? await isAssignedPractitioner(context.userId, practitionerId, 'therapist') : true
    },
    { 
      resource: 'reports', 
      action: 'generate',
      condition: async (context, practitionerId) => 
        practitionerId ? await isAssignedPractitioner(context.userId, practitionerId, 'therapist') : true
    },
    
    // Collaboration with coaches
    { resource: 'coach_collaboration', action: 'read' },
    { resource: 'coach_collaboration', action: 'write' }
  ],
  
  coach: [
    // Assigned practitioner data (limited access)
    { 
      resource: 'practitioner_data', 
      action: 'read',
      condition: async (context, practitionerId) => 
        practitionerId ? await isAssignedPractitioner(context.userId, practitionerId, 'coach') : true
    },
    
    // Guidance and messaging
    { resource: 'practitioner_guidance', action: 'read' },
    { resource: 'practitioner_guidance', action: 'write' },
    { resource: 'practitioner_messages', action: 'read' },
    { resource: 'practitioner_messages', action: 'write' },
    
    // Progress tracking
    { resource: 'progress_tracking', action: 'read' },
    
    // Reports for assigned practitioners
    { 
      resource: 'reports', 
      action: 'read',
      condition: async (context, practitionerId) => 
        practitionerId ? await isAssignedPractitioner(context.userId, practitionerId, 'coach') : true
    },
    
    // Collaboration with therapists
    { resource: 'therapist_collaboration', action: 'read' }
  ],
  
  practitioner: [
    // Own data only
    { 
      resource: 'practitioner_data', 
      action: 'read',
      condition: async (context, practitionerId) => 
        practitionerId === context.userId
    },
    { 
      resource: 'practitioner_data', 
      action: 'write',
      condition: async (context, practitionerId) => 
        practitionerId === context.userId
    },
    
    // Virtue development tools
    { resource: 'virtue_tools', action: 'read' },
    { resource: 'virtue_tools', action: 'use' },
    
    // Journal and assessments
    { resource: 'journal', action: 'read' },
    { resource: 'journal', action: 'write' },
    { resource: 'assessments', action: 'take' },
    
    // Communication with supervisors
    { resource: 'supervisor_communication', action: 'read' },
    { resource: 'supervisor_communication', action: 'write' },
    
    // Own progress reports
    { 
      resource: 'reports', 
      action: 'read',
      condition: async (context, practitionerId) => 
        practitionerId === context.userId
    }
  ]
};

// Cache for practitioner assignments to avoid repeated database calls
const assignmentCache = new Map<string, { practitionerId: string; supervisorRole: string; timestamp: number }[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if a user is assigned to a practitioner
async function isAssignedPractitioner(
  supervisorId: string, 
  practitionerId: string, 
  role: 'coach' | 'therapist'
): Promise<boolean> {
  try {
    const cacheKey = `${supervisorId}-${role}`;
    const cached = assignmentCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached[0]?.timestamp < CACHE_DURATION) {
      return cached.some(assignment => assignment.practitionerId === practitionerId);
    }
    
    // Query database - Note: This table will be created in migration
    // For now, return false until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return false;
    
    // TODO: Uncomment after migration
    // const { data, error } = await supabase
    //   .from('practitioner_assignments')
    //   .select('practitioner_id')
    //   .eq('supervisor_id', supervisorId)
    //   .eq('supervisor_role', role)
    //   .eq('active', true);
    
    // TODO: Uncomment after migration
    // if (error) {
    //   console.error('Error checking practitioner assignment:', error);
    //   return false;
    // }
    // 
    // // Update cache
    // const assignments = data?.map(d => ({
    //   practitionerId: d.practitioner_id,
    //   supervisorRole: role,
    //   timestamp: Date.now()
    // })) || [];
    // assignmentCache.set(cacheKey, assignments);
    // 
    // return assignments.some(assignment => assignment.practitionerId === practitionerId);
  } catch (error) {
    console.error('Error in isAssignedPractitioner:', error);
    return false;
  }
}

// Get user profile with roles and organization context
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Note: These fields will be added in migration
  const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role
      `)
      .eq('id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return null;
    }
    
    if (error) {
      throw error;
    }
    
    // TODO: Update after migration to use new fields
    return {
      ...data,
      roles: data.role ? [data.role as UserRole] : ['practitioner'],
      organization_id: null, // Will be populated after migration
      is_active: true, // Will be populated after migration
      last_activity: null, // Will be populated after migration
      current_virtue_id: null, // Will be populated after migration
      current_stage: null // Will be populated after migration
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Get organization context for a user
export async function getOrganizationContext(userId: string): Promise<OrganizationContext | null> {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile || !profile.organization_id) {
      return null;
    }
    
    return {
      organizationId: profile.organization_id,
      userId: profile.id,
      roles: profile.roles,
      isActive: profile.is_active
    };
  } catch (error) {
    console.error('Error getting organization context:', error);
    throw error;
  }
}

// Check if user has permission for a specific action
export async function hasPermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  try {
    const context = await getOrganizationContext(userId);
    
    if (!context || !context.isActive) {
      return false;
    }
    
    // Check permissions for each role the user has
    for (const role of context.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      
      for (const permission of rolePermissions) {
        if (permission.resource === resource && permission.action === action) {
          // If there's a condition, check it
          if (permission.condition) {
            const conditionResult = await permission.condition(context, resourceId);
            if (conditionResult) {
              return true;
            }
          } else {
            // No condition means permission is granted
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// Check multiple permissions at once
export async function hasPermissions(
  userId: string,
  permissions: { resource: string; action: string; resourceId?: string }[]
): Promise<boolean[]> {
  try {
    const results = await Promise.all(
      permissions.map(p => hasPermission(userId, p.resource, p.action, p.resourceId))
    );
    return results;
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return permissions.map(() => false);
  }
}

// Require permission (throws error if not authorized)
export async function requirePermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<void> {
  const allowed = await hasPermission(userId, resource, action, resourceId);
  
  if (!allowed) {
    throw new Error(`Access denied: insufficient permissions for ${action} on ${resource}`);
  }
}

// Get user's effective permissions (all permissions from all roles)
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const context = await getOrganizationContext(userId);
    
    if (!context || !context.isActive) {
      return [];
    }
    
    const allPermissions: Permission[] = [];
    
    for (const role of context.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      allPermissions.push(...rolePermissions);
    }
    
    // Remove duplicates based on resource and action
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => 
        p.resource === permission.resource && p.action === permission.action
      )
    );
    
    return uniquePermissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

// Assign role to user
export async function assignRole(
  userId: string,
  role: UserRole,
  assignedBy: string
): Promise<void> {
  try {
    // Check if assigner has permission
    await requirePermission(assignedBy, 'users', 'assign_roles');
    
    // Get current user profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User not found');
    }
    
    // Add role if not already present
    const currentRoles = profile.roles || [];
    if (!currentRoles.includes(role)) {
      const updatedRoles = [...currentRoles, role];
      
      // TODO: Update after migration to use roles array
      const { error } = await supabase
        .from('profiles')
        .update({ role: updatedRoles[0] }) // Temporary: use single role field
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Clear assignment cache for this user
      assignmentCache.clear();
    }
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
}

// Remove role from user
export async function removeRole(
  userId: string,
  role: UserRole,
  removedBy: string
): Promise<void> {
  try {
    // Check if remover has permission
    await requirePermission(removedBy, 'users', 'assign_roles');
    
    // Get current user profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User not found');
    }
    
    // Remove role if present
    const currentRoles = profile.roles || [];
    if (currentRoles.includes(role)) {
      const updatedRoles = currentRoles.filter(r => r !== role);
      
      // Ensure user always has at least practitioner role
      if (updatedRoles.length === 0) {
        updatedRoles.push('practitioner');
      }
      
      // TODO: Update after migration to use roles array
      const { error } = await supabase
        .from('profiles')
        .update({ role: updatedRoles[0] }) // Temporary: use single role field
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Clear assignment cache for this user
      assignmentCache.clear();
    }
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
}

// Validate organization context for data access
export async function validateOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const context = await getOrganizationContext(userId);
    
    if (!context || !context.isActive) {
      return false;
    }
    
    return context.organizationId === organizationId;
  } catch (error) {
    console.error('Error validating organization access:', error);
    return false;
  }
}

// Middleware function for API route protection
export function createRBACMiddleware(
  resource: string,
  action: string,
  getResourceId?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: () => void) => {
    try {
      // Get user ID from request (assuming it's set by auth middleware)
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get resource ID if function provided
      const resourceId = getResourceId ? getResourceId(req) : undefined;
      
      // Check permission
      const allowed = await hasPermission(userId, resource, action, resourceId);
      
      if (!allowed) {
        return res.status(403).json({ 
          error: 'Access denied: insufficient permissions',
          required: { resource, action }
        });
      }
      
      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Role switching for multi-role users
export interface RoleContext {
  activeRole: UserRole;
  availableRoles: UserRole[];
  organizationId: string;
}

export async function getRoleContext(userId: string): Promise<RoleContext | null> {
  try {
    const context = await getOrganizationContext(userId);
    
    if (!context || !context.isActive) {
      return null;
    }
    
    return {
      activeRole: context.roles[0] || 'practitioner', // Default to first role
      availableRoles: context.roles,
      organizationId: context.organizationId
    };
  } catch (error) {
    console.error('Error getting role context:', error);
    return null;
  }
}

// Clear permission caches (useful for testing or when assignments change)
export function clearPermissionCaches(): void {
  assignmentCache.clear();
}