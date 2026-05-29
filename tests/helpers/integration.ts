// Integration test helper: bridge composables -> server handlers -> mocked Supabase
import { vi } from 'vitest';
import { readBody, getQuery, getRouterParam } from 'h3';

(globalThis as any).readBody = readBody;
(globalThis as any).getQuery = getQuery;
(globalThis as any).getRouterParam = getRouterParam;

export interface MockEvent {
  body?: any;
  headers?: Record<string, string>;
  method?: string;
  context?: Record<string, any>;
  query?: Record<string, any>;
  url?: string;
  formData?: any;
}

export function createMockEvent(overrides: MockEvent = {}) {
  return {
    body: {},
    headers: {},
    method: 'GET',
    context: { params: {} },
    query: {},
    url: 'http://localhost',
    ...overrides,
  };
}

export async function invokeHandler(
  modulePath: string,
  eventOverrides: MockEvent = {}
) {
  const { default: handler } = await import(modulePath);
  const event = createMockEvent(eventOverrides);
  return await handler(event);
}

export function createIntegrationFetch(
  overrides: { user?: any; supabaseClient?: any } = {}
) {
  return async (url: string, options?: any) => {
    const method = (options?.method ?? 'GET').toUpperCase();
    const key = `${method} ${url}`;

    // Normalize URL (strip query params for lookup)
    const cleanUrl = url.split('?')[0];

    // Direct handler invocation for known routes
    if (cleanUrl === '/api/jobs' && method === 'GET') {
      return invokeHandler('~/server/api/jobs/index.get', { query: options?.params });
    }
    if (cleanUrl === '/api/jobs' && method === 'POST') {
      return invokeHandler('~/server/api/jobs/index.post', { body: options?.body });
    }
    if (cleanUrl === '/api/jobs/categories' && method === 'GET') {
      return invokeHandler('~/server/api/jobs/categories.get');
    }
    const jobsMatch = cleanUrl.match(/^\/api\/jobs\/([a-f0-9-]+)$/);
    if (jobsMatch && method === 'GET') {
      return invokeHandler('~/server/api/jobs/[id].get', { context: { params: { id: jobsMatch[1] } } });
    }
    if (jobsMatch && method === 'PATCH') {
      return invokeHandler('~/server/api/jobs/[id].patch', { body: options?.body, context: { params: { id: jobsMatch[1] } } });
    }
    if (jobsMatch && method === 'DELETE') {
      return invokeHandler('~/server/api/jobs/[id].delete', { context: { params: { id: jobsMatch[1] } } });
    }
    if (cleanUrl === '/api/applications' && method === 'GET') {
      return invokeHandler('~/server/api/applications/index.get');
    }
    if (cleanUrl === '/api/applications' && method === 'POST') {
      return invokeHandler('~/server/api/applications/index.post', { body: options?.body });
    }
    if (cleanUrl.startsWith('/api/applications/') && method === 'PATCH') {
      const id = cleanUrl.replace('/api/applications/', '');
      return invokeHandler('~/server/api/applications/[id].patch', {
        body: options?.body,
        context: { params: { id } },
      });
    }
    if (cleanUrl === '/api/contracts' && method === 'POST') {
      return invokeHandler('~/server/api/contracts/index.post', { body: options?.body });
    }
    if (cleanUrl === '/api/reviews' && method === 'GET') {
      return invokeHandler('~/server/api/reviews/index.get', { query: options?.params });
    }
    if (cleanUrl === '/api/reviews' && method === 'POST') {
      return invokeHandler('~/server/api/reviews/index.post', { body: options?.body });
    }
    if (cleanUrl === '/api/payments' && method === 'GET') {
      return invokeHandler('~/server/api/payments/index.get');
    }
    if (cleanUrl === '/api/payments/create-intent' && method === 'POST') {
      return invokeHandler('~/server/api/payments/create-intent.post', { body: options?.body });
    }
    if (cleanUrl === '/api/payments/confirm' && method === 'POST') {
      return invokeHandler('~/server/api/payments/confirm.post', { body: options?.body });
    }
    if (cleanUrl === '/api/payments/payout' && method === 'POST') {
      return invokeHandler('~/server/api/payments/payout.post', { body: options?.body });
    }
    if (cleanUrl === '/api/payments/methods/connect' && method === 'POST') {
      return invokeHandler('~/server/api/payments/methods/connect.post', { body: options?.body });
    }
    if (cleanUrl === '/api/messages' && method === 'POST') {
      return invokeHandler('~/server/api/messages/index.post', { body: options?.body });
    }
    const messagesMatch = cleanUrl.match(/^\/api\/messages\/([a-f0-9-]+)$/);
    if (messagesMatch && method === 'GET') {
      return invokeHandler('~/server/api/messages/[jobId].get', { context: { params: { id: messagesMatch[1] } } });
    }
    if (cleanUrl === '/api/contracts' && method === 'POST') {
      return invokeHandler('~/server/api/contracts/index.post', { body: options?.body });
    }
    const contractsMatch = cleanUrl.match(/^\/api\/contracts\/([a-f0-9-]+)$/);
    if (contractsMatch && method === 'GET') {
      return invokeHandler('~/server/api/contracts/[id].get', { context: { params: { id: contractsMatch[1] } } });
    }
    if (cleanUrl === '/api/auth/signin' && method === 'POST') {
      return invokeHandler('~/server/api/auth/signin.post', { body: options?.body });
    }
    if (cleanUrl === '/api/auth/signup' && method === 'POST') {
      return invokeHandler('~/server/api/auth/signup.post', { body: options?.body });
    }
    if (cleanUrl === '/api/profile/bio' && method === 'PATCH') {
      return invokeHandler('~/server/api/profile/bio.patch', { body: options?.body });
    }
    if (cleanUrl === '/api/profile/photo' && method === 'POST') {
      return invokeHandler('~/server/api/profile/photo.post', {
        body: options?.body,
        formData: {
          get: (key: string) =>
            key === 'photo'
              ? new File(['test'], 'test.jpg', { type: 'image/jpeg' })
              : null,
        },
      });
    }

    throw new Error(`No handler registered for ${method} ${cleanUrl}`);
  };
}
