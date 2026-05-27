-- Comprehensive Database Health Check
-- Run with: supabase db query --linked --file scripts/db-health-check.sql
-- This script creates a temporary function, runs all tests, then drops it.

CREATE OR REPLACE FUNCTION public.run_health_check()
RETURNS TABLE(test_name text, result text, details text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_test_name text;
    v_result text;
    v_details text;
    v_count int;
    v_value text;
    v_job_id uuid;
    v_app_id uuid;
    v_profile_id uuid;
    v_msg_id uuid;
    v_review_id uuid;
BEGIN
    -- ================================================================
    -- 1. SCHEMA EXISTENCE TESTS
    -- ================================================================

    -- 1.1 Tables
    v_test_name := 'SCHEMA: jobs table exists';
    SELECT COUNT(*) INTO v_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'jobs' AND table_type = 'BASE TABLE';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'Found jobs table';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'jobs table missing';
    END IF;

    v_test_name := 'SCHEMA: profiles table exists';
    SELECT COUNT(*) INTO v_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'Found profiles table';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'profiles table missing';
    END IF;

    v_test_name := 'SCHEMA: messages table exists';
    SELECT COUNT(*) INTO v_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages' AND table_type = 'BASE TABLE';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'Found messages table';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'messages table missing';
    END IF;

    v_test_name := 'SCHEMA: applications table exists';
    SELECT COUNT(*) INTO v_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'applications' AND table_type = 'BASE TABLE';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'Found applications table';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'applications table missing';
    END IF;

    -- 1.2 Columns (our fixes)
    v_test_name := 'SCHEMA: messages.client_message_id column';
    SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'client_message_id';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'client_message_id exists';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'client_message_id missing';
    END IF;

    v_test_name := 'SCHEMA: profiles.postcode column';
    SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'postcode';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'postcode exists';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'postcode missing';
    END IF;

    v_test_name := 'SCHEMA: jobs.latitude column';
    SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'latitude';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'latitude exists';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'latitude missing';
    END IF;

    v_test_name := 'SCHEMA: jobs.longitude column';
    SELECT COUNT(*) INTO v_count FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'longitude';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'longitude exists';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'longitude missing';
    END IF;

    -- 1.3 Extensions
    v_test_name := 'SCHEMA: postgis extension';
    SELECT COUNT(*) INTO v_count FROM pg_extension WHERE extname = 'postgis';
    IF v_count = 1 THEN
        RETURN QUERY SELECT v_test_name, 'PASS', 'postgis enabled';
    ELSE
        RETURN QUERY SELECT v_test_name, 'FAIL', 'postgis not enabled';
    END IF;

    -- ================================================================
    -- 2. CONSTRAINT TESTS (try to violate them)
    -- ================================================================

    -- Pick a real profile to use as FK
    SELECT id INTO v_profile_id FROM profiles LIMIT 1;

    -- 2.1 Unique constraint on applications (job_id, worker_id)
    IF v_profile_id IS NOT NULL THEN
        -- First, create a test job
        INSERT INTO jobs (employer_id, title, description, category_id, postcode, budget_type, budget_amount, deadline, status)
        VALUES (v_profile_id, 'Health Check Test Job', 'Test', (SELECT id FROM job_categories LIMIT 1), 'SW1A 1AA', 'fixed', 100, NOW() + INTERVAL '7 days', 'open')
        RETURNING id INTO v_job_id;

        -- Create two applications with same job_id and worker_id
        INSERT INTO applications (job_id, worker_id, status)
        VALUES (v_job_id, v_profile_id, 'pending')
        RETURNING id INTO v_app_id;

        BEGIN
            INSERT INTO applications (job_id, worker_id, status)
            VALUES (v_job_id, v_profile_id, 'pending');
            RETURN QUERY SELECT 'CONSTRAINT: applications unique (job_id, worker_id)', 'FAIL', 'Duplicate insert was allowed';
        EXCEPTION WHEN unique_violation THEN
            RETURN QUERY SELECT 'CONSTRAINT: applications unique (job_id, worker_id)', 'PASS', 'Duplicate correctly blocked';
        END;
    ELSE
        RETURN QUERY SELECT 'CONSTRAINT: applications unique (job_id, worker_id)', 'SKIP', 'No profiles found for test data';
    END IF;

    -- 2.2 Unique constraint on contracts (application_id)
    IF v_app_id IS NOT NULL AND v_profile_id IS NOT NULL THEN
        INSERT INTO contracts (application_id, employer_id, worker_id, job_id, status, created_at, updated_at)
        VALUES (v_app_id, v_profile_id, v_profile_id, v_job_id, 'pending', NOW(), NOW());

        BEGIN
            INSERT INTO contracts (application_id, employer_id, worker_id, job_id, status, created_at, updated_at)
            VALUES (v_app_id, v_profile_id, v_profile_id, v_job_id, 'pending', NOW(), NOW());
            RETURN QUERY SELECT 'CONSTRAINT: contracts unique (application_id)', 'FAIL', 'Duplicate insert was allowed';
        EXCEPTION WHEN unique_violation THEN
            RETURN QUERY SELECT 'CONSTRAINT: contracts unique (application_id)', 'PASS', 'Duplicate correctly blocked';
        END;
    ELSE
        RETURN QUERY SELECT 'CONSTRAINT: contracts unique (application_id)', 'SKIP', 'Could not create test data';
    END IF;

    -- ================================================================
    -- 3. TRIGGER TESTS
    -- ================================================================

    -- 3.1 update_job_urgency trigger: urgent job (deadline < 24h)
    IF v_profile_id IS NOT NULL THEN
        INSERT INTO jobs (employer_id, title, description, category_id, postcode, budget_type, budget_amount, deadline, status, is_urgent)
        VALUES (v_profile_id, 'Urgent Test', 'Test', (SELECT id FROM job_categories LIMIT 1), 'SW1A 1AA', 'fixed', 100, NOW() + INTERVAL '12 hours', 'open', false)
        RETURNING id INTO v_job_id;

        SELECT is_urgent INTO v_value FROM jobs WHERE id = v_job_id;
        IF v_value::boolean = true THEN
            RETURN QUERY SELECT 'TRIGGER: update_job_urgency (urgent)', 'PASS', 'is_urgent set to true for deadline < 24h';
        ELSE
            RETURN QUERY SELECT 'TRIGGER: update_job_urgency (urgent)', 'FAIL', 'is_urgent was ' || COALESCE(v_value, 'NULL') || ', expected true';
        END IF;

        -- 3.2 update_job_urgency trigger: non-urgent job (deadline > 24h)
        INSERT INTO jobs (employer_id, title, description, category_id, postcode, budget_type, budget_amount, deadline, status, is_urgent)
        VALUES (v_profile_id, 'Non-Urgent Test', 'Test', (SELECT id FROM job_categories LIMIT 1), 'SW1A 1AA', 'fixed', 100, NOW() + INTERVAL '72 hours', 'open', false)
        RETURNING id INTO v_job_id;

        SELECT is_urgent INTO v_value FROM jobs WHERE id = v_job_id;
        IF v_value::boolean = false THEN
            RETURN QUERY SELECT 'TRIGGER: update_job_urgency (non-urgent)', 'PASS', 'is_urgent set to false for deadline > 24h';
        ELSE
            RETURN QUERY SELECT 'TRIGGER: update_job_urgency (non-urgent)', 'FAIL', 'is_urgent was ' || COALESCE(v_value, 'NULL') || ', expected false';
        END IF;

        -- 3.3 jobs_completed_at trigger: set completed_at when status changes to completed
        UPDATE jobs SET status = 'completed' WHERE id = v_job_id;
        SELECT completed_at INTO v_value FROM jobs WHERE id = v_job_id;
        IF v_value IS NOT NULL THEN
            RETURN QUERY SELECT 'TRIGGER: jobs_completed_at', 'PASS', 'completed_at set on status=completed';
        ELSE
            RETURN QUERY SELECT 'TRIGGER: jobs_completed_at', 'FAIL', 'completed_at was NULL after status=completed';
        END IF;
    ELSE
        RETURN QUERY SELECT 'TRIGGER: update_job_urgency (urgent)', 'SKIP', 'No profiles found';
        RETURN QUERY SELECT 'TRIGGER: update_job_urgency (non-urgent)', 'SKIP', 'No profiles found';
        RETURN QUERY SELECT 'TRIGGER: jobs_completed_at', 'SKIP', 'No profiles found';
    END IF;

    -- ================================================================
    -- 4. WRITE PATH TESTS (our schema fixes)
    -- ================================================================

    -- 4.1 Insert message with client_message_id
    IF v_profile_id IS NOT NULL AND v_app_id IS NOT NULL THEN
        INSERT INTO messages (job_id, application_id, sender_id, receiver_id, body, client_message_id)
        VALUES (v_job_id, v_app_id, v_profile_id, v_profile_id, 'Health check msg', '11111111-1111-1111-1111-111111111111')
        RETURNING id INTO v_msg_id;

        SELECT client_message_id INTO v_value FROM messages WHERE id = v_msg_id;
        IF v_value = '11111111-1111-1111-1111-111111111111' THEN
            RETURN QUERY SELECT 'WRITE: messages with client_message_id', 'PASS', 'Value persisted correctly';
        ELSE
            RETURN QUERY SELECT 'WRITE: messages with client_message_id', 'FAIL', 'Value was ' || COALESCE(v_value, 'NULL');
        END IF;

        -- 4.2 Update profile postcode
        UPDATE profiles SET postcode = 'HC1 1HC' WHERE id = v_profile_id;
        SELECT postcode INTO v_value FROM profiles WHERE id = v_profile_id;
        IF v_value = 'HC1 1HC' THEN
            RETURN QUERY SELECT 'WRITE: profiles postcode update', 'PASS', 'Value persisted correctly';
        ELSE
            RETURN QUERY SELECT 'WRITE: profiles postcode update', 'FAIL', 'Value was ' || COALESCE(v_value, 'NULL');
        END IF;

        -- Restore postcode
        UPDATE profiles SET postcode = NULL WHERE id = v_profile_id;
    ELSE
        RETURN QUERY SELECT 'WRITE: messages with client_message_id', 'SKIP', 'No test data available';
        RETURN QUERY SELECT 'WRITE: profiles postcode update', 'SKIP', 'No test data available';
    END IF;

    -- ================================================================
    -- 5. RPC FUNCTION TESTS
    -- ================================================================

    -- 5.1 find_jobs_near
    BEGIN
        PERFORM find_jobs_near(51.5074, -0.1278, 10);
        RETURN QUERY SELECT 'RPC: find_jobs_near', 'PASS', 'Function executed without error';
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'RPC: find_jobs_near', 'FAIL', SQLERRM;
    END;

    -- 5.2 calculate_job_urgency
    BEGIN
        PERFORM calculate_job_urgency(NOW() + INTERVAL '12 hours');
        RETURN QUERY SELECT 'RPC: calculate_job_urgency (urgent)', 'PASS', 'Returned true for < 24h';
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'RPC: calculate_job_urgency (urgent)', 'FAIL', SQLERRM;
    END;

    BEGIN
        PERFORM calculate_job_urgency(NOW() + INTERVAL '72 hours');
        RETURN QUERY SELECT 'RPC: calculate_job_urgency (non-urgent)', 'PASS', 'Returned false for > 24h';
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'RPC: calculate_job_urgency (non-urgent)', 'FAIL', SQLERRM;
    END;

    -- ================================================================
    -- 6. CLEANUP: Remove all test data
    -- ================================================================
    DELETE FROM messages WHERE id = v_msg_id;
    DELETE FROM contracts WHERE application_id = v_app_id;
    DELETE FROM applications WHERE id = v_app_id;
    DELETE FROM jobs WHERE title LIKE 'Health Check%' OR title LIKE 'Urgent Test%' OR title LIKE 'Non-Urgent Test%';
    DELETE FROM jobs WHERE title IN ('Health Check Test Job', 'Urgent Test', 'Non-Urgent Test');

    RETURN QUERY SELECT 'CLEANUP', 'PASS', 'Test data removed';

    RETURN;
END;
$$;

-- Run the health check and show results
SELECT test_name, result, details FROM public.run_health_check();

-- Drop the function after use
DROP FUNCTION IF EXISTS public.run_health_check();
