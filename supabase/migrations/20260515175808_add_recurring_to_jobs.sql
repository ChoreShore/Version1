-- Add is_recurring column to jobs table for recurring/ongoing work
-- This field is optional and indicates if the job is recurring or ongoing work

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN jobs.is_recurring IS 'Indicates if the job is recurring or ongoing work (optional, defaults to false)';
