-- Add spatial index on jobs latitude/longitude for performance
-- Note: This creates a btree index; for PostGIS spatial queries, PostGIS uses its own optimizations

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_jobs_latitude ON jobs(latitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_longitude ON jobs(longitude) WHERE longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_coordinates ON jobs(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Optional: Add location fields to profiles table for worker location preferences
-- Uncomment if you want to store worker preferred locations
/*
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_latitude float,
  ADD COLUMN IF NOT EXISTS preferred_longitude float,
  ADD COLUMN IF NOT EXISTS search_radius_km float DEFAULT 10;

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_location ON profiles(preferred_latitude, preferred_longitude)
  WHERE preferred_latitude IS NOT NULL AND preferred_longitude IS NOT NULL;
*/
