import { serverSupabaseClient } from '#supabase/server';
import { getRequestIP } from 'h3';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';

export default defineEventHandler(async (event) => {
  try {
    // Rate limit by client IP to prevent mass username enumeration
    const clientIp = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
    await rateLimiters.usernameCheck(clientIp, event);

    const query = getQuery(event);
    const username = query.username as string;

    if (!username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid username format'
      });
    }

    if (username.length > 12) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at most 12 characters'
      });
    }

    const client = await serverSupabaseClient(event);

    // Check if username exists
    const { data, error } = await client
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      logDetailedError(error, 'check-username');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check username availability'
      });
    }

    return {
      available: !data,
      username
    };
  } catch (error: any) {
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'check-username-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'check-username-general');
    throw error;
  }
});
