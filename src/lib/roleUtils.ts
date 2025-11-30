// Role System Utilities
// Handles the new clear role system for organizational vs individual vs system roles

export type SystemRole = 'sys-admin';

export type OrganizationalRole = 
  | 'org-admin' 
  | 'org-coach' 
  | 'org-therapist' 
  | 'org-practitioner';

export type IndividualRole = 
  | 'ind-sponsor' 
  | 'ind-practitioner';

export type LegacyRole = 
  | 'admin' 
  | 'coach' 
  | 'therapist' 
  | 'practitioner' 
  | 'sponsor';

export type UserRole = SystemRole | OrganizationalRole | IndividualRole | LegacyRole;

export interface UserRoleInfo {
  roles: UserRole[];
  isSystemAdmin: boolean;
  isOrgAdmin: boolean;
  isOrgCoach: boolean;
  isOrgTherapist: boolean;
  isOrgPractitioner: boolean;
  isIndividualSponsor: boolean;
  isIndividualPractitioner: boolean;
  hasOrganizationalRole: boolean;
  hasIndividualRole: boolean;
}

export function parseUserRoles(profile: { role?: string; roles?: string[] }): UserRoleInfo {
  // Get all roles (from both role and roles fields for backward compatibility)
  const allRoles: UserRole[] = [
    ...(profile.roles || []),
    ...(profile.role ? [profile.role] : [])
  ].filter((role, index, arr) => arr.indexOf(role) === index) as UserRole[]; // Remove duplicates

  return {
    roles: allRoles,
    isSystemAdmin: allRoles.includes('sys-admin'),
    isOrgAdmin: allRoles.includes('org-admin') || allRoles.includes('admin'), // Backward compatibility
    isOrgCoach: allRoles.includes('org-coach') || allRoles.includes('coach'), // Backward compatibility
    isOrgTherapist: allRoles.includes('org-therapist') || allRoles.includes('therapist'), // Backward compatibility
    isOrgPractitioner: allRoles.includes('org-practitioner') || allRoles.includes('practitioner'), // Backward compatibility
    isIndividualSponsor: allRoles.includes('ind-sponsor') || allRoles.includes('sponsor'), // Backward compatibility
    isIndividualPractitioner: allRoles.includes('ind-practitioner'),
    hasOrganizationalRole: allRoles.some(role => 
      role.startsWith('org-') || ['admin', 'coach', 'therapist', 'practitioner'].includes(role)
    ),
    hasIndividualRole: allRoles.some(role => 
      role.startsWith('ind-') || role === 'sponsor'
    )
  };
}

export function canAccessSystemAdmin(roleInfo: UserRoleInfo): boolean {
  // Allow both sys-admin and legacy admin role for system access
  return roleInfo.isSystemAdmin || roleInfo.isOrgAdmin;
}

export function canAccessOrganizationAdmin(roleInfo: UserRoleInfo): boolean {
  return roleInfo.isSystemAdmin || roleInfo.isOrgAdmin;
}

export function canSupervise(roleInfo: UserRoleInfo): boolean {
  return roleInfo.isSystemAdmin || roleInfo.isOrgAdmin || roleInfo.isOrgCoach || roleInfo.isOrgTherapist || roleInfo.isIndividualSponsor;
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    'sys-admin': 'System Administrator',
    'org-admin': 'Organization Administrator', 
    'org-coach': 'Organization Coach',
    'org-therapist': 'Organization Therapist',
    'org-practitioner': 'Organization Practitioner',
    'ind-sponsor': 'Individual Sponsor',
    'ind-practitioner': 'Individual Practitioner',
    // Legacy role names for backward compatibility
    'admin': 'Administrator',
    'coach': 'Coach', 
    'therapist': 'Therapist',
    'practitioner': 'Practitioner',
    'sponsor': 'Sponsor'
  };
  
  return roleNames[role] || role;
}

export function migrateToNewRoleSystem(
  currentRole: string, 
  hasOrganization: boolean
): UserRole[] {
  // Migration logic for moving from old to new role system
  if (currentRole === 'admin') {
    return hasOrganization ? ['org-admin'] : ['sys-admin']; // Assume sys-admin if no org
  }
  if (currentRole === 'coach') {
    return hasOrganization ? ['org-coach'] : ['ind-sponsor'];
  }
  if (currentRole === 'therapist') {
    return hasOrganization ? ['org-therapist'] : ['ind-sponsor'];
  }
  if (currentRole === 'practitioner') {
    return hasOrganization ? ['org-practitioner'] : ['ind-practitioner'];
  }
  if (currentRole === 'sponsor') {
    return ['ind-sponsor'];
  }
  
  return [currentRole as UserRole];
}