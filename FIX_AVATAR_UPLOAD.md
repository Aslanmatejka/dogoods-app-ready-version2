# Fix Avatar Upload Permission Issue

To fix the "Failed to upload avatar: new row violates row-level security policy" error, you need to set up the correct storage policies in your Supabase dashboard.

## Steps to Fix

1. Go to your Supabase project dashboard
2. Navigate to Storage > Policies
3. Click on the "avatars" bucket
4. Add the following policies:

### View Policy (Select)

```sql
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');
```

### Upload Policy (Insert)

```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);
```

### Update Policy

```sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Delete Policy

```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Testing

After setting up these policies:

1. Go back to your profile page
2. Try uploading an avatar again
3. The upload should now work without permission errors

If you're still experiencing issues, please check:

1. That you're properly signed in
2. That your Supabase configuration (URL and API key) is correct
3. That the storage bucket "avatars" exists in your Supabase project
