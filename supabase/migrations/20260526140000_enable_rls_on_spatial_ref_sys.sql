-- Enable RLS on the PostGIS spatial_ref_sys table
-- This table is created by the PostGIS extension and contains read-only reference data.
-- Enabling RLS prevents it from being flagged as a public table without RLS.
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Allow all roles to read spatial reference data.
-- PostGIS functions (e.g. ST_SetSRID, ST_DistanceSphere) may reference this table
-- internally. Since it is read-only reference data, public SELECT is safe.
DO $$
BEGIN
  CREATE POLICY "Allow public read access on spatial_ref_sys"
  ON public.spatial_ref_sys
  FOR SELECT
  TO public
  USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy already exists on spatial_ref_sys. Skipping.';
END $$;
