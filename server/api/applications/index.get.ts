import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ApplicationsResponseSchema } from '~/schemas/application';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view your applications' 
      });
    }

    const query = getQuery(event);
    const role = query.role as string;
    const client = await serverSupabaseClient(event);

    let data, error;

    if (role === 'employer') {
      // Get applications for jobs posted by this employer using direct query
      const result = await client
        .from('applications')
        .select(`
          *,
          job:jobs!inner(title, employer_id),
          worker:profiles!worker_id(first_name, last_name)
        `)
        .eq('jobs.employer_id', user.id)
        .order('created_at', { ascending: false });
      
      data = result.data?.map(app => ({
        ...app,
        job_title: app.job?.title,
        worker_name: app.worker ? `${app.worker.first_name} ${app.worker.last_name}` : null
      }));
      error = result.error;
    } else {
      // Default: get applications submitted by this worker
      const result = await client
        .from('applications')
        .select(`
          *,
          job:jobs!inner(title, employer_id),
          employer:profiles!jobs.employer_id(first_name, last_name)
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });
      
      data = result.data?.map(app => ({
        ...app,
        job_title: app.job?.title,
        employer_name: app.employer ? `${app.employer.first_name} ${app.employer.last_name}` : null
      }));
      error = result.error;
    }

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { applications: data || [] };
    
    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationsResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
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
