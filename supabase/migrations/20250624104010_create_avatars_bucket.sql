-- Create a public bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create a policy for authenticated users to upload their own avatars
CREATE POLICY "Avatar uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a policy for anyone to read avatars
CREATE POLICY "Avatar reads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
);
