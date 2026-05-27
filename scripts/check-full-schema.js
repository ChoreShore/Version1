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

async function query(sql) {
  const { data, error } = await client.rpc('exec_sql', { query_text: sql });
  if (error) {
    // Fallback: try direct table query
    return { data: null, error };
  }
  return { data, error: null };
}

async function check() {
  console.log('=== FULL SCHEMA DIAGNOSTIC ===\n');

  // 1. List all tables in public schema
  console.log('1. TABLES IN PUBLIC SCHEMA');
  const { data: tables, error: tablesErr } = await client
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')
    .order('table_name');

  if (tablesErr) {
    console.error('   Error:', tablesErr.message);
  } else {
    const tableNames = (tables || []).map(t => t.table_name);
    console.log('   Found', tableNames.length, 'tables:');
    tableNames.forEach(t => console.log(`   - ${t}`));

    // Check for expected tables
    const expectedTables = [
      'jobs', 'profiles', 'applications', 'contracts', 'messages',
      'reviews', 'payments', 'payment_methods', 'payment_events',
      'job_categories', 'conversations', 'identity_verifications',
      'rtw_verifications'
    ];
    console.log('\n   Expected vs Actual:');
    for (const expected of expectedTables) {
      const found = tableNames.includes(expected);
      console.log(`   ${found ? '✅' : '❌'} ${expected}`);
    }
  }

  // 2. Columns for each table
  console.log('\n2. COLUMNS BY TABLE');
  const { data: columns, error: colsErr } = await client
    .from('information_schema.columns')
    .select('table_name, column_name, data_type, is_nullable, column_default')
    .eq('table_schema', 'public')
    .order('table_name')
    .order('ordinal_position');

  if (colsErr) {
    console.error('   Error:', colsErr.message);
  } else {
    const byTable = {};
    for (const col of columns || []) {
      if (!byTable[col.table_name]) byTable[col.table_name] = [];
      byTable[col.table_name].push(col);
    }
    for (const [table, cols] of Object.entries(byTable)) {
      console.log(`\n   ${table}:`);
      for (const col of cols) {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultStr = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`     ${col.column_name} ${col.data_type} ${nullable}${defaultStr}`);
      }
    }
  }

  // 3. Constraints
  console.log('\n3. CONSTRAINTS');
  const { data: constraints, error: constrErr } = await client
    .from('information_schema.table_constraints')
    .select('table_name, constraint_name, constraint_type')
    .eq('table_schema', 'public')
    .not('constraint_type', 'eq', 'CHECK') // skip system CHECK
    .order('table_name');

  if (constrErr) {
    console.error('   Error:', constrErr.message);
  } else {
    for (const c of constraints || []) {
      if (c.constraint_name?.startsWith('pg_')) continue; // skip system
      console.log(`   ${c.table_name}: ${c.constraint_name} (${c.constraint_type})`);
    }
  }

  // 4. Indexes
  console.log('\n4. INDEXES');
  const { data: indexes, error: idxErr } = await client
    .from('pg_indexes')
    .select('tablename, indexname')
    .eq('schemaname', 'public')
    .order('tablename');

  if (idxErr) {
    console.error('   Error:', idxErr.message);
  } else {
    for (const idx of indexes || []) {
      console.log(`   ${idx.tablename}: ${idx.indexname}`);
    }
  }

  // 5. Functions
  console.log('\n5. FUNCTIONS');
  const { data: functions, error: funcErr } = await client
    .from('pg_proc')
    .select('proname')
    .eq('pronamespace', (await client.from('pg_namespace').select('oid').eq('nspname', 'public').single()).data?.oid || 2200)
    .order('proname');

  if (funcErr) {
    console.error('   Error:', funcErr.message);
  } else {
    const funcNames = (functions || []).map(f => f.proname);
    for (const name of [...new Set(funcNames)]) {
      console.log(`   ${name}`);
    }
  }

  // 6. RLS Policies
  console.log('\n6. RLS POLICIES');
  const { data: policies, error: polErr } = await client
    .from('pg_policies')
    .select('tablename, policyname, permissive, roles, cmd, qual')
    .eq('schemaname', 'public')
    .order('tablename');

  if (polErr) {
    console.error('   Error:', polErr.message);
  } else {
    for (const p of policies || []) {
      console.log(`   ${p.tablename}: ${p.policyname} (${p.cmd})`);
    }
  }

  // 7. Extensions
  console.log('\n7. EXTENSIONS');
  const { data: extensions, error: extErr } = await client
    .from('pg_extension')
    .select('extname, extversion')
    .order('extname');

  if (extErr) {
    console.error('   Error:', extErr.message);
  } else {
    for (const e of extensions || []) {
      console.log(`   ${e.extname} ${e.extversion}`);
    }
  }

  // 8. Storage buckets
  console.log('\n8. STORAGE BUCKETS');
  const { data: buckets, error: bucketErr } = await client
    .storage
    .listBuckets();

  if (bucketErr) {
    console.error('   Error:', bucketErr.message);
  } else {
    for (const b of buckets || []) {
      console.log(`   ${b.name} (public: ${b.public})`);
    }
  }

  // 9. Triggers
  console.log('\n9. TRIGGERS');
  const { data: triggers, error: trigErr } = await client
    .from('information_schema.triggers')
    .select('event_object_table, trigger_name, event_manipulation, action_timing')
    .eq('trigger_schema', 'public')
    .order('event_object_table');

  if (trigErr) {
    console.error('   Error:', trigErr.message);
  } else {
    for (const t of triggers || []) {
      console.log(`   ${t.event_object_table}: ${t.trigger_name} (${t.action_timing} ${t.event_manipulation})`);
    }
  }

  console.log('\n=== DONE ===');
}

check().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
