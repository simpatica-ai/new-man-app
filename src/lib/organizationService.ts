import { supabase } from './supabaseClient';
import { isTestMode } from './testMode';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  phone_number: string | null;
  description: string | null;
  active_user_count: number;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  last_activity: string | null;
  current_virtue_id: number | null;
  current_stage: number | null;
  is_active: boolean;
  created_at: string;
  days_since_activity: number | null;
}

export interface ActivityOverview {
  totalMembers: number;
  activeMembers: number;
  recentlyActive: number;
  archivedMembers: number;
  engagementRate: number;
}

// Mock data for testing when organizational schema is not available
const mockOrganization: Organization = {
  id: 'demo-org-id',
  name: 'Demo Organization',
  slug: 'demo-org',
  logo_url: null,
  website_url: 'https://demo-org.com',
  phone_number: '+1 (555) 123-4567',
  description: 'A demonstration organization for testing the virtue development platform',
  active_user_count: 8,
  max_users: 40,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockMembers: OrganizationMember[] = [
  {
    id: 'user-1',
    email: 'admin@demo.com',
    full_name: 'Admin User',
    roles: ['admin', 'coach'],
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    current_virtue_id: 1,
    current_stage: 3,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    days_since_activity: 0
  },
  {
    id: 'user-2',
    email: 'coach@demo.com',
    full_name: 'Coach Smith',
    roles: ['coach'],
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    current_virtue_id: 2,
    current_stage: 2,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    days_since_activity: 1
  },
  {
    id: 'user-3',
    email: 'therapist@demo.com',
    full_name: 'Dr. Johnson',
    roles: ['therapist'],
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    current_virtue_id: 3,
    current_stage: 1,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    days_since_activity: 3
  },
  {
    id: 'user-4',
    email: 'practitioner1@demo.com',
    full_name: 'John Doe',
    roles: ['practitioner'],
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    current_virtue_id: 1,
    current_stage: 4,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    days_since_activity: 2
  },
  {
    id: 'user-5',
    email: 'practitioner2@demo.com',
    full_name: 'Jane Smith',
    roles: ['practitioner'],
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    current_virtue_id: 2,
    current_stage: 1,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    days_since_activity: 10
  },
  {
    id: 'user-6',
    email: 'archived@demo.com',
    full_name: 'Archived User',
    roles: ['practitioner'],
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
    current_virtue_id: 1,
    current_stage: 2,
    is_active: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    days_since_activity: 60
  }
];

/**
 * Check if organizational schema is available
 */
const hasOrganizationalSchema = async (): Promise<boolean> => {
  try {
    // Check if we're using the dev database (which has organizational schema)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isDevDatabase = supabaseUrl?.includes('plppvtugydanhmwffckh');
    
    if (isDevDatabase) {
      return true; // Dev database has organizational schema
    }
    
    // For other databases, try to query the organizations table
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Get the current user's organization
 */
export const getCurrentUserOrganization = async (): Promise<Organization | null> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Using mock organization data');
      return mockOrganization;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) return null;

    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single();

    return organization;
  } catch (error) {
    console.error('Error getting current user organization:', error);
    console.log('🧪 Falling back to mock organization data');
    return mockOrganization;
  }
};

/**
 * Get organization members with activity overview
 */
export const getOrganizationMembers = async (organizationId: string): Promise<OrganizationMember[]> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Using mock members data');
      return mockMembers;
    }

    const { data, error } = await supabase
      .rpc('get_organization_activity_overview', { org_id: organizationId });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting organization members:', error);
    console.log('🧪 Falling back to mock members data');
    return mockMembers;
  }
};

/**
 * Get organization activity overview statistics
 */
export const getOrganizationActivityOverview = async (organizationId: string): Promise<ActivityOverview> => {
  try {
    const members = await getOrganizationMembers(organizationId);
    
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.is_active).length;
    const archivedMembers = members.filter(m => !m.is_active).length;
    
    // Recently active = active in last 7 days
    const recentlyActive = members.filter(m => {
      if (!m.is_active || !m.days_since_activity) return false;
      return m.days_since_activity <= 7;
    }).length;

    const engagementRate = activeMembers > 0 ? (recentlyActive / activeMembers) * 100 : 0;

    return {
      totalMembers,
      activeMembers,
      recentlyActive,
      archivedMembers,
      engagementRate: Math.round(engagementRate)
    };
  } catch (error) {
    console.error('Error getting activity overview:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      recentlyActive: 0,
      archivedMembers: 0,
      engagementRate: 0
    };
  }
};

/**
 * Update organization contact information
 */
export const updateOrganizationInfo = async (
  organizationId: string, 
  updates: {
    website_url?: string;
    phone_number?: string;
    description?: string;
  }
): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock organization info update:', updates);
      return true;
    }

    const { data: result, error } = await supabase
      .rpc('update_organization_info', { 
        org_id: organizationId,
        website_url: updates.website_url || null,
        phone_number: updates.phone_number || null,
        description: updates.description || null
      });

    if (error) throw error;
    if (!result) throw new Error('Failed to update organization info');

    return true;
  } catch (error) {
    console.error('Error updating organization info:', error);
    return false;
  }
};

/**
 * Update organization logo
 */
export const updateOrganizationLogo = async (organizationId: string, logoFile: File): Promise<string | null> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock logo upload - would upload:', logoFile.name);
      // Return a mock URL
      return 'https://via.placeholder.com/200x100/5F4339/FFFFFF?text=Demo+Logo';
    }

    // Upload logo to Supabase storage
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${organizationId}/logo.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(fileName, logoFile, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(fileName);

    // Update organization with logo URL using the database function
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_organization_info', { 
        org_id: organizationId,
        logo_url: publicUrl
      });

    if (updateError) throw updateError;
    if (!updateResult) throw new Error('Failed to update organization logo');

    return publicUrl;
  } catch (error) {
    console.error('Error updating organization logo:', error);
    return null;
  }
};

/**
 * Archive (soft delete) a user
 */
export const archiveUser = async (userId: string): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock user archival for user:', userId);
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: result, error } = await supabase
      .rpc('archive_organization_user', { 
        user_id: userId,
        archive: true
      });

    if (error) throw error;
    if (!result) throw new Error('Failed to archive user');
    return true;
  } catch (error) {
    console.error('Error archiving user:', error);
    return false;
  }
};

/**
 * Reactivate an archived user
 */
export const reactivateUser = async (userId: string): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock user reactivation for user:', userId);
      return true;
    }

    const { data: result, error } = await supabase
      .rpc('archive_organization_user', { 
        user_id: userId,
        archive: false
      });

    if (error) throw error;
    if (!result) throw new Error('Failed to reactivate user');
    return true;
  } catch (error) {
    console.error('Error reactivating user:', error);
    return false;
  }
};

/**
 * Update user roles
 */
export const updateUserRoles = async (userId: string, roles: string[]): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock role update for user:', userId, 'roles:', roles);
      return true;
    }

    const { data: result, error } = await supabase
      .rpc('update_user_roles', { 
        user_id: userId,
        new_roles: roles
      });

    if (error) throw error;
    if (!result) throw new Error('Failed to update user roles');
    return true;
  } catch (error) {
    console.error('Error updating user roles:', error);
    return false;
  }
};

/**
 * Check if current user is admin of their organization
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock admin check - returning true for demo');
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    return profile?.roles?.includes('admin') || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    // Fallback to checking the old role field
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role === 'admin' || false;
    } catch (fallbackError) {
      console.error('Error in fallback admin check:', fallbackError);
      return false;
    }
  }
};

/**
 * Check if current user is organization therapist
 */
export const isCurrentUserTherapist = async (): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock therapist check - returning true for demo');
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    return profile?.roles?.includes('therapist') || false;
  } catch (error) {
    console.error('Error checking therapist status:', error);
    return false;
  }
};

/**
 * Check if current user is organization coach
 */
export const isCurrentUserCoach = async (): Promise<boolean> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock coach check - returning true for demo');
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    return profile?.roles?.includes('coach') || false;
  } catch (error) {
    console.error('Error checking coach status:', error);
    return false;
  }
};

/**
 * Validate organization user limit before adding new members
 */
export const validateUserLimit = async (organizationId: string): Promise<void> => {
  try {
    // Check if we should use mock data
    if (isTestMode() || !(await hasOrganizationalSchema())) {
      console.log('🧪 Mock user limit validation - allowing invitation');
      return; // Allow in test mode
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('max_users, active_user_count')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      throw new Error(`Failed to fetch organization: ${orgError.message}`);
    }

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if adding one more user would exceed the limit
    if (organization.active_user_count >= organization.max_users) {
      throw new Error(`Organization has reached its maximum user limit of ${organization.max_users} users`);
    }
  } catch (error) {
    console.error('Error validating user limit:', error);
    throw error;
  }
};

/**
 * Format time since last activity
 */
export const formatLastActivity = (lastActivity: string | null): string => {
  if (!lastActivity) return 'Never';
  
  const date = new Date(lastActivity);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

/**
 * Get role badge styling
 */
export const getRoleBadgeColor = (roles: string[]): string => {
  if (roles.includes('admin')) return 'bg-purple-100 text-purple-800';
  if (roles.includes('therapist')) return 'bg-blue-100 text-blue-800';
  if (roles.includes('coach')) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
};