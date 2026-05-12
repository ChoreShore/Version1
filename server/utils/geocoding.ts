interface PostcodeIOResponse {
  status: number;
  result?: {
    latitude: number;
    longitude: number;
  };
  error?: string;
}

interface GeocodingResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

// Simple in-memory cache with TTL
const geocodingCache = new Map<string, { result: GeocodingResult; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function normalizePostcode(postcode: string): string {
  return postcode.toLowerCase().replace(/\s/g, '');
}

function getCachedResult(postcode: string): GeocodingResult | null {
  const normalized = normalizePostcode(postcode);
  const cached = geocodingCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }
  return null;
}

function setCachedResult(postcode: string, result: GeocodingResult): void {
  const normalized = normalizePostcode(postcode);
  geocodingCache.set(normalized, { result, timestamp: Date.now() });
}

/**
 * Geocode a UK postcode to latitude/longitude coordinates using Postcode.io API
 * @param postcode - UK postcode to geocode
 * @returns GeocodingResult with coordinates or error
 */
export async function geocodePostcode(postcode: string): Promise<GeocodingResult> {
  // Validate postcode format (basic UK postcode validation)
  if (!postcode || postcode.trim().length < 4) {
    return { success: false, error: 'Invalid postcode format' };
  }

  // Check cache first
  const cached = getCachedResult(postcode);
  if (cached) {
    return cached;
  }

  try {
    const encodedPostcode = encodeURIComponent(postcode.trim());
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodedPostcode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        const result = { success: false, error: 'Postcode not found' } as GeocodingResult;
        setCachedResult(postcode, result);
        return result;
      }
      throw new Error(`Postcode.io API returned ${response.status}`);
    }

    const data: PostcodeIOResponse = await response.json();

    if (data.status !== 200 || !data.result) {
      const result = { success: false, error: data.error || 'Failed to geocode postcode' } as GeocodingResult;
      setCachedResult(postcode, result);
      return result;
    }

    const result = {
      success: true,
      latitude: data.result.latitude,
      longitude: data.result.longitude
    };

    setCachedResult(postcode, result);
    return result;

  } catch (error) {
    console.error('Geocoding error:', error);
    return { success: false, error: 'Geocoding service unavailable' };
  }
}

/**
 * Clear the geocoding cache (useful for testing)
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Batch geocode multiple postcodes
 * @param postcodes - Array of UK postcodes
 * @returns Array of GeocodingResult objects
 */
export async function batchGeocodePostcodes(postcodes: string[]): Promise<GeocodingResult[]> {
  return Promise.all(postcodes.map(pc => geocodePostcode(pc)));
}
