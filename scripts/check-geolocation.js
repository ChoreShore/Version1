import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ywqjgusyluhchlvvtnlp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY env var is required');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
  console.log('=== Supabase Geolocation Diagnostic ===\n');

  // 1. Check if PostGIS extension is enabled
  console.log('1. PostGIS Extension');
  const { data: extData, error: extError } = await client
    .from('pg_extension')
    .select('extname, extversion')
    .eq('extname', 'postgis');

  if (extError) {
    console.error('   Error:', extError.message);
  } else if (extData.length === 0) {
    console.log('   ❌ PostGIS is NOT enabled');
  } else {
    console.log('   ✅ PostGIS enabled, version:', extData[0].extversion);
  }

  // 2. Check if find_jobs_near function exists
  console.log('\n2. find_jobs_near Function');
  const { data: funcData, error: funcError } = await client
    .rpc('find_jobs_near', { search_lat: 51.5, search_lng: -0.1, max_distance_km: 1 })
    .limit(1);

  if (funcError) {
    console.log('   ❌ Function call failed:', funcError.message);
  } else {
    console.log('   ✅ Function exists and is callable');
  }

  // 3. Check jobs table columns
  console.log('\n3. Jobs Table Schema');
  const { data: sampleJob, error: sampleError } = await client
    .from('jobs')
    .select('latitude, longitude, postcode')
    .limit(1)
    .maybeSingle();

  if (sampleError) {
    console.log('   Error checking jobs table:', sampleError.message);
  } else if (!sampleJob) {
    console.log('   ⚠️  No jobs in table yet (columns cannot be verified)');
  } else {
    const hasLat = sampleJob.latitude !== undefined;
    const hasLng = sampleJob.longitude !== undefined;
    const hasPostcode = sampleJob.postcode !== undefined;
    console.log(`   Latitude column: ${hasLat ? '✅' : '❌'}`);
    console.log(`   Longitude column: ${hasLng ? '✅' : '❌'}`);
    console.log(`   Postcode column: ${hasPostcode ? '✅' : '❌'}`);
  }

  // 4. Check NULL coordinate count
  console.log('\n4. Coordinate Population');
  const { data: nullJobs, error: nullError } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .is('latitude', null);

  const { data: totalJobs, error: totalError } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true });

  if (totalError || nullError) {
    console.log('   Error counting jobs:', (totalError || nullError).message);
  } else {
    const total = totalJobs?.length ?? 0; // head: true doesn't return array length reliably via this API
    console.log('   (Run the script below for exact counts)');
  }

  // Better count via raw query using the function workaround
  try {
    const { data: countData, error: countErr } = await client
      .from('jobs')
      .select('*');
    if (countErr) throw countErr;
    const total = countData?.length ?? 0;
    const withCoords = countData?.filter(j => j.latitude != null && j.longitude != null).length ?? 0;
    const withoutCoords = total - withCoords;
    console.log(`   Total jobs: ${total}`);
    console.log(`   Jobs WITH coordinates: ${withCoords} ${withCoords > 0 ? '✅' : '⚠️'}`);
    console.log(`   Jobs WITHOUT coordinates: ${withoutCoords} ${withoutCoords === 0 ? '✅' : '❌'}`);
  } catch (e) {
    console.log('   Error fetching jobs:', e.message);
  }

  console.log('\n=== Done ===');
}

check().catch(console.error);
