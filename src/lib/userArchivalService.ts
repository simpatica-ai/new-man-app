import { supabase } from './supabaseClient';
import { updateActiveUserCount } from './organizationService';

// User archival types
export interface ArchivedUser {
  id: string;
  full_name: string | null;
  email: string;
  roles: string[];
  organization_id: string | null;
  is_active: boolean;
  archived_at: string | null;
  archived_by: string | null;
  last_activity: string | null;
  current_virtue_id: number | null;
  current_stage: number | null;
}

export interface UserActivity {
  userId: string;
  organizationId: string;
  isActive: boolean;
  archivedAt?: Date;
  archivedBy?: string;
  lastLogin: Date;
  currentVirtue: {
    id: number;
    name: string;
    stage: number;
    stageStarted: Date;
  } | null;
  recentActivity: {
    journalEntries: number;
    assessmentsCompleted: number;
    stagesCompleted: number;
    lastActivity: Date;
  };
  engagementScore: number; // 0-100 based on activity patterns
}

// Archive user (soft delete)
export async function archiveUser(
  userId: string,
  archivedBy: string,
  organizationId?: string
): Promise<void> {
  try {
    // Get user's current organization if not provided
    if (!organizationId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      organizationId = profile.organization_id;
    }

    // Archive the user
    const { error: archiveError } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq('id', userId);

    if (archiveError) {
      throw archiveError;
    }

    // Update organization active user count
    if (organizationId) {
      await updateActiveUserCount(organizationId);
    }

    console.log(`User ${userId} archived successfully by ${archivedBy}`);
  } catch (error) {
    console.error('Error archiving user:', error);
    throw error;
  }
}

// Reactivate user
export async function reactivateUser(
  userId: string,
  organizationId?: string
): Promise<void> {
  try {
    // Get user's current organization if not provided
    if (!organizationId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      organizationId = profile.organization_id;
    }

    // Check organization user limit before reactivating
    if (organizationId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('active_user_count, max_users')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        throw orgError;
      }

      if (org.active_user_count >= org.max_users) {
        throw new Error(`Cannot reactivate user: organization has reached maximum user limit of ${org.max_users}`);
      }
    }

    // Reactivate the user
    const { error: reactivateError } = await supabase
      .from('profiles')
      .update({
        is_active: true,
        archived_at: null,
        archived_by: null
      })
      .eq('id', userId);

    if (reactivateError) {
      throw reactivateError;
    }

    // Update organization active user count
    if (organizationId) {
      await updateActiveUserCount(organizationId);
    }

    console.log(`User ${userId} reactivated successfully`);
  } catch (error) {
    console.error('Error reactivating user:', error);
    throw error;
  }
}

// Get archived users for an organization
export async function getArchivedUsers(organizationId: string): Promise<ArchivedUser[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        roles,
        organization_id,
        is_active,
        archived_at,
        archived_by,
        last_activity,
        current_virtue_id,
        current_stage
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', false)
      .order('archived_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get emails from auth.users (requires admin access)
    const userIds = data?.map(user => user.id) || [];
    const usersWithEmails: ArchivedUser[] = [];

    for (const user of data || []) {
      // For now, we'll use a placeholder for email since we need admin access
      // In a real implementation, you'd use supabaseAdmin to get emails
      usersWithEmails.push({
        ...user,
        email: 'email@example.com' // Placeholder - would need admin query
      });
    }

    return usersWithEmails;
  } catch (error) {
    console.error('Error fetching archived users:', error);
    throw error;
  }
}

// Get active users for an organization
export async function getActiveUsers(organizationId: string): Promise<ArchivedUser[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        roles,
        organization_id,
        is_active,
        archived_at,
        archived_by,
        last_activity,
        current_virtue_id,
        current_stage
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error) {
      throw error;
    }

    // Get emails from auth.users (requires admin access)
    const usersWithEmails: ArchivedUser[] = [];

    for (const user of data || []) {
      // For now, we'll use a placeholder for email since we need admin access
      // In a real implementation, you'd use supabaseAdmin to get emails
      usersWithEmails.push({
        ...user,
        email: 'email@example.com' // Placeholder - would need admin query
      });
    }

    return usersWithEmails;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
}

// Update user activity tracking
export async function updateUserActivity(
  userId: string,
  virtueId?: number,
  stage?: number
): Promise<void> {
  try {
    const updateData: any = {
      last_activity: new Date().toISOString()
    };

    if (virtueId !== undefined) {
      updateData.current_virtue_id = virtueId;
    }

    if (stage !== undefined) {
      updateData.current_stage = stage;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
}

// Calculate engagement score based on activity patterns
export function calculateEngagementScore(
  lastActivity: Date,
  journalEntries: number,
  assessmentsCompleted: number,
  stagesCompleted: number
): number {
  const now = new Date();
  const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  // Base score from recency (0-40 points)
  let recencyScore = 0;
  if (daysSinceLastActivity === 0) recencyScore = 40;
  else if (daysSinceLastActivity <= 1) recencyScore = 35;
  else if (daysSinceLastActivity <= 3) recencyScore = 30;
  else if (daysSinceLastActivity <= 7) recencyScore = 20;
  else if (daysSinceLastActivity <= 14) recencyScore = 10;
  else if (daysSinceLastActivity <= 30) recencyScore = 5;
  // else 0

  // Activity volume score (0-30 points)
  const activityScore = Math.min(30, (journalEntries * 2) + (assessmentsCompleted * 5) + (stagesCompleted * 3));

  // Progress score (0-30 points)
  const progressScore = Math.min(30, stagesCompleted * 5);

  return Math.min(100, recencyScore + activityScore + progressScore);
}

// Get user activity details
export async function getUserActivity(userId: string): Promise<UserActivity | null> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        organization_id,
        is_active,
        archived_at,
        archived_by,
        last_activity,
        current_virtue_id,
        current_stage
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile.organization_id) {
      return null;
    }

    // Get current virtue details
    let currentVirtue = null;
    if (profile.current_virtue_id) {
      const { data: virtue, error: virtueError } = await supabase
        .from('virtues')
        .select('id, name')
        .eq('id', profile.current_virtue_id)
        .single();

      if (!virtueError && virtue) {
        // Get stage start date from progress tracking
        const { data: stageProgress, error: stageError } = await supabase
          .from('user_virtue_stage_progress')
          .select('created_at')
          .eq('user_id', userId)
          .eq('virtue_id', profile.current_virtue_id)
          .eq('stage_number', profile.current_stage || 1)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        currentVirtue = {
          id: virtue.id,
          name: virtue.name,
          stage: profile.current_stage || 1,
          stageStarted: stageError ? new Date() : new Date(stageProgress.created_at)
        };
      }
    }

    // Get recent activity metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Journal entries count
    const { count: journalCount, error: journalError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Assessments completed count
    const { count: assessmentCount, error: assessmentError } = await supabase
      .from('user_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Stages completed count
    const { count: stageCount, error: stageError } = await supabase
      .from('user_virtue_stage_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', thirtyDaysAgo.toISOString());

    const recentActivity = {
      journalEntries: journalCount || 0,
      assessmentsCompleted: assessmentCount || 0,
      stagesCompleted: stageCount || 0,
      lastActivity: profile.last_activity ? new Date(profile.last_activity) : new Date()
    };

    const engagementScore = calculateEngagementScore(
      recentActivity.lastActivity,
      recentActivity.journalEntries,
      recentActivity.assessmentsCompleted,
      recentActivity.stagesCompleted
    );

    return {
      userId: profile.id,
      organizationId: profile.organization_id,
      isActive: profile.is_active,
      archivedAt: profile.archived_at ? new Date(profile.archived_at) : undefined,
      archivedBy: profile.archived_by || undefined,
      lastLogin: recentActivity.lastActivity,
      currentVirtue,
      recentActivity,
      engagementScore
    };
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw error;
  }
}

// Get organization activity overview
export async function getOrganizationActivity(organizationId: string): Promise<UserActivity[]> {
  try {
    // Get all active users in organization
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (usersError) {
      throw usersError;
    }

    const activities: UserActivity[] = [];
    
    // Get activity for each user
    for (const user of users || []) {
      const activity = await getUserActivity(user.id);
      if (activity) {
        activities.push(activity);
      }
    }

    // Sort by engagement score (highest first)
    return activities.sort((a, b) => b.engagementScore - a.engagementScore);
  } catch (error) {
    console.error('Error getting organization activity:', error);
    throw error;
  }
}

// Bulk archive users
export async function bulkArchiveUsers(
  userIds: string[],
  archivedBy: string,
  organizationId: string
): Promise<void> {
  try {
    // Archive all users
    const { error: archiveError } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .in('id', userIds);

    if (archiveError) {
      throw archiveError;
    }

    // Update organization active user count
    await updateActiveUserCount(organizationId);

    console.log(`Bulk archived ${userIds.length} users by ${archivedBy}`);
  } catch (error) {
    console.error('Error bulk archiving users:', error);
    throw error;
  }
}

// Get archival statistics for organization
export async function getArchivalStats(organizationId: string): Promise<{
  activeUsers: number;
  archivedUsers: number;
  totalUsers: number;
  recentlyArchived: number; // Last 30 days
}> {
  try {
    // Get active users count
    const { count: activeCount, error: activeError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Get archived users count
    const { count: archivedCount, error: archivedError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', false);

    // Get recently archived count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentCount, error: recentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', false)
      .gte('archived_at', thirtyDaysAgo.toISOString());

    if (activeError || archivedError || recentError) {
      throw activeError || archivedError || recentError;
    }

    return {
      activeUsers: activeCount || 0,
      archivedUsers: archivedCount || 0,
      totalUsers: (activeCount || 0) + (archivedCount || 0),
      recentlyArchived: recentCount || 0
    };
  } catch (error) {
    console.error('Error getting archival stats:', error);
    throw error;
  }
}