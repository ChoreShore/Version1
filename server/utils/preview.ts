// server/utils/jobs/preview.ts
import type { JobsQueryInput, JobsResponseInput, JobPreviewInput } from '~/schemas/job';

export async function fetchPreviewJobs(
  client: {
    from: (table: string) => {
      select: (columns: string) => any;
    };
  },
  query: JobsQueryInput
): Promise<JobsResponseInput> {
  const limit = query.limit ? parseInt(query.limit, 10) : 20;

  let builder = client
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

  if (query.category) {
    builder = builder.eq('category_id', query.category);
  }

  if (query.postcode) {
    builder = builder.like('postcode', `${query.postcode}%`);
  }

  const { data, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const previews: JobPreviewInput[] = (data || []).map((job: any) => ({
    id: job.id,
    title: job.title,
    description_preview: `${job.description.slice(0, 100)}...`,
    category_id: job.category_id,
    category_name: job.category?.name ?? 'Unknown',
    postcode_area: job.postcode.slice(0, 4),
    budget_type: job.budget_type,
    budget_display: job.budget_type === 'fixed' ? 'Fixed price' : 'Hourly rate',
    created_at: job.created_at,
    cta: 'Sign in to view full details and apply'
  }));

  return {
    jobs: previews,
    preview_mode: true
  };
}