-- Add unique constraint on (job_id, worker_id) to prevent duplicate applications
-- This prevents race conditions in application submission

-- First, remove any existing duplicate applications (keep the most recent one)
-- Using a CTE with row_number to handle UUID comparisons
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY job_id, worker_id ORDER BY created_at DESC) as rn
  FROM applications
  WHERE (job_id, worker_id) IN (
    SELECT job_id, worker_id
    FROM applications
    GROUP BY job_id, worker_id
    HAVING COUNT(*) > 1
  )
)
DELETE FROM applications
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
ALTER TABLE applications
ADD CONSTRAINT unique_job_worker_application
UNIQUE (job_id, worker_id);

-- Add index for better query performance
CREATE INDEX idx_applications_job_worker
ON applications(job_id, worker_id);
