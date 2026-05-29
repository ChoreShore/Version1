-- Fix user deletion cascade
-- ON DELETE CASCADE has been applied to all FKs referencing profiles(id) and auth.users(id).
-- This migration creates a simple delete_user RPC that just removes the auth user;
-- the database cascades through profiles and all related records automatically.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Cascade constraints handle cleanup of profiles and all related records.
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Grant execute to authenticated users so the RPC can be called from the app
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
