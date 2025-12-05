import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  generateInvitationToken, 
  validateInvitationData,
  generateSlug 
} from '../invitationService';

// Mock crypto for testing
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'mock-token-123456789abcdef')
    }))
  }
}));

describe('invitationService', () => {
  describe('generateInvitationToken', () => {
    it('should generate a token', () => {
      const token = generateInvitationToken();
      expect(token).toBe('mock-token-123456789abcdef');
    });
  });

  describe('validateInvitationData', () => {
    const validData = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      roles: ['coach'],
      invitedBy: '123e4567-e89b-12d3-a456-426614174001'
    };

    it('should pass validation for valid data', () => {
      const errors = validateInvitationData(validData);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid email', () => {
      const errors = validateInvitationData({
        ...validData,
        email: 'invalid-email'
      });
      expect(errors).toContain('Valid email address is required');
    });

    it('should fail validation for empty roles', () => {
      const errors = validateInvitationData({
        ...validData,
        roles: []
      });
      expect(errors).toContain('At least one role must be specified');
    });

    it('should fail validation for invalid roles', () => {
      const errors = validateInvitationData({
        ...validData,
        roles: ['invalid-role']
      });
      expect(errors).toContain('Invalid roles: invalid-role');
    });

    it('should fail validation for missing organization ID', () => {
      const errors = validateInvitationData({
        ...validData,
        organizationId: ''
      });
      expect(errors).toContain('Organization ID is required');
    });

    it('should fail validation for missing inviter ID', () => {
      const errors = validateInvitationData({
        ...validData,
        invitedBy: ''
      });
      expect(errors).toContain('Inviter ID is required');
    });
  });
});