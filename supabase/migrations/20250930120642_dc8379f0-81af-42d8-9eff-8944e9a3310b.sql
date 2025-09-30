-- Ensure storage policies allow authenticated users to upload to videos and thumbnails buckets
-- Videos bucket policies
DROP POLICY IF EXISTS "Public read access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own videos folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

CREATE POLICY "Public read access to videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Users can upload to own videos folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own videos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Thumbnails bucket policies
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own thumbnails folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;

CREATE POLICY "Public read access to thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload to own thumbnails folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own thumbnails"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own thumbnails"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
