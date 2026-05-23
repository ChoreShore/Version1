-- Add is_urgent column to jobs table for urgent job marking
-- Jobs with deadlines less than 48 hours from current time are marked as urgent

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- Create function to calculate job urgency based on deadline
CREATE OR REPLACE FUNCTION calculate_job_urgency()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as urgent if deadline is within 48 hours from now
  NEW.is_urgent := (NEW.deadline <= (NOW() + INTERVAL '48 hours'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update urgency on insert and deadline update
DROP TRIGGER IF EXISTS update_job_urgency_trigger ON jobs;
CREATE TRIGGER update_job_urgency_trigger
  BEFORE INSERT OR UPDATE OF deadline ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_job_urgency();

-- Add comment to document the field
COMMENT ON COLUMN jobs.is_urgent IS 'Indicates if the job deadline is within 48 hours (auto-calculated by trigger)';

-- Recalculate urgency for all existing open jobs
UPDATE jobs
SET is_urgent = (deadline <= (NOW() + INTERVAL '48 hours'))
WHERE status = 'open';
