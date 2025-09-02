-- Run this script in Supabase SQL Editor to fix the database issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create video_uploads table
CREATE TABLE IF NOT EXISTS video_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_reports table
CREATE TABLE IF NOT EXISTS verification_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  authenticity_score INTEGER CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
  deepfake_likelihood INTEGER CHECK (deepfake_likelihood >= 0 AND deepfake_likelihood <= 100),
  transcript TEXT,
  sentiment_analysis JSONB,
  tampering_indicators TEXT[],
  key_frames TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_verification_reports_user_id ON verification_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_reports_video_id ON verification_reports(video_id);

-- Enable Row Level Security (RLS)
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own video uploads" ON video_uploads;
DROP POLICY IF EXISTS "Users can insert own video uploads" ON video_uploads;
DROP POLICY IF EXISTS "Users can update own video uploads" ON video_uploads;
DROP POLICY IF EXISTS "Users can delete own video uploads" ON video_uploads;

-- Create RLS policies for video_uploads
CREATE POLICY "Users can view own video uploads" ON video_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video uploads" ON video_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video uploads" ON video_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video uploads" ON video_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies if they exist and recreate them for verification_reports
DROP POLICY IF EXISTS "Users can view own reports" ON verification_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON verification_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON verification_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON verification_reports;

-- Create RLS policies for verification_reports
CREATE POLICY "Users can view own reports" ON verification_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON verification_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON verification_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON verification_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for videos (this might fail if bucket exists, which is OK)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

-- Create storage policies
CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist and recreate
DROP TRIGGER IF EXISTS update_video_uploads_updated_at ON video_uploads;
DROP TRIGGER IF EXISTS update_verification_reports_updated_at ON verification_reports;

-- Create triggers for updated_at
CREATE TRIGGER update_video_uploads_updated_at
  BEFORE UPDATE ON video_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_reports_updated_at
  BEFORE UPDATE ON verification_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
