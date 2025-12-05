// Simple validation tests for organization service
import { 
  generateSlug, 
  validateOrganizationData
} from '../organizationService';

// Manual test functions without testing framework dependencies

// Export for manual testing
export const testOrganizationService = () => {
  console.log('Testing Organization Service...');
  
  // Test slug generation
  const testNames = [
    'My Test Organization',
    'Special Characters!@#',
    '   Whitespace   Test   '
  ];
  
  testNames.forEach(name => {
    const slug = generateSlug(name);
    console.log(`"${name}" -> "${slug}"`);
  });
  
  // Test validation
  const testData = [
    { name: 'Valid Org', billing_email: 'test@example.com' },
    { name: '', billing_email: 'invalid' },
    { name: 'a'.repeat(101), billing_email: 'test@example.com' }
  ];
  
  testData.forEach((data, index) => {
    const errors = validateOrganizationData(data);
    console.log(`Test ${index + 1}:`, errors.length === 0 ? 'PASS' : `FAIL: ${errors.join(', ')}`);
  });
  
  console.log('Organization Service tests completed!');
};