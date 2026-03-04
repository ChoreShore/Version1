import { beforeAll, afterAll } from 'vitest';

// Set up test environment variables
beforeAll(async () => {
  // Set environment variables for tests - keep them for all tests
  process.env.SUPABASE_URL = 'https://ywqjgusyluhchlvvtnlp.supabase.co';
  process.env.SUPABASE_KEY = 'sb_publishable_RsC53VHhXi1OkdGtcQqokg_fPq-GyXA';
  process.env.NODE_ENV = 'test';
  
  // Add service role key for database operations
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key-here';
});

afterAll(() => {
  // Clean up after all tests
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;
  delete process.env.NODE_ENV;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});
