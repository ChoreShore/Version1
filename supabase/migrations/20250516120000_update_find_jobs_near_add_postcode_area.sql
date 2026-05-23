-- Update find_jobs_near to return postcode_area (outward code only) for privacy
DROP FUNCTION IF EXISTS find_jobs_near(float, float, float);

CREATE OR REPLACE FUNCTION find_jobs_near(
  search_lat float,
  search_lng float,
  max_distance_km float DEFAULT 10
)
RETURNS TABLE (
  job_id uuid,
  title text,
  postcode_area text,
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

  IF max_distance_km <= 0 OR max_distance_km > 1000 THEN
    RAISE EXCEPTION 'Distance must be between 0 and 1000 km';
  END IF;

  RETURN QUERY
  SELECT
    j.id::uuid AS job_id,
    j.title::text AS title,
    SPLIT_PART(j.postcode, ' ', 1)::text AS postcode_area,
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
    ) / 1000 <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$;

COMMENT ON FUNCTION find_jobs_near(float, float, float) IS 'Find open jobs within a given distance (km) of search coordinates. Returns job_id, title, postcode_area (outward code only), and distance_km.';
