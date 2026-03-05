import { beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL
    ?? 'https://ywqjgusyluhchlvvtnlp.supabase.co';
  process.env.SUPABASE_KEY = process.env.SUPABASE_KEY
    ?? 'sb_publishable_RsC53VHhXi1OkdGtcQqokg_fPq-GyXA';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    ?? 'sb_anonymous_RsC53VHhXi1OkdGtcQqokg_fPq-GyXA';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? 'your-service-role-key-here';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Ensure any spies/mocks created by individual tests don’t leak.
  vi.restoreAllMocks();
});

afterAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NODE_ENV;
});