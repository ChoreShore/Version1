-- Add unique constraint on application_id to prevent duplicate contracts
-- This prevents race conditions in contract creation by ensuring database-level uniqueness

-- First, remove any existing duplicate contracts (keep the most recent one)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY application_id ORDER BY created_at DESC) as rn
  FROM contracts
  WHERE application_id IN (
    SELECT application_id
    FROM contracts
    GROUP BY application_id
    HAVING COUNT(*) > 1
  )
)
DELETE FROM contracts
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint on application_id
ALTER TABLE contracts
ADD CONSTRAINT unique_contract_application
UNIQUE (application_id);

-- Add index for better query performance
CREATE INDEX idx_contracts_application_id
ON contracts(application_id);
