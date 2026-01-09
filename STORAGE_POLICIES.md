# Supabase Storage Policies for Avatar Upload

Run these SQL statements in your Supabase SQL editor to fix the avatar upload permissions:

```sql
-- First, remove any existing policies for the avatars bucket
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Then create new, more permissive policies

-- Allow anyone to view avatars
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update files in their own folder
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## How to Apply These Policies

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the SQL above
5. Click "Run" to execute the statements

## Additional Setup Steps

1. Ensure the "avatars" bucket exists:
   - Go to Storage in your Supabase dashboard
   - Create a bucket named "avatars" if it doesn't exist
   - Make sure "Public bucket" is enabled

2. Verify user authentication:
   - Make sure you're properly signed in before uploading
   - Check that `auth.uid()` returns a valid user ID

3. Clear your browser cache and try uploading again

## Troubleshooting

If you still get permission errors:

1. Check if you're properly authenticated:

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Current user:", session?.user);
```

2. Verify the upload path:

```javascript
console.log("Upload path:", `avatars/${userId}/avatar.jpg`);
```

3. Test bucket permissions:

```javascript
const { data, error } = await supabase.storage.from("avatars").list("", {
  limit: 1,
});
console.log("Bucket access test:", { data, error });
```
