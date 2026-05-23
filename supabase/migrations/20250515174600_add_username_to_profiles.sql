-- Add username column to profiles table
ALTER TABLE profiles
ADD COLUMN username TEXT;

-- Add unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comment for documentation
COMMENT ON COLUMN profiles.username IS 'Unique username for users (max 12 characters, alphanumeric + underscores/hyphens, permanent)';
