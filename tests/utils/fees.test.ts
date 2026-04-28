import { describe, it, expect } from 'vitest';
import { PLATFORM_FEE_RATE } from '~/server/utils/fees';

describe('PLATFORM_FEE_RATE', () => {
  it('is defined as 0.15 (15%)', () => {
    expect(PLATFORM_FEE_RATE).toBe(0.15);
  });
});
