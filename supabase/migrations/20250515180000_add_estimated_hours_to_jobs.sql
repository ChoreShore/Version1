-- Add estimated_hours column to jobs table for hourly jobs
-- This field is optional and only relevant for hourly budget type jobs
-- Valid range: 1-30 hours

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;

-- Add check constraint to ensure estimated_hours is between 1 and 30 if provided
ALTER TABLE jobs
  ADD CONSTRAINT check_estimated_hours_range
  CHECK (estimated_hours IS NULL OR (estimated_hours >= 1 AND estimated_hours <= 30));

-- Add comment to document the field
COMMENT ON COLUMN jobs.estimated_hours IS 'Estimated number of hours for hourly jobs (1-30, optional)';
