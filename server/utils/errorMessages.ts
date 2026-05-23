/**
 * Standardized error messages for API responses
 * These messages are user-friendly and don't reveal internal system details
 */

export const ErrorMessages = {
  // Authentication errors
  AUTH_REQUIRED: 'Authentication required. Please sign in.',
  AUTH_SESSION_MISSING: 'Your session has expired. Please sign in again.',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_EMAIL_EXISTS: 'An account with this email already exists.',
  AUTH_WEAK_PASSWORD: 'Password does not meet security requirements.',
  
  // Authorization errors
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_OWNER: 'You can only access your own resources.',
  ROLE_REQUIRED: 'You do not have the required role for this action.',
  
  // Validation errors
  VALIDATION_FAILED: 'Please check your information and try again.',
  INVALID_ID: 'Invalid ID format.',
  INVALID_EMAIL: 'Invalid email address.',

  // Resource errors
  NOT_FOUND: "We couldn't find what you're looking for.",
  RESOURCE_EXISTS: 'This resource already exists.',
  RESOURCE_LOCKED: 'This resource is currently locked.',
  
  // Rate limiting
  RATE_LIMITED: 'Too many requests. Please try again later.',
  
  // Server errors
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  
  // Specific resource errors
  JOB_NOT_FOUND: 'Job not found.',
  APPLICATION_NOT_FOUND: 'Application not found.',
  CONTRACT_NOT_FOUND: 'Contract not found.',
  USER_NOT_FOUND: 'User not found.',
  
  // Business logic errors
  JOB_CLOSED: 'This job is no longer accepting applications.',
  APPLICATION_WITHDRAWN: 'This application has been withdrawn.',
  CONTRACT_ALREADY_EXISTS: 'A contract already exists for this application.',
  INVALID_STATUS_TRANSITION: 'Invalid status transition.',
  PAYMENT_REQUIRED: 'Payment required before proceeding.',
  
  // Generic messages
  BAD_REQUEST: 'Invalid request.',
  UNAUTHORIZED: 'Unauthorized access.',
  CONFLICT: 'Request conflicts with existing data.',
} as const;

export type ErrorMessageKey = keyof typeof ErrorMessages;

/**
 * Get a standardized error message
 * @param key - Error message key
 * @returns User-friendly error message
 */
export function getErrorMessage(key: ErrorMessageKey): string {
  return ErrorMessages[key];
}

/**
 * Log detailed error information server-side while returning generic message to client
 * @param error - The actual error object
 * @param context - Additional context for logging
 */
// logDetailedError is now exported from logger.ts - this file is kept for backwards compatibility
export { logDetailedError } from '~/server/utils/logger';
