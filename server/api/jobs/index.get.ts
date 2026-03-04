import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Job, JobPreview, JobsResponse, JobsQuery } from '~/types/job';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    const client = await serverSupabaseClient(event);
    const query = getQuery(event) as JobsQuery;

    const limit = query.limit ? parseInt(query.limit) : 20;
    const category = query.category;
    const postcode = query.postcode;

    if (!user) {
      // Unauthenticated: return preview only
      let queryBuilder = client
        .from('jobs')
        .select(`
          id, 
          title, 
          description, 
          category_id, 
          postcode, 
          budget_type, 
          created_at,
          category:job_categories!category_id(name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        queryBuilder = queryBuilder.eq('category_id', category);
      }

      if (postcode) {
        queryBuilder = queryBuilder.like('postcode', `${postcode}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message });
      }

      // Transform to preview format
      const previews: JobPreview[] = (data || []).map(job => ({
        id: job.id,
        title: job.title,
        description_preview: job.description.substring(0, 100) + '...',
        category_id: job.category_id,
        category_name: (job as any).category?.name || 'Unknown',
        postcode_area: job.postcode.substring(0, 4),
        budget_type: job.budget_type,
        budget_display: job.budget_type === 'fixed' ? 'Fixed price' : 'Hourly rate',
        created_at: job.created_at,
        cta: 'Sign in to view full details and apply'
      }));

      const response: JobsResponse = { jobs: previews, preview_mode: true };
      return response;
    }

    // Authenticated: return full details
    let queryBuilder = client
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(first_name, last_name),
        category:job_categories!category_id(name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category);
    }

    if (postcode) {
      queryBuilder = queryBuilder.like('postcode', `${postcode}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response: JobsResponse = { jobs: data || [], preview_mode: false };
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