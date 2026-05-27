-- Fix jobs_completed_at_trigger timing
-- The trigger was incorrectly defined as AFTER UPDATE, but the function
-- assigns to NEW.completed_at. AFTER triggers cannot modify NEW values.
-- Changing to BEFORE UPDATE so completed_at is set before the row is written.

-- Drop the broken trigger first
DROP TRIGGER IF EXISTS jobs_completed_at_trigger ON public.jobs;

-- Recreate as BEFORE UPDATE so NEW values can be modified
CREATE TRIGGER jobs_completed_at_trigger
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_job_completed_at();
