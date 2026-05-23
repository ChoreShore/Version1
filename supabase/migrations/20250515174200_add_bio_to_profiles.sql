-- Add bio column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.bio IS 'Optional bio for workers (max 500 characters, plain text)';
