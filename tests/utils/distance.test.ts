import { describe, it, expect } from 'vitest';
import { milesToKm, kmToMiles } from '~/server/utils/distance';

describe('distance utilities', () => {
  describe('milesToKm', () => {
    it('converts miles to kilometers correctly', () => {
      expect(milesToKm(1)).toBeCloseTo(1.60934, 4);
      expect(milesToKm(10)).toBeCloseTo(16.0934, 3);
      expect(milesToKm(0)).toBe(0);
    });

    it('handles fractional miles', () => {
      expect(milesToKm(0.5)).toBeCloseTo(0.80467, 4);
      expect(milesToKm(2.5)).toBeCloseTo(4.02335, 4);
    });

    it('returns positive values for positive input', () => {
      expect(milesToKm(100)).toBeGreaterThan(0);
    });
  });

  describe('kmToMiles', () => {
    it('converts kilometers to miles correctly', () => {
      expect(kmToMiles(1.60934)).toBeCloseTo(1, 3);
      expect(kmToMiles(16.0934)).toBeCloseTo(10, 2);
      expect(kmToMiles(0)).toBe(0);
    });

    it('handles fractional kilometers', () => {
      expect(kmToMiles(0.80467)).toBeCloseTo(0.5, 3);
      expect(kmToMiles(4.02335)).toBeCloseTo(2.5, 2);
    });

    it('returns positive values for positive input', () => {
      expect(kmToMiles(100)).toBeGreaterThan(0);
    });
  });

  describe('round-trip conversion', () => {
    it('miles -> km -> miles returns approximately the same value', () => {
      const originalMiles = 5;
      const km = milesToKm(originalMiles);
      const backToMiles = kmToMiles(km);
      expect(backToMiles).toBeCloseTo(originalMiles, 5);
    });

    it('km -> miles -> km returns approximately the same value', () => {
      const originalKm = 8;
      const miles = kmToMiles(originalKm);
      const backToKm = milesToKm(miles);
      expect(backToKm).toBeCloseTo(originalKm, 5);
    });
  });
});
