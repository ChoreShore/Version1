import { createError, getRequestHeader } from 'h3';
import type { H3Event } from 'h3';

/**
 * Validate Origin header to prevent CSRF attacks
 * This ensures that state-changing requests come from the same origin
 */
export function validateOrigin(event: H3Event): void {
  const origin = getRequestHeader(event, 'origin');
  const referer = getRequestHeader(event, 'referer');
  const host = getRequestHeader(event, 'host');

  // Get the allowed origin from environment or use the request host
  const allowedOrigin = process.env.ALLOWED_ORIGIN || `https://${host}`;

  // Check Origin header first (preferred)
  if (origin) {
    if (origin !== allowedOrigin && origin !== allowedOrigin.replace(/^https:/, 'http:')) {
      console.warn(`CSRF protection: Invalid Origin header. Expected: ${allowedOrigin}, Got: ${origin}`);
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid origin for this request'
      });
    }
    return;
  }

  // Fallback to Referer header if Origin is not present
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      
      if (refererOrigin !== allowedOrigin && refererOrigin !== allowedOrigin.replace(/^https:/, 'http:')) {
        console.warn(`CSRF protection: Invalid Referer header. Expected: ${allowedOrigin}, Got: ${refererOrigin}`);
        throw createError({
          statusCode: 403,
          statusMessage: 'Invalid origin for this request'
        });
      }
    } catch (error) {
      console.error('CSRF protection: Failed to parse Referer header:', error);
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid origin for this request'
      });
    }
  }

  // If neither Origin nor Referer is present, reject the request for safety
  // This is more strict but provides better security
  throw createError({
    statusCode: 403,
    statusMessage: 'Origin or Referer header required'
  });
}

/**
 * Middleware to apply CSRF protection to state-changing requests
 * Should be used in POST, PUT, DELETE, PATCH endpoints
 */
export function requireCsrfProtection(event: H3Event): void {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests (they don't modify state)
  const method = event.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  // Apply Origin validation for state-changing requests
  validateOrigin(event);
}
