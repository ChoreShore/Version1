-- Payment and Contract Security Fixes
-- This migration adds columns and tables to address 12 security and race condition issues

-- Add columns to contracts table
-- 1. Add idempotency key for payment intent deduplication
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- 2. Add payment confirmation flag
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;

-- 3. Add placeholder columns for future Stripe Connect verification
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS worker_stripe_account_id TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS worker_kyc_verified BOOLEAN DEFAULT FALSE;

-- 4. Add frozen budget amount at contract creation
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS frozen_budget_amount NUMERIC;

-- Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment_intent', 'payout', 'refund', 'dispute')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_contract_id ON payment_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_intent_id ON payment_transactions(payment_intent_id);

-- Create webhook_logs table for Stripe webhook logging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
