# Photo Upload Setup Guide

This guide explains how to set up the photo upload feature for HireBeHired using Supabase storage.

## Prerequisites

- Supabase project already configured
- Database migrations applied
- Supabase storage bucket created

## Manual Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to Storage → Buckets
3. Click "Create a new bucket"
4. Set bucket name to: `profile-photos`
5. Make it **Public** (so photos can be displayed in the UI)
6. Click "Create bucket"

### 2. Apply Storage Policies

After creating the bucket, apply the storage policies by running the migration:

```bash
# Apply the storage policies migration
supabase db push
```

Or manually apply the SQL from `supabase/migrations/20250515173501_profile_photos_storage_policies.sql` in the Supabase SQL editor.

### 3. Create Folders (Optional)

The application will automatically create folders as needed:
- `employer-photos/` - for employer profile photos
- `worker-photos/` - for worker profile photos

You can create these manually in the Supabase storage dashboard if you prefer.

## Feature Overview

### Photo Upload Requirements

- **File types**: JPG, PNG, WebP
- **Max file size**: 5MB
- **No dimension requirements**: Uploaded as-is

### User Flow

1. **Sign up**: Users create account with email, password, name, and role
2. **Photo requirement**: After email verification, users are redirected to `/auth/complete-profile` to upload a photo
3. **Platform access**: Users cannot access the dashboard until they upload a photo
4. **Photo changes**: Users can change their photo anytime from the Settings page

### API Endpoints

- `POST /api/profile/photo` - Upload a new photo
- `DELETE /api/profile/photo` - Delete current photo

### Components

- `PhotoUpload` - Reusable photo upload component with drag-and-drop and preview
- `PhotoUploadModal` - Modal wrapper for mandatory photo upload
- `PhotoSettingsSection` - Settings page section for photo management

## Database Schema

The `profiles` table now includes:
- `photo_url` (TEXT, nullable) - URL to the user's profile photo in Supabase storage

## Storage Structure

Photos are stored in Supabase storage with the following structure:
```
profile-photos/
├── employer-photos/
│   └── {user-id}/
│       ├── {timestamp}.jpg
│       └── ...
└── worker-photos/
    └── {user-id}/
        ├── {timestamp}.png
        └── ...
```

## Security

Storage policies ensure:
- Authenticated users can only upload to their role-specific folder
- Users can only read their own photos (or public read for display)
- Users can only delete their own photos
- File paths include user ID for ownership verification

## Testing

Run the tests to verify the implementation:

```bash
# Run API tests
npm test -- tests/server/profile/photo-upload.test.ts

# Run component tests
npm test -- tests/components/PhotoUpload.test.ts
```

## Troubleshooting

### Photos not uploading
- Check that the storage bucket exists and is public
- Verify storage policies are applied
- Check browser console for errors
- Verify user is authenticated

### Photos not displaying
- Ensure bucket is public
- Check storage policies allow public read
- Verify photo_url is correctly saved in profiles table

### Redirect loop on sign-in
- Check that photo_url is being saved correctly
- Verify the sign-in flow check is working
- Check browser network tab for API errors
