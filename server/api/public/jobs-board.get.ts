import { createClient } from '@supabase/supabase-js';
import { JobsBoardResponseSchema } from '~/schemas/job';
import { getPostcodeArea } from '~/server/utils/jobValidation';
import { getRelativeTime } from '~/server/utils/time';
import { milesToKm, kmToMiles } from '~/server/utils/distance';
import type { JobsBoardJobInput } from '~/schemas/job';

export default defineEventHandler(async (event) => {
  try {
    // Use direct Supabase client instead of serverSupabaseClient to avoid headers issue
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({ statusCode: 500, statusMessage: 'Supabase configuration missing' });
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const query = getQuery(event) as {
      lat?: string;
      lng?: string;
      distance?: string;
      limit?: string;
      offset?: string;
    };

    const lat = parseFloat(query.lat ?? '');
    const lng = parseFloat(query.lng ?? '');
    const distanceMiles = query.distance ? parseFloat(query.distance) : 50;
    const limit = Math.min(Math.max(parseInt(query.limit ?? '20', 10), 1), 100);
    const offset = Math.max(parseInt(query.offset ?? '0', 10), 0);

    if (isNaN(lat) || isNaN(lng)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid latitude and longitude are required'
      });
    }

    if (distanceMiles <= 0 || distanceMiles > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Distance must be between 0 and 500 miles'
      });
    }

    // Convert miles to km for the RPC
    const distanceKm = milesToKm(distanceMiles);

    // 1. Find nearby job IDs with distances
    const { data: nearJobs, error: nearError } = await client.rpc(
      'find_jobs_near',
      {
        search_lat: lat,
        search_lng: lng,
        max_distance_km: distanceKm
      }
    );

    if (nearError) {
      throw createError({ statusCode: 400, statusMessage: nearError.message });
    }

    if (!nearJobs || nearJobs.length === 0) {
      return JobsBoardResponseSchema.parse({ jobs: [], total: 0 });
    }

    const total = nearJobs.length;

    // Apply pagination
    const paginatedNearJobs = nearJobs.slice(offset, offset + limit);
    const jobIds = paginatedNearJobs.map((j: any) => j.job_id);

    // Build distance map (km -> miles)
    const distanceMap = new Map<string, number>();
    for (const job of paginatedNearJobs) {
      const miles = Math.round(kmToMiles(job.distance_km) * 10) / 10;
      distanceMap.set(job.job_id, miles);
    }

    // 2. Fetch full job details
    const { data: jobs, error: jobsError } = await client
      .from('jobs')
      .select(
        `
        id,
        title,
        budget_type,
        budget_amount,
        created_at,
        postcode,
        category:job_categories!category_id(name)
      `
      )
      .in('id', jobIds)
      .eq('status', 'open');

    if (jobsError) {
      throw createError({ statusCode: 400, statusMessage: jobsError.message });
    }

    // 3. Assemble response, preserving distance order
    const jobMap = new Map();
    for (const job of jobs || []) {
      jobMap.set(job.id, job);
    }

    const boardJobs: JobsBoardJobInput[] = paginatedNearJobs
      .map((near: any) => {
        const job = jobMap.get(near.job_id);
        if (!job) return null;

        return {
          id: job.id,
          title: job.title,
          budget_type: job.budget_type,
          budget_amount: job.budget_amount,
          distance_miles: distanceMap.get(near.job_id) ?? 0,
          posted_at_relative: getRelativeTime(job.created_at),
          category_name: job.category?.name ?? 'Unknown',
          postcode_area: getPostcodeArea(job.postcode)
        };
      })
      .filter(Boolean) as JobsBoardJobInput[];

    const hasMore = total > offset + limit;

    return { jobs: boardJobs, hasMore };
  } catch (error: any) {
    console.error('[public/jobs-board.get] Error:', error);
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to load jobs board' });
  }
});
