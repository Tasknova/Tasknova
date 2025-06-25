-- Drop the faulty policies from the previous migration
DROP POLICY IF EXISTS "Manage own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Read avatars" ON storage.objects;

-- Recreate policies with correct logic

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow authenticated users to delete files from their own folder
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow anyone to view files
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
);
