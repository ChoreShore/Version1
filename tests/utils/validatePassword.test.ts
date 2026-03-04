import { describe, it, expect } from 'vitest';
import { validatePassword } from '~/server/utils/validatePassword'; // ← Fixed import path

describe('validatePassword', () => {
  it('should reject passwords shorter than 12 characters', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('12 characters');
  });

  it('should reject passwords without uppercase letters', () => {
    const result = validatePassword('lowercase123!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  it('should reject passwords without numbers', () => {
    const result = validatePassword('NoNumbers!Here');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('number');
  });

  it('should reject passwords without special characters', () => {
    const result = validatePassword('NoSpecial123');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('special character');
  });

  it('should accept valid passwords', () => {
    const result = validatePassword('ValidPass123!');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should accept passwords with all requirements met', () => {
    const validPasswords = [
      'MySecure#Pass123',
      'Another$Valid1Password',
      'Test@Password2023'
    ];

    validPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.valid).toBe(true);
    });
  });
});