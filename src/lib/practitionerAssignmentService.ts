import { supabase } from './supabaseClient';

// Types for practitioner assignments
export interface PractitionerAssignment {
  id: string;
  practitioner_id: string;
  supervisor_id: string;
  supervisor_role: 'coach' | 'therapist';
  organization_id: string;
  assigned_at: string;
  assigned_by: string;
  active: boolean;
}

export interface AssignmentWithDetails extends PractitionerAssignment {
  practitioner_name: string;
  supervisor_name: string;
  practitioner_email?: string;
  supervisor_email?: string;
}

export interface CreateAssignmentData {
  practitioner_id: string;
  supervisor_id: string;
  supervisor_role: 'coach' | 'therapist';
  organization_id: string;
  assigned_by: string;
}

export interface AssignmentHistory {
  id: string;
  practitioner_id: string;
  supervisor_id: string;
  supervisor_role: 'coach' | 'therapist';
  assigned_at: string;
  removed_at: string | null;
  assigned_by: string;
  removed_by: string | null;
  reason: string | null;
}

// Create a new practitioner assignment
export async function createPractitionerAssignment(
  data: CreateAssignmentData
): Promise<PractitionerAssignment> {
  try {
    // TODO: Uncomment once database migration is complete
    // const { data: assignment, error } = await supabase
    //   .from('practitioner_assignments')
    //   .insert({
    //     practitioner_id: data.practitioner_id,
    //     supervisor_id: data.supervisor_id,
    //     supervisor_role: data.supervisor_role,
    //     organization_id: data.organization_id,
    //     assigned_by: data.assigned_by,
    //     active: true
    //   })
    //   .select()
    //   .single();

    // if (error) throw error;
    // return assignment;

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    throw new Error('Database migration required: practitioner_assignments table does not exist');
  } catch (error) {
    console.error('Error creating practitioner assignment:', error);
    throw error;
  }
}

// Get all assignments for an organization
export async function getOrganizationAssignments(
  organizationId: string
): Promise<AssignmentWithDetails[]> {
  try {
    // TODO: Uncomment once database migration is complete
    // const { data, error } = await supabase
    //   .from('practitioner_assignments')
    //   .select(`
    //     *,
    //     practitioner:profiles!practitioner_assignments_practitioner_id_fkey(full_name, email),
    //     supervisor:profiles!practitioner_assignments_supervisor_id_fkey(full_name, email)
    //   `)
    //   .eq('organization_id', organizationId)
    //   .eq('active', true)
    //   .order('assigned_at', { ascending: false });

    // if (error) throw error;

    // return (data || []).map(assignment => ({
    //   ...assignment,
    //   practitioner_name: assignment.practitioner?.full_name || 'Unknown',
    //   supervisor_name: assignment.supervisor?.full_name || 'Unknown',
    //   practitioner_email: assignment.practitioner?.email,
    //   supervisor_email: assignment.supervisor?.email
    // }));

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return [];
  } catch (error) {
    console.error('Error fetching organization assignments:', error);
    throw error;
  }
}

// Get assignments for a specific practitioner
export async function getPractitionerAssignments(
  practitionerId: string
): Promise<AssignmentWithDetails[]> {
  try {
    // TODO: Uncomment once database migration is complete
    // const { data, error } = await supabase
    //   .from('practitioner_assignments')
    //   .select(`
    //     *,
    //     supervisor:profiles!practitioner_assignments_supervisor_id_fkey(full_name, email)
    //   `)
    //   .eq('practitioner_id', practitionerId)
    //   .eq('active', true);

    // if (error) throw error;

    // return (data || []).map(assignment => ({
    //   ...assignment,
    //   practitioner_name: 'Current User',
    //   supervisor_name: assignment.supervisor?.full_name || 'Unknown',
    //   supervisor_email: assignment.supervisor?.email
    // }));

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return [];
  } catch (error) {
    console.error('Error fetching practitioner assignments:', error);
    throw error;
  }
}

// Get assignments for a specific supervisor
export async function getSupervisorAssignments(
  supervisorId: string,
  role?: 'coach' | 'therapist'
): Promise<AssignmentWithDetails[]> {
  try {
    // TODO: Uncomment once database migration is complete
    // let query = supabase
    //   .from('practitioner_assignments')
    //   .select(`
    //     *,
    //     practitioner:profiles!practitioner_assignments_practitioner_id_fkey(full_name, email)
    //   `)
    //   .eq('supervisor_id', supervisorId)
    //   .eq('active', true);

    // if (role) {
    //   query = query.eq('supervisor_role', role);
    // }

    // const { data, error } = await query;
    // if (error) throw error;

    // return (data || []).map(assignment => ({
    //   ...assignment,
    //   practitioner_name: assignment.practitioner?.full_name || 'Unknown',
    //   supervisor_name: 'Current User',
    //   practitioner_email: assignment.practitioner?.email
    // }));

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return [];
  } catch (error) {
    console.error('Error fetching supervisor assignments:', error);
    throw error;
  }
}

// Remove/deactivate an assignment
export async function removeAssignment(
  assignmentId: string,
  removedBy: string,
  reason?: string
): Promise<void> {
  try {
    // TODO: Uncomment once database migration is complete
    // const { error } = await supabase
    //   .from('practitioner_assignments')
    //   .update({
    //     active: false,
    //     removed_at: new Date().toISOString(),
    //     removed_by: removedBy,
    //     reason: reason || null
    //   })
    //   .eq('id', assignmentId);

    // if (error) throw error;

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    throw new Error('Database migration required: practitioner_assignments table does not exist');
  } catch (error) {
    console.error('Error removing assignment:', error);
    throw error;
  }
}

// Reassign a practitioner to a different supervisor
export async function reassignPractitioner(
  practitionerId: string,
  newSupervisorId: string,
  newSupervisorRole: 'coach' | 'therapist',
  organizationId: string,
  assignedBy: string,
  reason?: string
): Promise<PractitionerAssignment> {
  try {
    // TODO: Uncomment once database migration is complete
    // First, deactivate existing assignments
    // const { error: deactivateError } = await supabase
    //   .from('practitioner_assignments')
    //   .update({
    //     active: false,
    //     removed_at: new Date().toISOString(),
    //     removed_by: assignedBy,
    //     reason: reason || 'Reassigned to new supervisor'
    //   })
    //   .eq('practitioner_id', practitionerId)
    //   .eq('active', true);

    // if (deactivateError) throw deactivateError;

    // Create new assignment
    // const newAssignment = await createPractitionerAssignment({
    //   practitioner_id: practitionerId,
    //   supervisor_id: newSupervisorId,
    //   supervisor_role: newSupervisorRole,
    //   organization_id: organizationId,
    //   assigned_by: assignedBy
    // });

    // return newAssignment;

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    throw new Error('Database migration required: practitioner_assignments table does not exist');
  } catch (error) {
    console.error('Error reassigning practitioner:', error);
    throw error;
  }
}

// Get assignment history for a practitioner
export async function getAssignmentHistory(
  practitionerId: string
): Promise<AssignmentHistory[]> {
  try {
    // TODO: Uncomment once database migration is complete
    // const { data, error } = await supabase
    //   .from('practitioner_assignments')
    //   .select(`
    //     id,
    //     practitioner_id,
    //     supervisor_id,
    //     supervisor_role,
    //     assigned_at,
    //     removed_at,
    //     assigned_by,
    //     removed_by,
    //     reason,
    //     supervisor:profiles!practitioner_assignments_supervisor_id_fkey(full_name)
    //   `)
    //   .eq('practitioner_id', practitionerId)
    //   .order('assigned_at', { ascending: false });

    // if (error) throw error;
    // return data || [];

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return [];
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    throw error;
  }
}

// Check if a supervisor has access to a practitioner
export async function hasSupervisorAccess(
  supervisorId: string,
  practitionerId: string,
  role?: 'coach' | 'therapist'
): Promise<boolean> {
  try {
    // TODO: Uncomment once database migration is complete
    // let query = supabase
    //   .from('practitioner_assignments')
    //   .select('id')
    //   .eq('supervisor_id', supervisorId)
    //   .eq('practitioner_id', practitionerId)
    //   .eq('active', true);

    // if (role) {
    //   query = query.eq('supervisor_role', role);
    // }

    // const { data, error } = await query.single();
    
    // if (error && error.code === 'PGRST116') {
    //   return false; // No assignment found
    // }
    
    // if (error) throw error;
    // return !!data;

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return false;
  } catch (error) {
    console.error('Error checking supervisor access:', error);
    return false;
  }
}

// Get practitioners assigned to a supervisor with their activity data
export async function getSupervisorPractitionersWithActivity(
  supervisorId: string,
  role?: 'coach' | 'therapist'
): Promise<Array<AssignmentWithDetails & {
  last_activity?: string;
  current_virtue_id?: number;
  current_stage?: number;
  engagement_score?: number;
}>> {
  try {
    // TODO: Uncomment once database migration is complete
    // let query = supabase
    //   .from('practitioner_assignments')
    //   .select(`
    //     *,
    //     practitioner:profiles!practitioner_assignments_practitioner_id_fkey(
    //       full_name,
    //       email,
    //       last_activity,
    //       current_virtue_id,
    //       current_stage
    //     )
    //   `)
    //   .eq('supervisor_id', supervisorId)
    //   .eq('active', true);

    // if (role) {
    //   query = query.eq('supervisor_role', role);
    // }

    // const { data, error } = await query;
    // if (error) throw error;

    // return (data || []).map(assignment => ({
    //   ...assignment,
    //   practitioner_name: assignment.practitioner?.full_name || 'Unknown',
    //   supervisor_name: 'Current User',
    //   practitioner_email: assignment.practitioner?.email,
    //   last_activity: assignment.practitioner?.last_activity,
    //   current_virtue_id: assignment.practitioner?.current_virtue_id,
    //   current_stage: assignment.practitioner?.current_stage,
    //   engagement_score: 0 // TODO: Calculate engagement score
    // }));

    // Placeholder implementation until migration is complete
    console.warn('practitioner_assignments table not yet migrated');
    return [];
  } catch (error) {
    console.error('Error fetching supervisor practitioners with activity:', error);
    throw error;
  }
}

// Send notification about new assignment
export async function notifyAssignment(
  assignmentId: string,
  type: 'created' | 'removed' | 'reassigned'
): Promise<void> {
  try {
    // TODO: Implement notification system
    // This could send emails, in-app notifications, etc.
    console.log(`Assignment notification: ${type} for assignment ${assignmentId}`);
    
    // Placeholder for future notification implementation
    // await sendNotificationEmail(assignment, type);
    // await createInAppNotification(assignment, type);
  } catch (error) {
    console.error('Error sending assignment notification:', error);
    // Don't throw here - notifications are not critical
  }
}

// Validate assignment constraints
export function validateAssignment(data: CreateAssignmentData): string[] {
  const errors: string[] = [];

  if (!data.practitioner_id) {
    errors.push('Practitioner ID is required');
  }

  if (!data.supervisor_id) {
    errors.push('Supervisor ID is required');
  }

  if (!data.supervisor_role || !['coach', 'therapist'].includes(data.supervisor_role)) {
    errors.push('Valid supervisor role (coach or therapist) is required');
  }

  if (!data.organization_id) {
    errors.push('Organization ID is required');
  }

  if (!data.assigned_by) {
    errors.push('Assigned by user ID is required');
  }

  if (data.practitioner_id === data.supervisor_id) {
    errors.push('Practitioner and supervisor cannot be the same person');
  }

  return errors;
}