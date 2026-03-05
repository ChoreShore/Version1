import { createError } from 'h3';

const AUTH_ERROR_MARKERS = ['Auth session missing', 'Supabase', 'session', 'authentication'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UuidValidationOptions {
  label?: string;
  requiredMessage?: string;
  invalidMessage?: string;
}

export function handleSupabaseAuthErrors(error: any): void {
  if (
    error?.statusCode === 500 ||
    error?.statusCode === 401 ||
    (typeof error?.message === 'string' &&
      AUTH_ERROR_MARKERS.some((marker) => error.message.includes(marker)))
  ) {
    throw createError({ statusCode: 401, statusMessage: 'Auth session missing!' });
  }
}

export function ensureAuthenticated<T>(user: T | null | undefined, message = 'Sign in to continue'): NonNullable<T> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: message });
  }
  return user as NonNullable<T>;
}

export function isValidUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function assertValidUuid(
  value: string | null | undefined,
  options: UuidValidationOptions = {}
): string {
  const { label = 'ID', requiredMessage, invalidMessage } = options;

  if (!value) {
    throw createError({ statusCode: 400, statusMessage: requiredMessage ?? `${label} is required` });
  }

  if (!UUID_REGEX.test(value)) {
    throw createError({ statusCode: 400, statusMessage: invalidMessage ?? `Invalid ${label} format` });
  }

  return value;
}
