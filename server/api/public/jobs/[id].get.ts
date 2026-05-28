import { createClient } from '@supabase/supabase-js';
import { getPostcodeArea } from '~/server/utils/jobValidation';
import { getRelativeTime } from '~/server/utils/time';
import { formatEmployerName } from '~/server/utils/text';

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
    
    const jobId = getRouterParam(event, 'id');
    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // 1. Fetch job (don't join profiles — RLS may block anon reads)
    const { data: job, error: jobError } = await client
      .from('jobs')
      .select(`
        *,
        category:job_categories!category_id(name)
      `)
      .eq('id', jobId)
      .eq('status', 'open')
      .single();

    if (jobError || !job) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    const employerId = job.employer_id;

    // 2. Parallel fetch stats + employer profile separately
    const [
      { data: reviews },
      { data: employerJobs },
      { data: applications },
      { data: otherJobs },
      { data: identityData },
      { data: employerProfile, error: profileError }
    ] = await Promise.all([
      client.from('reviews').select('reviewed_user_id, rating').eq('reviewed_user_id', employerId),
      client.from('jobs').select('id').eq('employer_id', employerId),
      client.from('applications').select('job_id').eq('job_id', jobId),
      client
        .from('jobs')
        .select('id, title, budget_type, budget_amount, created_at, postcode, category:job_categories!category_id(name)')
        .eq('employer_id', employerId)
        .eq('status', 'open')
        .neq('id', jobId)
        .order('created_at', { ascending: false })
        .limit(3),
      client.auth.admin.getUserById(employerId),
      client.from('profiles').select('first_name, last_name, photo_url, username').eq('id', employerId).single()
    ]);

    // Handle profile query error - profile might not exist
    if (profileError) {
      console.warn('[public/jobs/[id].get] Profile not found for employer:', employerId);
    }

    // 3. Build lookups
    const employerReviews = (reviews || []).filter((r: any) => r.reviewed_user_id === employerId);
    const avgRating = employerReviews.length > 0
      ? parseFloat((employerReviews.reduce((s: number, r: any) => s + r.rating, 0) / employerReviews.length).toFixed(1))
      : null;

    const userData = (identityData as any)?.data?.user;
    const isVerified = userData?.user_metadata?.identity_verification?.status === 'verified';

    // 4. Assemble response
    return {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        category_name: job.category?.name ?? 'Unknown',
        postcode_area: getPostcodeArea(job.postcode),
        budget_type: job.budget_type,
        budget_amount: job.budget_amount,
        deadline: job.deadline,
        is_recurring: job.is_recurring,
        is_urgent: job.is_urgent,
        created_at: job.created_at,
        posted_at_relative: getRelativeTime(job.created_at),
        latitude: job.latitude,
        longitude: job.longitude
      },
      employer: {
        id: employerId,
        display_name: formatEmployerName(employerProfile?.first_name ?? null, employerProfile?.last_name ?? null),
        username: employerProfile?.username ?? null,
        photo_url: employerProfile?.photo_url ?? null,
        average_rating: avgRating,
        total_jobs_posted: (employerJobs || []).length,
        is_verified: isVerified
      },
      application_count: (applications || []).length,
      other_jobs: (otherJobs || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        budget_type: j.budget_type,
        budget_amount: j.budget_amount,
        category_name: j.category?.name ?? 'Unknown',
        postcode_area: getPostcodeArea(j.postcode)
      }))
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('[public/jobs/[id].get] Error:', error);
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to load job' });
  }
});
