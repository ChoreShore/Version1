import { validateUpdateApplication, ApplicationResponseSchema } from '~/schemas/application';
import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser } from '~/server/utils/api';
import { ensureApplicationOwner } from '~/server/utils/api';
import { logger, logDetailedError } from '~/server/utils/logger';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';
import { rateLimiters } from '~/server/utils/rateLimit';
import { assertValidUuid } from '~/server/utils/api';
import { sendNotificationEmail } from '~/server/utils/email';
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
    const applicationId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Application ID'
    });
    const body = await readBody(event);
    const user = await getAuthenticatedUser(event, 'Sign in to update applications');

    const validation = validateUpdateApplication(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    await rateLimiters.applications(user.id);
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

      // Notify applicant of acceptance (fire-and-forget)
      sendNotificationEmail(event, {
        userId: currentApp.worker_id,
        subject: `Your application for "${job.title}" was accepted`,
        html: `<p>Hi there,</p><p>Great news — your application for "<strong>${job.title}</strong>" has been accepted.</p><p>Log in to your dashboard to view the contract details.</p>`,
        idempotencyKey: `application-accepted/${applicationId}`
      }).catch(() => {});

      return buildResponse(updatedApp);
    }

    const updatedApp = await updateApplication(client, applicationId, currentApp, validatedData);

    if (validatedData.status && validatedData.status !== currentApp.status) {
      await logHistory(client, applicationId, currentApp.status, validatedData.status, user.id);
    }

    // Notify applicant of rejection (fire-and-forget)
    if (validatedData.status === 'rejected') {
      sendNotificationEmail(event, {
        userId: currentApp.worker_id,
        subject: `Update on your application for "${job.title}"`,
        html: `<p>Hi there,</p><p>Unfortunately, your application for "<strong>${job.title}</strong>" was not successful this time.</p><p>Don't be discouraged — there are plenty of other jobs waiting for you on ChoreShore.</p>`,
        idempotencyKey: `application-rejected/${applicationId}`
      }).catch(() => {});
    }

    return buildResponse(updatedApp);
  } catch (error: any) {
    throw error;
  }
});
