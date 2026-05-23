import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodePostcode, clearGeocodingCache } from '~/server/utils/geocoding';

describe('geocodePostcode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearGeocodingCache();
  });

  it('should geocode a valid UK postcode', async () => {
    const mockResponse = {
      status: 200,
      result: {
        latitude: 51.5074,
        longitude: -0.1278
      }
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    );

    const result = await geocodePostcode('SW1A 1AA');

    expect(result.success).toBe(true);
    expect(result.latitude).toBe(51.5074);
    expect(result.longitude).toBe(-0.1278);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.postcodes.io/postcodes/SW1A%201AA',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should return error for invalid postcode format', async () => {
    global.fetch = vi.fn();
    
    const result = await geocodePostcode('12');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid postcode format');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should return error for postcode not found (404)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ status: 404, error: 'Postcode not found' })
      } as Response)
    );

    const result = await geocodePostcode('ZZ99 9ZZ');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Postcode not found');
  });

  it('should return error for API failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ status: 500 })
      } as Response)
    );

    const result = await geocodePostcode('SW1A 1AA');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Geocoding service unavailable');
  });

  it('should return error when API returns non-200 status', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 400, error: 'Invalid postcode' })
      } as Response)
    );

    const result = await geocodePostcode('SW1A 1AA');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid postcode');
  });

  it('should handle network errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    const result = await geocodePostcode('SW1A 1AA');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Geocoding service unavailable');
  });

  it('should cache results', async () => {
    const mockResponse = {
      status: 200,
      result: { latitude: 51.5074, longitude: -0.1278 }
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    );

    // First call
    await geocodePostcode('SW1A 1AA');
    // Second call should use cache
    await geocodePostcode('SW1A 1AA');

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
