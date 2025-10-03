import { supabase, supabaseAdmin } from './supabaseClient';

// Organization types based on the design document
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  subscription_tier: string;
  subscription_status: string;
  max_users: number;
  active_user_count: number;
  custom_domain?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  billing_email?: string;
  payment_method_id?: string;
  next_billing_date?: string;
}

export interface OrganizationSettings {
  branding: {
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
  };
  features: {
    customVirtueDefinitions: boolean;
    advancedReporting: boolean;
    ssoIntegration: boolean;
  };
  notifications: {
    inactivityAlerts: boolean;
    progressReports: boolean;
    adminDigest: boolean;
  };
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  billing_email?: string;
  settings?: Record<string, any>;
}

export interface UpdateOrganizationData {
  name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_domain?: string;
  settings?: Record<string, any>;
  billing_email?: string;
}

// Slug generation utility
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Validate organization data
export function validateOrganizationData(data: CreateOrganizationData): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Organization name is required');
  }

  if (data.name && data.name.length > 100) {
    errors.push('Organization name must be 100 characters or less');
  }

  if (data.billing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billing_email)) {
    errors.push('Invalid billing email format');
  }

  return errors;
}

// Check if slug is available
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      // No rows found - slug is available
      return true;
    }

    if (error) {
      throw error;
    }

    // Slug exists
    return false;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    throw new Error('Failed to check slug availability');
  }
}

// Generate unique slug
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 100) {
      throw new Error('Unable to generate unique slug');
    }
  }

  return slug;
}

// Create organization
export async function createOrganization(
  data: CreateOrganizationData,
  adminUserId: string
): Promise<Organization> {
  try {
    // Validate input data
    const validationErrors = validateOrganizationData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Generate unique slug if not provided
    const slug = data.slug || await generateUniqueSlug(data.name);

    // Verify slug is available
    if (!(await isSlugAvailable(slug))) {
      throw new Error('Organization slug is already taken');
    }

    // Default settings
    const defaultSettings: OrganizationSettings = {
      branding: {
        primaryColor: data.primary_color || '#5F4339',
        secondaryColor: data.secondary_color || '#A8A29E',
        logoUrl: data.logo_url,
        customDomain: undefined
      },
      features: {
        customVirtueDefinitions: false,
        advancedReporting: false,
        ssoIntegration: false
      },
      notifications: {
        inactivityAlerts: true,
        progressReports: true,
        adminDigest: true
      }
    };

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name.trim(),
        slug,
        logo_url: data.logo_url,
        primary_color: data.primary_color || '#5F4339',
        secondary_color: data.secondary_color || '#A8A29E',
        subscription_tier: 'basic',
        subscription_status: 'active',
        max_users: 40,
        active_user_count: 1, // Admin user
        settings: data.settings || defaultSettings,
        billing_email: data.billing_email
      })
      .select()
      .single();

    if (orgError) {
      throw orgError;
    }

    // Update admin user with organization and admin role
    const { error: userError } = await supabase
      .from('profiles')
      .update({
        organization_id: orgData.id,
        roles: ['admin']
      })
      .eq('id', adminUserId);

    if (userError) {
      // Rollback organization creation
      await supabase.from('organizations').delete().eq('id', orgData.id);
      throw userError;
    }

    return orgData;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

// Get organization by ID
export async function getOrganization(id: string): Promise<Organization | null> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
}

// Get organization by slug
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    throw error;
  }
}

// Update organization
export async function updateOrganization(
  id: string,
  data: UpdateOrganizationData
): Promise<Organization> {
  try {
    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Organization name cannot be empty');
      }
      if (data.name.length > 100) {
        throw new Error('Organization name must be 100 characters or less');
      }
    }

    // Validate billing email if provided
    if (data.billing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billing_email)) {
      throw new Error('Invalid billing email format');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are provided
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
    if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
    if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color;
    if (data.custom_domain !== undefined) updateData.custom_domain = data.custom_domain;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.billing_email !== undefined) updateData.billing_email = data.billing_email;

    const { data: orgData, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return orgData;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

// Delete organization (soft delete by deactivating)
export async function deleteOrganization(id: string): Promise<void> {
  try {
    // First, archive all users in the organization
    const { error: usersError } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        archived_at: new Date().toISOString()
      })
      .eq('organization_id', id);

    if (usersError) {
      throw usersError;
    }

    // Update organization status to inactive
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'cancelled',
        active_user_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (orgError) {
      throw orgError;
    }
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
}

// Update active user count
export async function updateActiveUserCount(organizationId: string): Promise<number> {
  try {
    // Count active users
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (countError) {
      throw countError;
    }

    const activeCount = count || 0;

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        active_user_count: activeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) {
      throw updateError;
    }

    return activeCount;
  } catch (error) {
    console.error('Error updating active user count:', error);
    throw error;
  }
}

// Validate user limit before adding new user
export async function validateUserLimit(organizationId: string): Promise<void> {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (organization.active_user_count >= organization.max_users) {
      throw new Error(`Organization has reached maximum user limit of ${organization.max_users}`);
    }
  } catch (error) {
    console.error('Error validating user limit:', error);
    throw error;
  }
}

// Get organization settings with type safety
export async function getOrganizationSettings(organizationId: string): Promise<OrganizationSettings> {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Return settings with defaults if not set
    const defaultSettings: OrganizationSettings = {
      branding: {
        primaryColor: organization.primary_color,
        secondaryColor: organization.secondary_color,
        logoUrl: organization.logo_url,
        customDomain: organization.custom_domain
      },
      features: {
        customVirtueDefinitions: false,
        advancedReporting: false,
        ssoIntegration: false
      },
      notifications: {
        inactivityAlerts: true,
        progressReports: true,
        adminDigest: true
      }
    };

    // Merge with stored settings
    return {
      ...defaultSettings,
      ...organization.settings
    };
  } catch (error) {
    console.error('Error getting organization settings:', error);
    throw error;
  }
}

// Update organization settings
export async function updateOrganizationSettings(
  organizationId: string,
  settings: Partial<OrganizationSettings>
): Promise<OrganizationSettings> {
  try {
    const currentSettings = await getOrganizationSettings(organizationId);
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      branding: {
        ...currentSettings.branding,
        ...settings.branding
      },
      features: {
        ...currentSettings.features,
        ...settings.features
      },
      notifications: {
        ...currentSettings.notifications,
        ...settings.notifications
      }
    };

    await updateOrganization(organizationId, {
      settings: updatedSettings,
      primary_color: updatedSettings.branding.primaryColor,
      secondary_color: updatedSettings.branding.secondaryColor,
      logo_url: updatedSettings.branding.logoUrl,
      custom_domain: updatedSettings.branding.customDomain
    });

    return updatedSettings;
  } catch (error) {
    console.error('Error updating organization settings:', error);
    throw error;
  }
}

// List organizations (admin function)
export async function listOrganizations(
  limit: number = 50,
  offset: number = 0
): Promise<Organization[]> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Admin client not available');
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error listing organizations:', error);
    throw error;
  }
}