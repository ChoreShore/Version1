import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordStrength, PASSWORD_REQUIREMENTS } from '~/utils/passwordValidation';

describe('Password Validation Utils', () => {
  describe('validatePassword', () => {
    it('should return errors for invalid passwords', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return no errors for valid passwords', () => {
      const result = validatePassword('ValidPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should list all validation errors', () => {
      const result = validatePassword('abc');
      expect(result.errors).toContainEqual(expect.stringContaining('12 characters'));
      expect(result.errors).toContainEqual(expect.stringContaining('uppercase'));
      expect(result.errors).toContainEqual(expect.stringContaining('number'));
      expect(result.errors).toContainEqual(expect.stringContaining('special character'));
    });
  });

  describe('getPasswordStrength', () => {
    it('should return weak for simple passwords', () => {
      expect(getPasswordStrength('password')).toBe('weak');
      expect(getPasswordStrength('12345678')).toBe('weak');
    });

    it('should return medium for moderately complex passwords', () => {
      expect(getPasswordStrength('Password123')).toBe('medium');
    });

    it('should return strong for complex passwords', () => {
      expect(getPasswordStrength('MySecure#Pass123')).toBe('strong');
      expect(getPasswordStrength('C0mpl3x!P@ssw0rd')).toBe('strong');
    });
  });

  describe('PASSWORD_REQUIREMENTS', () => {
    it('should export password requirements constants', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(12);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireNumber).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireSymbol).toBe(true);
    });
  });
});
