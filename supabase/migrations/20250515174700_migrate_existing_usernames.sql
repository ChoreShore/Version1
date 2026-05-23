-- Generate usernames for existing users
-- Pattern: first letter of first name + last name (truncated to 12 chars)
-- Add random number if collision occurs

-- Function to generate unique username
CREATE OR REPLACE FUNCTION generate_unique_username(user_id UUID, first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  random_suffix INTEGER;
  counter INTEGER := 0;
BEGIN
  -- Generate base username: first letter of first name + last name
  base_username := LEFT(first_name, 1) || last_name;
  base_username := LOWER(SUBSTRING(base_username FROM 1 FOR 11)); -- Max 12 chars total
  
  -- Remove any non-alphanumeric characters
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '', 'g');
  
  -- If empty, use 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  -- Try base username
  SELECT username INTO candidate_username
  FROM profiles
  WHERE username = base_username AND id != user_id;
  
  IF candidate_username IS NULL THEN
    RETURN base_username;
  END IF;
  
  -- If collision, try with random numbers
  WHILE counter < 100 LOOP
    counter := counter + 1;
    random_suffix := FLOOR(RANDOM() * 9000) + 1000; -- 4-digit random number
    candidate_username := SUBSTRING(base_username FROM 1 FOR 8) || random_suffix;
    
    -- Check if this username is taken
    SELECT username INTO candidate_username
    FROM profiles
    WHERE username = candidate_username AND id != user_id;
    
    IF candidate_username IS NULL THEN
      RETURN SUBSTRING(base_username FROM 1 FOR 8) || random_suffix;
    END IF;
  END LOOP;
  
  -- Fallback: use user_id
  RETURN 'user_' || SUBSTRING(user_id::TEXT FROM 1 FOR 8);
END;
$$ LANGUAGE plpgsql;

-- Update existing users with generated usernames
UPDATE profiles
SET username = generate_unique_username(id, first_name, last_name)
WHERE username IS NULL;

-- Fallback: set any remaining NULL usernames to user_id-based value
UPDATE profiles
SET username = 'user_' || SUBSTRING(id::TEXT FROM 1 FOR 8)
WHERE username IS NULL;

-- Make username column NOT NULL after migration
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
