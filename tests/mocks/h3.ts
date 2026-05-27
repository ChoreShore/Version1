// Minimal mock of h3 for Vitest
export function createError(opts: { statusCode?: number; statusMessage?: string; message?: string; data?: any }) {
  const error = new Error(opts.message || opts.statusMessage || 'Unknown error') as Error & { statusCode?: number; statusMessage?: string; data?: any };
  error.statusCode = opts.statusCode;
  error.statusMessage = opts.statusMessage;
  error.data = opts.data;
  return error;
}

export function defineEventHandler(handler: any) {
  return handler;
}

export function readBody(event: any) {
  return Promise.resolve(event?.body ?? {});
}

export function getQuery(event: any) {
  return event?.query ?? {};
}

export function getRouterParams(event: any) {
  return event?.context?.params ?? {};
}

export function getRouterParam(event: any, name: string) {
  return event?.context?.params?.[name] ?? undefined;
}

export function setResponseStatus(event: any, code: number) {
  if (event) {
    event.statusCode = code;
  }
}

export function sendRedirect(event: any, location: string) {
  return Promise.resolve();
}

export function getRequestHeader(event: any, name: string) {
  return event?.headers?.[name.toLowerCase()] ?? undefined;
}

export function getRequestURL(event: any) {
  return new URL(event?.url ?? 'http://localhost');
}

export function getRequestIP(event: any, _opts?: any) {
  return event?.headers?.['x-forwarded-for'] ?? '127.0.0.1';
}
