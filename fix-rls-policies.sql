-- Fix RLS policies for profiles table
-- Drop existing policies one by one
DROP POLICY ON profiles;
DROP POLICY "Users can create their own profile" ON profiles;
DROP POLICY "Users can read their own profile" ON profiles;
DROP POLICY "Users can update their own profile" ON profiles;
DROP POLICY "profiles_insert_trigger_only" ON profiles;
DROP POLICY "profiles_select_own" ON profiles;
DROP POLICY "profiles_update_own" ON profiles;

-- Create new comprehensive policy for all operations
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
