-- Create a public bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Avatar reads" ON storage.objects;

-- Create a policy for authenticated users to manage their own avatars
CREATE POLICY "Manage own avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a policy for anyone to read avatars
CREATE POLICY "Read avatars"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);
