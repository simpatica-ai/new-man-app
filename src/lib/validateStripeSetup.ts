/**
 * Validation script for Stripe setup and StripeService functionality
 * This can be used to verify that the Stripe integration is working correctly
 */

import { stripeService } from './stripeService';
import { validateStripeEnvironment } from './stripeConfig';

export interface StripeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  accountInfo?: any;
}

/**
 * Comprehensive validation of Stripe setup
 */
export async function validateStripeSetup(): Promise<StripeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let accountInfo: any = null;

  try {
    // 1. Validate environment configuration
    console.log('🔍 Validating Stripe environment configuration...');
    const envValidation = validateStripeEnvironment();
    if (!envValidation.isValid) {
      errors.push(...envValidation.errors);
    }

    // 2. Test Stripe connectivity and account status
    console.log('🔗 Testing Stripe connectivity...');
    try {
      const connectionValidation = await stripeService.validateStripeConnection();
      if (!connectionValidation.isValid) {
        errors.push(...connectionValidation.errors);
      }

      // Get account info for additional validation
      accountInfo = await stripeService.getAccountInfo();
      console.log('✅ Successfully connected to Stripe account:', accountInfo.display_name || accountInfo.id);

      // Check account capabilities
      if (!accountInfo.charges_enabled) {
        warnings.push('Stripe account charges are not enabled');
      }
      if (!accountInfo.payouts_enabled) {
        warnings.push('Stripe account payouts are not enabled');
      }

    } catch (error) {
      errors.push(`Stripe connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Test basic service methods (without actually creating charges)
    console.log('🧪 Testing StripeService methods...');
    
    // Test customer creation (we'll create and immediately delete)
    try {
      const testCustomer = await stripeService.createCustomer(
        'test@example.com',
        'Test Customer',
        { test: 'true' }
      );
      console.log('✅ Customer creation test passed');

      // Clean up test customer
      await stripeService.updateCustomer(testCustomer.id, { metadata: { deleted: 'true' } });
    } catch (error) {
      errors.push(`Customer creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test price creation
    try {
      const testPrice = await stripeService.createPrice(10.00, 'usd', 'month');
      console.log('✅ Price creation test passed');
    } catch (error) {
      errors.push(`Price creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const isValid = errors.length === 0;

  // Log results
  if (isValid) {
    console.log('🎉 Stripe setup validation completed successfully!');
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:', warnings);
    }
  } else {
    console.log('❌ Stripe setup validation failed:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  return {
    isValid,
    errors,
    warnings,
    accountInfo,
  };
}

/**
 * Quick validation for development
 */
export async function quickStripeCheck(): Promise<boolean> {
  try {
    const result = await validateStripeSetup();
    return result.isValid;
  } catch (error) {
    console.error('Quick Stripe check failed:', error);
    return false;
  }
}

// Export for use in API routes or other validation contexts
export { stripeService };