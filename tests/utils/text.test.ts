import { describe, it, expect } from 'vitest';
import { formatEmployerName } from '~/server/utils/text';

describe('formatEmployerName', () => {
  it('returns Anonymous when firstName is null', () => {
    expect(formatEmployerName(null, 'Smith')).toBe('Anonymous');
  });

  it('returns Anonymous when firstName is empty string', () => {
    expect(formatEmployerName('', 'Smith')).toBe('Anonymous');
  });

  it('returns just first name when lastName is null', () => {
    expect(formatEmployerName('John', null)).toBe('John');
  });

  it('returns just first name when lastName is empty string', () => {
    expect(formatEmployerName('John', '')).toBe('John');
  });

  it('returns "Firstname S." when both names are provided', () => {
    expect(formatEmployerName('John', 'Smith')).toBe('John S.');
    expect(formatEmployerName('Jane', 'Doe')).toBe('Jane D.');
  });

  it('trims whitespace from firstName', () => {
    expect(formatEmployerName('  John  ', 'Smith')).toBe('John S.');
  });

  it('trims whitespace from lastName', () => {
    expect(formatEmployerName('John', '  Smith  ')).toBe('John S.');
  });

  it('handles single-letter lastName', () => {
    expect(formatEmployerName('John', 'S')).toBe('John S.');
  });

  it('handles multi-word firstName', () => {
    expect(formatEmployerName('John Paul', 'Smith')).toBe('John Paul S.');
  });

  it('handles special characters in lastName', () => {
    expect(formatEmployerName('John', 'O\'Brien')).toBe('John O.');
  });
});
