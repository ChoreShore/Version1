-- Function to check if a worker can apply to a job
-- Returns true if:
-- 1. The job exists and is open
-- 2. The worker hasn't already applied
-- 3. The worker has the 'worker' role
-- 4. The worker is not the employer who posted the job

CREATE OR REPLACE FUNCTION can_apply_to_job(job_uuid uuid, worker_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_status text;
  job_employer_id uuid;
  already_applied boolean;
  has_worker_role boolean;
BEGIN
  -- Check if job exists and get its status and employer
  SELECT status, employer_id INTO job_status, job_employer_id
  FROM jobs
  WHERE id = job_uuid;
  
  -- If job doesn't exist, return false
  IF job_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if job is open
  IF job_status != 'open' THEN
    RETURN false;
  END IF;
  
  -- Check if worker is the employer (can't apply to own job)
  IF job_employer_id = worker_uuid THEN
    RETURN false;
  END IF;
  
  -- Check if worker has already applied
  SELECT EXISTS(
    SELECT 1 FROM applications
    WHERE job_id = job_uuid AND worker_id = worker_uuid
  ) INTO already_applied;
  
  IF already_applied THEN
    RETURN false;
  END IF;
  
  -- Check if user has worker role
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = worker_uuid AND 'worker' = ANY(roles)
  ) INTO has_worker_role;
  
  IF NOT has_worker_role THEN
    RETURN false;
  END IF;
  
  -- All checks passed
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_apply_to_job(uuid, uuid) TO authenticated;
