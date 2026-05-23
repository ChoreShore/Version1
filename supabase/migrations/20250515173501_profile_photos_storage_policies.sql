-- Storage policies for profile-photos bucket
-- Run this after creating the 'profile-photos' bucket in Supabase dashboard

-- Allow authenticated users to upload photos to their role-specific folder
CREATE POLICY "Users can upload to their role folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (
    (storage.foldername(name))[1] = 'employer-photos'
    OR (storage.foldername(name))[1] = 'worker-photos'
  )
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow authenticated users to read their own photos
CREATE POLICY "Users can read their own photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- REMOVED: Broad public read access policy
-- Previously allowed anyone to read any profile photo
-- This has been removed for security - photos should only be accessible through authenticated access
-- or through a dedicated endpoint that verifies user status

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
