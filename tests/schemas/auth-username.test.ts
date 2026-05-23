import { describe, it, expect } from 'vitest';
import { SignUpSchema, SignUpFormSchema } from '~/schemas/auth';

describe('Username Validation in Auth Schemas', () => {
  describe('SignUpFormSchema', () => {
    it('should accept valid username', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
      }
    });

    it('should reject username longer than 12 characters', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'verylongusername',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(false);
    });

    it('should accept username exactly 12 characters', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'a'.repeat(12),
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(true);
    });

    it('should reject username with invalid characters', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'invalid@user',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(false);
    });

    it('should accept username with underscores', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'test_user',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(true);
    });

    it('should accept username with hyphens', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'test-user',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(true);
    });

    it('should reject username with spaces', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: 'test user',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(false);
    });

    it('should trim username whitespace', () => {
      const result = SignUpFormSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        username: '  testuser  ',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
      }
    });
  });

  describe('SignUpSchema', () => {
    it('should accept valid username', () => {
      const result = SignUpSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
      }
    });

    it('should reject username longer than 12 characters', () => {
      const result = SignUpSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        username: 'verylongusername',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(false);
    });

    it('should reject username with invalid characters', () => {
      const result = SignUpSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        username: 'invalid@user',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      });
      expect(result.success).toBe(false);
    });
  });
});
