-- Rebuild mock payments foundation (public schema only)
-- Safe/idempotent migration intended for both repo migrations and Supabase SQL editor execution

-- =============================
-- Contracts: restore payment fields
-- =============================
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS platform_fee NUMERIC;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payout_amount NUMERIC;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payout_status TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS worker_kyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS frozen_budget_amount NUMERIC;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS worker_stripe_account_id TEXT;

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_payout_status_check;
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_payout_status_check
  CHECK (
    payout_status IS NULL
    OR payout_status IN ('pending', 'processed', 'failed', 'refunded')
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_idempotency_key
  ON public.contracts (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- =============================
-- Event ledger: payment_transactions
-- =============================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('employer', 'worker', 'system')),
  event_type TEXT NOT NULL CHECK (event_type IN ('employer_payment', 'worker_payout', 'refund')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed', 'refunded')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'GBP',
  payment_intent_id TEXT,
  idempotency_key TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_actor_user_id ON public.payment_transactions(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_employer_id ON public.payment_transactions(employer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_worker_id ON public.payment_transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_application_id ON public.payment_transactions(application_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_contract_id ON public.payment_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_occurred_at ON public.payment_transactions(occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_idempotency_key
  ON public.payment_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- =============================
-- Mock connection store: payment_methods
-- =============================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('employer', 'worker')),
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'bank')),
  provider TEXT NOT NULL DEFAULT 'stripe_mock',
  connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified')),
  brand TEXT,
  last4 TEXT,
  display_label TEXT,
  connected_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT payment_methods_user_role_method_key UNIQUE (user_id, role, method_type)
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);

-- =============================
-- Post-migration verification helpers
-- =============================
-- Verify tables exist in public schema
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('payment_transactions', 'payment_methods', 'contracts');

-- Verify contracts payment columns exist in public schema
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'contracts'
--   AND column_name IN (
--     'payment_confirmed', 'escrow_amount', 'platform_fee', 'payout_amount',
--     'payout_status', 'payment_intent_id', 'worker_kyc_verified',
--     'frozen_budget_amount', 'idempotency_key', 'worker_stripe_account_id'
--   )
-- ORDER BY column_name;
