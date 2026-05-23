import { createClient } from '@supabase/supabase-js';
import { getPostcodeArea } from '~/server/utils/jobValidation';
import { getRelativeTime } from '~/server/utils/time';
import { formatEmployerName } from '~/server/utils/text';

export default defineEventHandler(async (event) => {
  try {
    console.log('[public/workers.get] Starting request');
    
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
    
    console.log('[public/workers.get] Got Supabase client');
    
    const query = getQuery(event) as { limit?: string; category?: string };
    const limit = Math.min(Math.max(parseInt(query.limit ?? '10', 10), 1), 50);

    console.log('[public/workers.get] Fetching workers with limit:', limit, 'category:', query.category);

    // 1. Fetch workers with 'worker' role - simplified query
    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select(`
        id,
        username,
        first_name,
        last_name,
        bio,
        photo_url,
        postcode,
        created_at
      `)
      .contains('roles', ['worker'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw createError({ statusCode: 500, statusMessage: profilesError.message });
    }

    if (!profiles || profiles.length === 0) {
      console.log('[public/workers.get] No workers found');
      return { workers: [] };
    }

    console.log('[public/workers.get] Found', profiles.length, 'workers');

    const workerIds = profiles.map((p: any) => p.id);

    // 2. Parallel fetch of reviews and completed contracts
    const [
      { data: reviews, error: reviewsError },
      { data: contracts, error: contractsError }
    ] = await Promise.all([
      client
        .from('reviews')
        .select('reviewed_user_id, rating')
        .in('reviewed_user_id', workerIds),
      client
        .from('contracts')
        .select('worker_id, status')
        .in('worker_id', workerIds)
        .eq('status', 'completed')
    ]);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }
    
    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
    }

    // 3. Build lookup maps
    const avgRatings = new Map<string, number | null>();
    const totalReviews = new Map<string, number>();
    const completedJobs = new Map<string, number>();

    for (const workerId of workerIds) {
      // Calculate average rating
      const workerReviews = (reviews || []).filter(
        (r: any) => r.reviewed_user_id === workerId
      );
      if (workerReviews.length === 0) {
        avgRatings.set(workerId, null);
      } else {
        const sum = workerReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        avgRatings.set(workerId, parseFloat((sum / workerReviews.length).toFixed(1)));
      }
      totalReviews.set(workerId, workerReviews.length);

      // Count completed jobs
      const workerContracts = (contracts || []).filter(
        (c: any) => c.worker_id === workerId
      );
      completedJobs.set(workerId, workerContracts.length);
    }

    // 4. Assemble response with anonymized data
    const workers = profiles.map((profile: any) => {
      const workerId = profile.id;
      
      // Anonymize name - show first initial + last name only
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      const displayName = firstName && lastName 
        ? `${firstName.charAt(0)}. ${lastName}` 
        : profile.username || 'Worker';

      return {
        id: workerId,
        username: profile.username,
        display_name: displayName,
        bio: profile.bio || null,
        photo_url: profile.photo_url || null,
        postcode_area: profile.postcode ? getPostcodeArea(profile.postcode) : null,
        average_rating: avgRatings.get(workerId) ?? null,
        total_reviews: totalReviews.get(workerId) ?? 0,
        completed_jobs: completedJobs.get(workerId) ?? 0,
        member_since: getRelativeTime(profile.created_at),
        is_verified: true
      };
    });

    console.log('[public/workers.get] Returning', workers.length, 'workers');
    return { workers };
  } catch (error: any) {
    console.error('[public/workers.get] Error:', error);
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to load workers' });
  }
});
