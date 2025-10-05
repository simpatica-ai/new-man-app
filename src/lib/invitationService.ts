import { supabase, supabaseAdmin } from './supabaseClient';
import { validateUserLimit } from './organizationService';
import crypto from 'crypto';

// Organization invitation types
export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  roles: string[];
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface CreateInvitationData {
  organizationId: string;
  email: string;
  roles: string[];
  invitedBy: string;
  // FUTURE: Multi-app support
  // appPermissions?: Record<string, string[]>; // { "new-man-app": ["basic"], "therapy-app": ["premium"] }
  // specificApps?: string[]; // Invite to specific apps only
}

export interface InvitationWithOrganization extends OrganizationInvitation {
  organization: {
    id: string;
    name: string;
    slug: string;
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
  };
  inviter: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

// Generate secure invitation token
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate invitation data
export function validateInvitationData(data: CreateInvitationData): string[] {
  const errors: string[] = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.roles || data.roles.length === 0) {
    errors.push('At least one role must be specified');
  }

  const validRoles = ['admin', 'coach', 'therapist', 'practitioner'];
  const invalidRoles = data.roles.filter(role => !validRoles.includes(role));
  if (invalidRoles.length > 0) {
    errors.push(`Invalid roles: ${invalidRoles.join(', ')}`);
  }

  if (!data.organizationId) {
    errors.push('Organization ID is required');
  }

  if (!data.invitedBy) {
    errors.push('Inviter ID is required');
  }

  return errors;
}

// Create organization invitation
export async function createInvitation(data: CreateInvitationData): Promise<OrganizationInvitation> {
  try {
    // Validate input data
    const validationErrors = validateInvitationData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if user is already in the organization
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('id', data.email) // This should be email lookup, but we need auth.users
      .single();

    // Check via auth.users for email
    if (!supabaseAdmin) {
      throw new Error('Admin client not available');
    }

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(data.email);
    
    if (authUser.user) {
      // Check if user is already in this organization
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', authUser.user.id)
        .single();

      if (userProfile?.organization_id === data.organizationId) {
        throw new Error('User is already a member of this organization');
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', data.organizationId)
      .eq('email', data.email.toLowerCase())
      .is('accepted_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      throw new Error('A pending invitation already exists for this email');
    }

    // Validate organization user limit
    await validateUserLimit(data.organizationId);

    // Generate invitation token and expiration (7 days)
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: data.organizationId,
        email: data.email.toLowerCase(),
        roles: data.roles,
        invited_by: data.invitedBy,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return invitation;
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
}

// Get invitation by token
export async function getInvitationByToken(token: string): Promise<InvitationWithOrganization | null> {
  try {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organizations!inner(
          id,
          name,
          slug,
          primary_color,
          secondary_color,
          logo_url
        ),
        profiles!organization_invitations_invited_by_fkey(
          id,
          full_name
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) {
      throw error;
    }

    return {
      ...data,
      organization: data.organizations,
      inviter: data.profiles
    };
  } catch (error) {
    console.error('Error fetching invitation by token:', error);
    throw error;
  }
}

// Accept invitation
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<void> {
  try {
    // Use database function to handle invitation acceptance atomically
    const { data, error } = await supabase.rpc('accept_organization_invitation', {
      invitation_token: token,
      user_id: userId
    });

    if (error) {
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to accept invitation');
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

// List organization invitations
export async function getOrganizationInvitations(
  organizationId: string,
  includeExpired: boolean = false
): Promise<OrganizationInvitation[]> {
  try {
    let query = supabase
      .from('organization_invitations')
      .select(`
        *,
        profiles!organization_invitations_invited_by_fkey(
          full_name
        )
      `)
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.gte('expires_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    throw error;
  }
}

// Resend invitation
export async function resendInvitation(invitationId: string): Promise<OrganizationInvitation> {
  try {
    // Extend expiration by 7 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('organization_invitations')
      .update({
        expires_at: newExpiresAt.toISOString()
      })
      .eq('id', invitationId)
      .is('accepted_at', null)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw error;
  }
}

// Cancel invitation
export async function cancelInvitation(invitationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)
      .is('accepted_at', null);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error canceling invitation:', error);
    throw error;
  }
}

// Get invitation status
export async function getInvitationStatus(token: string): Promise<{
  status: 'valid' | 'expired' | 'accepted' | 'invalid';
  invitation?: InvitationWithOrganization;
}> {
  try {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organizations!inner(
          id,
          name,
          slug,
          primary_color,
          secondary_color,
          logo_url
        ),
        profiles!organization_invitations_invited_by_fkey(
          id,
          full_name
        )
      `)
      .eq('token', token)
      .single();

    if (error && error.code === 'PGRST116') {
      return { status: 'invalid' };
    }

    if (error) {
      throw error;
    }

    if (data.accepted_at) {
      return { status: 'accepted' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { status: 'expired' };
    }

    return {
      status: 'valid',
      invitation: {
        ...data,
        organization: data.organizations,
        inviter: data.profiles
      }
    };
  } catch (error) {
    console.error('Error checking invitation status:', error);
    return { status: 'invalid' };
  }
}