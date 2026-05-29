-- Fix handle_new_user trigger function
-- The function was inserting into a non-existent 'email' column on profiles,
-- causing "Database error creating new user" for every signup.
-- Also adds NULLIF guard so empty-string usernames fall back to 'user_<id>' correctly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(
      NULLIF(
        REGEXP_REPLACE(
          LOWER(
            LEFT(COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 1) ||
            LEFT(COALESCE(NEW.raw_user_meta_data->>'last_name', ''), 11)
          ),
          '[^a-z0-9]', '', 'g'
        ),
        ''
      ),
      'user_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)
    )
  );
  RETURN NEW;
END;
$$;
