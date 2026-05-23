-- Add photo_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add index on photo_url for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_photo_url ON profiles(photo_url);

-- Add comment for documentation
COMMENT ON COLUMN profiles.photo_url IS 'URL to the user profile photo stored in Supabase storage';
