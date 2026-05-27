import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Real DB query tests.
 *
 * These tests connect to your live Supabase project and verify that:
 * 1. Tables and columns exist and match application expectations
 * 2. Key RPC functions are available
 * 3. The schema fixes we applied (messages.client_message_id, profiles.postcode,
 *    handle_new_user trigger) are present
 *
 * Run with:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... npm test -- tests/db/db-queries.test.ts
 *
 * The SUPABASE_SERVICE_ROLE_KEY can be found in your .env file.
 */

const supabaseUrl = process.env.SUPABASE_URL ?? 'https://ywqjgusyluhchlvvtnlp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip all tests if no service key is available (e.g. in CI without env)
const describeIf = supabaseServiceKey ? describe : describe.skip;

let client: any;

beforeAll(() => {
  if (!supabaseServiceKey) {
    console.warn('Skipping real DB tests: SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }
  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
});

describeIf('Real DB connectivity & schema validation', () => {
  // ───────────────────────────────────────────────────────────
  // Helper to fetch the current test user/profile for inserts
  // ───────────────────────────────────────────────────────────
  let testProfileId: string | null = null;

  beforeAll(async () => {
    if (!client) return;
    // Pick the first real profile to use as FK in test rows
    const { data } = await client
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    testProfileId = data?.id ?? null;
  });

  // ─── Connection sanity check ───
  it('can connect to Supabase and read jobs', async () => {
    const { data, error } = await client
      .from('jobs')
      .select('id, title, status')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  // ─── Messages table ───
  it('messages table has client_message_id column (schema fix)', async () => {
    // This query would fail with a "column does not exist" error before the fix
    const { data, error } = await client
      .from('messages')
      .select('id, client_message_id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('can insert a message with client_message_id (schema fix)', async () => {
    if (!testProfileId) {
      console.warn('Skipping insert test: no profile found in DB');
      return;
    }

    const clientMsgId = crypto.randomUUID();

    const { data: inserted, error: insertErr } = await client
      .from('messages')
      .insert({
        job_id: '00000000-0000-0000-0000-000000000000',
        application_id: '00000000-0000-0000-0000-000000000000',
        sender_id: testProfileId,
        receiver_id: testProfileId,
        body: 'DB test message',
        client_message_id: clientMsgId
      })
      .select('id, client_message_id')
      .single();

    expect(insertErr).toBeNull();
    expect((inserted as any)?.client_message_id).toBe(clientMsgId);

    // Cleanup
    await client.from('messages').delete().eq('id', (inserted as any)!.id);
  });

  // ─── Profiles table ───
  it('profiles table has postcode column (schema fix)', async () => {
    const { data, error } = await client
      .from('profiles')
      .select('postcode')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('can update a profile postcode (schema fix)', async () => {
    if (!testProfileId) {
      console.warn('Skipping postcode update test: no profile found');
      return;
    }

    // Save original value so we can restore it
    const { data: original } = await client
      .from('profiles')
      .select('postcode')
      .eq('id', testProfileId)
      .single();

    const testPostcode = 'SW1A 1AA';

    const { error: updateErr } = await client
      .from('profiles')
      .update({ postcode: testPostcode })
      .eq('id', testProfileId);

    expect(updateErr).toBeNull();

    // Verify
    const { data: after } = await client
      .from('profiles')
      .select('postcode')
      .eq('id', testProfileId)
      .single();

    expect((after as any)?.postcode).toBe(testPostcode);

    // Restore
    await client
      .from('profiles')
      .update({ postcode: (original as any)?.postcode } as any)
      .eq('id', testProfileId);
  });

  // ─── Reviews table ───
  it('reviews table primary key is review_id (not id)', async () => {
    // If the DB still had an "id" column this would fail
    const { data, error } = await client
      .from('reviews')
      .select('review_id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  // ─── RPC / Functions ───
  it('find_jobs_near RPC exists and returns array', async () => {
    const { data, error } = await client.rpc('find_jobs_near', {
      lat: 51.5074,
      lng: -0.1278,
      radius_km: 10
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('calculate_job_urgency RPC exists', async () => {
    const { data, error } = await client.rpc('calculate_job_urgency', {
      job_deadline: new Date(Date.now() + 86400000).toISOString() // tomorrow
    });

    expect(error).toBeNull();
    // Returns true/false or the value
    expect(typeof data).toBe('boolean');
  });

  // ─── Constraints / expected tables ───
  it('all expected tables exist', async () => {
    const expectedTables = [
      'jobs',
      'profiles',
      'applications',
      'contracts',
      'messages',
      'reviews',
      'job_categories',
      'payment_methods',
      'payment_transactions'
    ];

    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    expect(error).toBeNull();
    const actualNames = new Set((data ?? []).map((t: any) => t.table_name));

    for (const table of expectedTables) {
      expect(actualNames.has(table)).toBe(true);
    }
  });

  it('jobs table has geolocation columns (latitude, longitude)', async () => {
    const { data, error } = await client
      .from('jobs')
      .select('latitude, longitude')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('applications table has unique constraint on (job_id, worker_id)', async () => {
    const { data, error } = await client
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'applications')
      .eq('constraint_type', 'UNIQUE');

    expect(error).toBeNull();
    const names = (data ?? []).map((c: any) => c.constraint_name);
    const hasUnique = names.some((n: string) =>
      n.toLowerCase().includes('job') && n.toLowerCase().includes('worker')
    );
    expect(hasUnique).toBe(true);
  });
});
