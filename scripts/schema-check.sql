-- Full Schema Diagnostic for Supabase project
-- Run with: supabase db query --linked --file scripts/schema-check.sql

-- 1. TABLES IN PUBLIC SCHEMA
SELECT '=== TABLES ===' AS section;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. COLUMNS FOR KEY TABLES
SELECT '=== COLUMNS: jobs ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: profiles ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: applications ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'applications'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: contracts ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contracts'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: messages ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: reviews ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: payment_methods ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payment_methods'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: payment_transactions ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payment_transactions'
ORDER BY ordinal_position;

SELECT '=== COLUMNS: job_categories ===' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'job_categories'
ORDER BY ordinal_position;

-- 3. CONSTRAINTS
SELECT '=== CONSTRAINTS ===' AS section;
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY', 'CHECK')
  AND tc.constraint_name NOT LIKE 'pg_%'
ORDER BY tc.table_name, tc.constraint_type;

-- 4. INDEXES
SELECT '=== INDEXES ===' AS section;
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. FUNCTIONS
SELECT '=== FUNCTIONS ===' AS section;
SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 6. TRIGGERS
SELECT '=== TRIGGERS ===' AS section;
SELECT event_object_table, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 7. EXTENSIONS
SELECT '=== EXTENSIONS ===' AS section;
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

-- 8. RLS POLICIES
SELECT '=== RLS POLICIES ===' AS section;
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. ROW COUNTS
SELECT '=== ROW COUNTS ===' AS section;
SELECT 'jobs' AS table_name, COUNT(*) AS row_count FROM jobs
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
UNION ALL
SELECT 'job_categories', COUNT(*) FROM job_categories;
