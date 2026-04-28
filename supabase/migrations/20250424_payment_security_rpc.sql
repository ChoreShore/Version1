-- RPC function for atomic contract creation with row-level locking
CREATE OR REPLACE FUNCTION check_and_create_contract(
  p_application_id UUID,
  p_employer_id UUID,
  p_worker_id UUID,
  p_job_id UUID,
  p_budget_type TEXT,
  p_budget_amount NUMERIC
)
RETURNS TABLE(id UUID) AS $$
DECLARE
  v_existing_contract_id UUID;
  v_platform_fee_percentage NUMERIC := 15;
  v_platform_fee NUMERIC;
  v_escrow_amount NUMERIC;
  v_payout_amount NUMERIC;
  v_payment_intent_id TEXT;
BEGIN
  -- Get platform fee percentage from env (default to 15)
  -- In production, this would come from a settings table
  
  -- Check for existing contract with row-level lock
  SELECT id INTO v_existing_contract_id
  FROM contracts
  WHERE application_id = p_application_id
  FOR UPDATE;
  
  -- If contract exists, return it
  IF v_existing_contract_id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_contract_id::UUID AS id;
    RETURN;
  END IF;
  
  -- Calculate escrow details for fixed-price jobs
  IF p_budget_type = 'fixed' THEN
    v_platform_fee := p_budget_amount * (v_platform_fee_percentage / 100);
    v_escrow_amount := p_budget_amount + v_platform_fee;
    v_payout_amount := p_budget_amount;
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
    p_employer_id,
    p_worker_id,
    p_job_id,
    'active',
    v_escrow_amount,
    v_platform_fee,
    v_payout_amount,
    v_payment_intent_id,
    CASE WHEN p_budget_type = 'fixed' THEN 'pending' ELSE NULL END,
    p_budget_amount
  )
  RETURNING id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
