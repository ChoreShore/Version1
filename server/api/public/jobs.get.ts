import { createClient } from '@supabase/supabase-js';
import { PublicJobsResponseSchema } from '~/schemas/job';
import { getPostcodeArea } from '~/server/utils/jobValidation';
import { getRelativeTime } from '~/server/utils/time';
import { formatEmployerName } from '~/server/utils/text';
import { logger } from '~/server/utils/logger';
import type { PublicJobPreviewInput } from '~/schemas/job';

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
    
    const query = getQuery(event) as { limit?: string; category?: string };
    const rawLimit = parseInt(query.limit ?? '10', 10);
    const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 20);

    // 1. Fetch open jobs (don't join profiles — RLS may block anon reads)
    let jobsQuery = client
      .from('jobs')
      .select(`
        id,
        title,
        description,
        category_id,
        postcode,
        budget_type,
        budget_amount,
        is_urgent,
        is_recurring,
        created_at,
        employer_id,
        category:job_categories!category_id(name)
      `)
      .eq('status', 'open');

    // Apply category filter if provided
    if (query.category) {
      jobsQuery = jobsQuery.eq('category_id', query.category);
    }

    const { data: jobs, error: jobsError } = await jobsQuery
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      throw createError({ statusCode: 400, statusMessage: jobsError.message });
    }

    if (!jobs || jobs.length === 0) {
      return PublicJobsResponseSchema.parse({ jobs: [] });
    }

    const jobIds = jobs.map((j: any) => j.id);
    const employerIds = [...new Set(jobs.map((j: any) => j.employer_id))];

    // 2. Parallel fetch of stats + employer profiles separately
    const [
      { data: reviews },
      { data: employerJobs },
      { data: applications },
      { data: employerProfiles }
    ] = await Promise.all([
      client
        .from('reviews')
        .select('reviewed_user_id, rating')
        .in('reviewed_user_id', employerIds),
      client
        .from('jobs')
        .select('employer_id')
        .in('employer_id', employerIds),
      client
        .from('applications')
        .select('job_id')
        .in('job_id', jobIds),
      client
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', employerIds)
    ]);

    // 3. Build lookup maps
    const employerNameMap = new Map<string, { first_name: string | null; last_name: string | null }>();
    for (const ep of employerProfiles || []) {
      employerNameMap.set((ep as any).id, {
        first_name: (ep as any).first_name ?? null,
        last_name: (ep as any).last_name ?? null
      });
    }

    const avgRatings = new Map<string, number | null>();
    for (const employerId of employerIds) {
      const employerReviews = (reviews || []).filter(
        (r: any) => r.reviewed_user_id === employerId
      );
      if (employerReviews.length === 0) {
        avgRatings.set(employerId, null);
      } else {
        const sum = employerReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        avgRatings.set(employerId, parseFloat((sum / employerReviews.length).toFixed(1)));
      }
    }

    const totalJobsPerEmployer = new Map<string, number>();
    for (const job of employerJobs || []) {
      const id = (job as any).employer_id;
      totalJobsPerEmployer.set(id, (totalJobsPerEmployer.get(id) || 0) + 1);
    }

    const applicationsPerJob = new Map<string, number>();
    for (const app of applications || []) {
      const id = (app as any).job_id;
      applicationsPerJob.set(id, (applicationsPerJob.get(id) || 0) + 1);
    }

    // 4. Assemble response
    const publicJobs: PublicJobPreviewInput[] = jobs.map((job: any) => {
      const employerId: string = job.employer_id;
      const ep = employerNameMap.get(employerId);
      const employerFirstName = ep?.first_name ?? null;
      const employerLastName = ep?.last_name ?? null;

      const tags: string[] = [];
      if (job.is_urgent) tags.push('Urgent');
      if (job.is_recurring) tags.push('Recurring');
      if (job.category?.name) tags.push(job.category.name);

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        category_id: job.category_id,
        category_name: job.category?.name ?? 'Unknown',
        postcode_area: getPostcodeArea(job.postcode),
        budget_type: job.budget_type,
        budget_amount: job.budget_amount,
        created_at: job.created_at,
        posted_at_relative: getRelativeTime(job.created_at),
        employer: {
          display_name: formatEmployerName(employerFirstName, employerLastName),
          average_rating: avgRatings.get(employerId) ?? null,
          total_jobs_posted: totalJobsPerEmployer.get(employerId) ?? 0
        },
        application_count: applicationsPerJob.get(job.id) ?? 0,
        tags
      };
    });

    const response = { jobs: publicJobs };

    try {
      return PublicJobsResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('[public/jobs.get] Validation failed', validationError, 'public/jobs.get');
      return { jobs: jobs };
    }
  } catch (error: any) {
    console.error('[public/jobs.get] Error:', error);
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to load jobs' });
  }
});
