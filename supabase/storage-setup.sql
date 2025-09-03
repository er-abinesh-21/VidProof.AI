-- Storage Setup for 100MB Video Uploads
-- Run this script in your Supabase SQL Editor

-- Create videos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos', 
  false,
  104857600, -- 100MB in bytes
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];

-- Create storage policies for authenticated users
-- Policy for uploading videos
CREATE POLICY "Users can upload their own videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for viewing own videos
CREATE POLICY "Users can view their own videos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for deleting own videos
CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Update global file size limit (requires admin access)
-- Note: This may need to be done through Supabase dashboard or support
-- ALTER SYSTEM SET max_wal_size = '2GB';
-- ALTER SYSTEM SET shared_buffers = '256MB';
