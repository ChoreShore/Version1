-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS find_jobs_near(float, float, float);

-- Create function to find jobs near a given location
CREATE OR REPLACE FUNCTION find_jobs_near(
  search_lat float,
  search_lng float,
  distance_km float DEFAULT 10
)
RETURNS TABLE (
  job_id uuid,
  title text,
  distance_km float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate coordinates
  IF search_lat < -90 OR search_lat > 90 THEN
    RAISE EXCEPTION 'Latitude must be between -90 and 90';
  END IF;

  IF search_lng < -180 OR search_lng > 180 THEN
    RAISE EXCEPTION 'Longitude must be between -180 and 180';
  END IF;

  IF distance_km <= 0 OR distance_km > 1000 THEN
    RAISE EXCEPTION 'Distance must be between 0 and 1000 km';
  END IF;

  RETURN QUERY
  SELECT
    j.id::uuid AS job_id,
    j.title::text AS title,
    ROUND(
      ST_DistanceSphere(
        ST_SetSRID(ST_MakePoint(j.longitude, j.latitude), 4326),
        ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)
      ) / 1000,
      2
    )::float AS distance_km
  FROM jobs j
  WHERE
    j.status = 'open'
    AND j.latitude IS NOT NULL
    AND j.longitude IS NOT NULL
    AND ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(j.longitude, j.latitude), 4326),
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)
    ) / 1000 <= distance_km
  ORDER BY distance_km ASC;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION find_jobs_near(float, float, float) IS 'Find open jobs within a given distance (km) of search coordinates. Returns job_id, title, and distance_km.';
