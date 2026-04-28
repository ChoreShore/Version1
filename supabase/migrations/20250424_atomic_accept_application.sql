-- RPC function for atomic application acceptance flow
-- This handles: UPDATE applications, INSERT contract, UPDATE jobs in a single transaction
CREATE OR REPLACE FUNCTION accept_application(
  p_application_id UUID,
  p_employer_id UUID
)
RETURNS TABLE(contract_id UUID, job_status TEXT) AS $$
DECLARE
  v_current_app_status TEXT;
  v_job_id UUID;
  v_worker_id UUID;
  v_job_status TEXT;
  v_existing_contract_id UUID;
  v_existing_accepted_app_id UUID;
  v_employer_id UUID;
  v_platform_fee_percentage NUMERIC := 15;
  v_platform_fee NUMERIC;
  v_escrow_amount NUMERIC;
  v_payout_amount NUMERIC;
  v_payment_intent_id TEXT;
  v_budget_type TEXT;
  v_budget_amount NUMERIC;
BEGIN
  -- Get current application and job details with row-level lock
  SELECT 
    a.status, 
    a.job_id, 
    a.worker_id,
    j.status,
    j.employer_id,
    j.budget_type,
    j.budget_amount
  INTO 
    v_current_app_status,
    v_job_id,
    v_worker_id,
    v_job_status,
    v_employer_id,
    v_budget_type,
    v_budget_amount
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE a.id = p_application_id
  FOR UPDATE OF a;
  
  -- Validate: application must exist
  IF v_current_app_status IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Validate: caller must be the employer
  IF v_employer_id != p_employer_id THEN
    RAISE EXCEPTION 'Only the job employer can accept applications';
  END IF;
  
  -- Validate: application must be in pending state
  IF v_current_app_status != 'pending' THEN
    RAISE EXCEPTION 'Cannot accept application with status %', v_current_app_status;
  END IF;
  
  -- Validate: job must be open
  IF v_job_status != 'open' THEN
    RAISE EXCEPTION 'Cannot accept application for job with status %', v_job_status;
  END IF;
  
  -- Check if another application for this job is already accepted
  SELECT id INTO v_existing_accepted_app_id
  FROM applications
  WHERE job_id = v_job_id
    AND status = 'accepted'
    AND id != p_application_id
  LIMIT 1;
  
  IF v_existing_accepted_app_id IS NOT NULL THEN
    RAISE EXCEPTION 'This job already has an accepted application';
  END IF;
  
  -- Check if contract already exists for this application
  SELECT id INTO v_existing_contract_id
  FROM contracts
  WHERE application_id = p_application_id
  LIMIT 1;
  
  IF v_existing_contract_id IS NOT NULL THEN
    RAISE EXCEPTION 'Contract already exists for this application';
  END IF;
  
  -- Update application status to accepted
  UPDATE applications
  SET status = 'accepted',
      updated_at = NOW()
  WHERE id = p_application_id;

  -- Log status change to history
  INSERT INTO application_status_history (application_id, from_status, to_status, changed_by)
  VALUES (
    p_application_id,
    v_current_app_status,
    'accepted',
    p_employer_id
  );

  -- Close the job
  UPDATE jobs
  SET status = 'closed',
      updated_at = NOW()
  WHERE id = v_job_id;
  
  -- Calculate escrow details for fixed-price jobs
  IF v_budget_type = 'fixed' THEN
    v_platform_fee := v_budget_amount * (v_platform_fee_percentage / 100);
    v_escrow_amount := v_budget_amount + v_platform_fee;
    v_payout_amount := v_budget_amount;
    v_payment_intent_id := 'pi_mock_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || substr(md5(random()::TEXT), 1, 9);
  END IF;
  
  -- Insert new contract
  INSERT INTO contracts (
    application_id,
    employer_id,
    worker_id,
    job_id,
    status,
    escrow_amount,
    platform_fee,
    payout_amount,
    payment_intent_id,
    payout_status,
    frozen_budget_amount
  ) VALUES (
    p_application_id,
    v_employer_id,
    v_worker_id,
    v_job_id,
    'active',
    v_escrow_amount,
    v_platform_fee,
    v_payout_amount,
    v_payment_intent_id,
    CASE WHEN v_budget_type = 'fixed' THEN 'pending' ELSE NULL END,
    v_budget_amount
  )
  RETURNING id INTO v_existing_contract_id;

  -- Notify worker of acceptance
  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_worker_id,
    'application_accepted',
    'You were hired!',
    'Congratulations! An employer has accepted your application.',
    jsonb_build_object(
      'contract_id', v_existing_contract_id,
      'job_id', v_job_id,
      'application_id', p_application_id
    )
  );

  RETURN QUERY SELECT v_existing_contract_id::UUID AS contract_id, 'closed'::TEXT AS job_status;
END;
$$ LANGUAGE plpgsql;
