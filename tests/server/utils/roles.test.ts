import { describe, it, expect } from 'vitest';
import { parseRoles, hasRole } from '~/server/utils/roles';

describe('parseRoles', () => {
  it('filters non-string values from an array', () => {
    expect(parseRoles(['employer', 123, 'worker', null, true])).toEqual(['employer', 'worker']);
  });

  it('returns string array as-is when all strings', () => {
    expect(parseRoles(['employer', 'worker'])).toEqual(['employer', 'worker']);
  });

  it('extracts string values from an object', () => {
    expect(parseRoles({ a: 'employer', b: 'worker', c: 123 })).toEqual(['employer', 'worker']);
  });

  it('splits a comma-separated string', () => {
    expect(parseRoles('employer,worker')).toEqual(['employer', 'worker']);
  });

  it('trims whitespace from comma-separated string', () => {
    expect(parseRoles(' employer , worker ')).toEqual(['employer', 'worker']);
  });

  it('removes curly braces from string', () => {
    expect(parseRoles('{employer,worker}')).toEqual(['employer', 'worker']);
  });

  it('returns empty array for empty string', () => {
    expect(parseRoles('')).toEqual([]);
  });

  it('returns empty array for braces-only string', () => {
    expect(parseRoles('{}')).toEqual([]);
  });

  it('returns empty array for null', () => {
    expect(parseRoles(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(parseRoles(undefined)).toEqual([]);
  });

  it('returns empty array for number', () => {
    expect(parseRoles(42)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(parseRoles([])).toEqual([]);
  });

  it('returns empty array for empty object', () => {
    expect(parseRoles({})).toEqual([]);
  });

  it('handles single role in string', () => {
    expect(parseRoles('employer')).toEqual(['employer']);
  });
});

describe('hasRole', () => {
  it('returns true when role is present in array', () => {
    expect(hasRole(['employer', 'worker'], 'employer')).toBe(true);
  });

  it('returns false when role is not present in array', () => {
    expect(hasRole(['worker'], 'employer')).toBe(false);
  });

  it('returns true when role is present in comma-separated string', () => {
    expect(hasRole('employer,worker', 'worker')).toBe(true);
  });

  it('returns false when role is not in comma-separated string', () => {
    expect(hasRole('employer', 'worker')).toBe(false);
  });

  it('returns true when role is present in object values', () => {
    expect(hasRole({ a: 'employer' }, 'employer')).toBe(true);
  });

  it('returns false for null roles', () => {
    expect(hasRole(null, 'employer')).toBe(false);
  });

  it('returns false for empty roles', () => {
    expect(hasRole([], 'employer')).toBe(false);
  });

  it('returns false for undefined roles', () => {
    expect(hasRole(undefined, 'employer')).toBe(false);
  });
});
