import { serverSupabaseClient } from '#supabase/server';
import type { NearJobsResponse } from '~/types/job';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    
    const lat = parseFloat(query.lat as string);
    const lng = parseFloat(query.lng as string);
    const distance = query.distance ? parseFloat(query.distance as string) : 10;

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      throw createError({ statusCode: 400, statusMessage: 'Valid latitude and longitude are required' });
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      throw createError({ statusCode: 400, statusMessage: 'Latitude must be between -90 and 90' });
    }

    if (lng < -180 || lng > 180) {
      throw createError({ statusCode: 400, statusMessage: 'Longitude must be between -180 and 180' });
    }

    // Validate distance
    if (distance <= 0 || distance > 1000) {
      throw createError({ statusCode: 400, statusMessage: 'Distance must be between 0 and 1000 km' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .rpc('find_jobs_near', { 
        search_lat: lat, 
        search_lng: lng, 
        distance_km: distance 
      });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response: NearJobsResponse = { jobs: data || [] };
    return response;
  } catch (error: any) {
    // Handle Supabase client initialization errors
    if (error.message?.includes('Auth session missing') || 
        error.message?.includes('Supabase') ||
        error.message?.includes('session') ||
        error.message?.includes('authentication') ||
        error.statusCode === 500 ||
        error.statusCode === 401) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Auth session missing!' 
      });
    }
    throw error;
  }
});