import { describe, it, expect } from 'vitest';
import { BioSchema, validateBio, sanitizeBio } from '~/schemas/profile';

describe('Bio Schema', () => {
  it('should validate bio with valid content', () => {
    const result = BioSchema.safeParse({ bio: 'My bio' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe('My bio');
    }
  });

  it('should accept null bio', () => {
    const result = BioSchema.safeParse({ bio: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe(null);
    }
  });

  it('should accept empty string', () => {
    const result = BioSchema.safeParse({ bio: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe('');
    }
  });

  it('should reject bio longer than 500 characters', () => {
    const longBio = 'a'.repeat(501);
    const result = BioSchema.safeParse({ bio: longBio });
    expect(result.success).toBe(false);
  });

  it('should accept bio exactly 500 characters', () => {
    const bio = 'a'.repeat(500);
    const result = BioSchema.safeParse({ bio: bio });
    expect(result.success).toBe(true);
  });

  it('should trim whitespace', () => {
    const result = BioSchema.safeParse({ bio: '  My bio  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe('My bio');
    }
  });
});

describe('validateBio helper', () => {
  it('should return success for valid bio', () => {
    const result = validateBio({ bio: 'My bio' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.bio).toBe('My bio');
    }
  });

  it('should return error for invalid bio', () => {
    const result = validateBio({ bio: 'a'.repeat(501) });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('sanitizeBio helper', () => {
  it('should remove HTML tags', () => {
    const bio = sanitizeBio('My bio <script>alert("xss")</script>');
    expect(bio).toBe('My bio alert("xss")');
  });

  it('should remove angle brackets', () => {
    const bio = sanitizeBio('My bio <test>');
    expect(bio).toBe('My bio test');
  });

  it('should trim whitespace', () => {
    const bio = sanitizeBio('  My bio  ');
    expect(bio).toBe('My bio');
  });

  it('should preserve plain text', () => {
    const bio = sanitizeBio('My bio with normal text');
    expect(bio).toBe('My bio with normal text');
  });
});
