import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateUpdateApplication } from '~/schemas/application';
import { rateLimiters } from '~/server/utils/rateLimit';
import { ensureAuthenticated, rethrowIfAuthError } from '~/server/utils/api';
import {
  fetchApplication,
  authorizeAction,
  fetchJob,
  validateStatusTransition,
  validateJobOpenForAccept,
  fetchPaymentEvent,
  requirePaymentForFixedPrice,
  preventDoubleHire,
  processAcceptance,
  updateApplication,
  logHistory,
  buildResponse
} from '~/server/services/applications';

export default defineEventHandler(async (event) => {
  try {
    const applicationId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to update applications'
    );

    if (!applicationId) {
      throw createError({ statusCode: 400, statusMessage: 'Application ID is required' });
    }

    if (!applicationId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid application ID format' });
    }

    rateLimiters.applications(user.id);

    const validation = validateUpdateApplication(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;
    const client = await serverSupabaseClient(event);

    const currentApp = await fetchApplication(client, applicationId);
    await authorizeAction(client, applicationId, currentApp, user.id, validatedData.status);

    const job = await fetchJob(client, currentApp.job_id);
    validateStatusTransition(currentApp.status, validatedData.status);
    validateJobOpenForAccept(job, validatedData.status);

    const paymentEvent = await fetchPaymentEvent(client, applicationId);
    requirePaymentForFixedPrice(job, paymentEvent, validatedData.status);
    await preventDoubleHire(client, currentApp.job_id, validatedData.status);

    if (validatedData.status === 'accepted') {
      const updatedApp = await processAcceptance(client, applicationId, user.id, job, paymentEvent);
      return buildResponse(updatedApp);
    }

    const updatedApp = await updateApplication(client, applicationId, currentApp, validatedData);

    if (validatedData.status && validatedData.status !== currentApp.status) {
      await logHistory(client, applicationId, currentApp.status, validatedData.status, user.id);
    }

    return buildResponse(updatedApp);
  } catch (error: any) {
    rethrowIfAuthError(error);
    throw error;
  }
});
