// Simple validation tests for RBAC service
import { validateAssignment } from '../practitionerAssignmentService';

// Manual test functions without testing framework dependencies

// Export for manual testing
export const testRBACService = () => {
  console.log('Testing RBAC Service...');
  
  // Test assignment validation
  const testAssignments = [
    {
      practitioner_id: 'user1',
      supervisor_id: 'user2',
      supervisor_role: 'coach' as const,
      organization_id: 'org1',
      assigned_by: 'admin1'
    },
    {
      practitioner_id: '',
      supervisor_id: 'user2',
      supervisor_role: 'therapist' as const,
      organization_id: 'org1',
      assigned_by: 'admin1'
    },
    {
      practitioner_id: 'user1',
      supervisor_id: 'user1',
      supervisor_role: 'coach' as const,
      organization_id: 'org1',
      assigned_by: 'admin1'
    }
  ];
  
  testAssignments.forEach((assignment, index) => {
    const errors = validateAssignment(assignment);
    console.log(`Assignment ${index + 1}:`, errors.length === 0 ? 'PASS' : `FAIL: ${errors.join(', ')}`);
  });
  
  console.log('RBAC Service tests completed!');
};