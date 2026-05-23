import { UpdateJobInput, JobResponseSchema, validateUpdateJob } from '~/schemas/job';
import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser, assertValidUuid, ensureJobOwner } from '~/server/utils/api';
import { logger } from '~/server/utils/logger';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['open'],
  open: ['draft', 'closed'],
  closed: ['open', 'completed'],
  completed: []
};

function isValidStatusTransition(from: string | undefined, to: string): boolean {
  if (!from || from === to) return true;
  const allowed = VALID_STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to update job details');
    const jobId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Job ID'
    });

    const body = await readBody(event);
    
    const validation = validateUpdateJob(body);
    if (!validation.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const client = await serverSupabaseClient(event);

    // Authorization check: ensure user owns this job
    await ensureJobOwner(client, jobId, user.id);

    // Fetch current status for validation
    const { data: job } = await client
      .from('jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    // Validate status transition using state machine
    if (body.status && !isValidStatusTransition(job.status, body.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid status transition: cannot move from "${job.status}" to "${body.status}"`
      });
    }

    // Prevent employers from silently changing material job terms after workers have applied
    const BLOCKED_FIELDS_AFTER_APPLICATIONS = ['budget_amount', 'budget_type', 'deadline', 'description'] as const;
    const blockedFieldsRequested = BLOCKED_FIELDS_AFTER_APPLICATIONS.filter(
      (field) => body[field as keyof typeof body] !== undefined
    );

    if (blockedFieldsRequested.length > 0) {
      const { data: applications } = await client
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .limit(1);

      if (applications && applications.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Cannot edit ${blockedFieldsRequested.join(', ')} after applications have been submitted. Job terms are frozen to protect applicants.`
        });
      }
    }

    // Prevent budget_amount changes if contracts exist for this job
    if (body.budget_amount !== undefined) {
      const { data: contracts } = await client
        .from('contracts')
        .select('id')
        .eq('job_id', jobId)
        .limit(1);

      if (contracts && contracts.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot edit job budget amount after contracts have been created. Budget is frozen at contract creation time.'
        });
      }
    }

    // Re-validate deadline is in the future if provided
    if (body.deadline !== undefined) {
      const deadlineDate = new Date(body.deadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Deadline must be a valid date in the future'
        });
      }
    }

    // Validate category if provided (must exist and be active)
    if (body.category_id) {
      const { data: category } = await client
        .from('job_categories')
        .select('id, is_active')
        .eq('id', body.category_id)
        .single();

      if (!category) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid category ID' });
      }

      if (category.is_active === false) {
        throw createError({ statusCode: 400, statusMessage: 'Selected category is inactive' });
      }
    }

    const { data, error } = await client
      .from('jobs')
      .update(body)
      .eq('id', jobId)
      .select(`
        *,
        employer:profiles!employer_id(first_name, last_name),
        category:job_categories!category_id(name)
      `)
      .single();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { job: data };
    
    // Validate response with Zod schema
    try {
      return JobResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'jobs/[id].patch');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});