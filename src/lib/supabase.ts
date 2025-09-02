import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface VideoUpload {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface VerificationReport {
  id: string;
  video_id: string;
  user_id: string;
  authenticity_score: number;
  deepfake_likelihood: number;
  transcript: string;
  sentiment_analysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  tampering_indicators: string[];
  key_frames: string[];
  metadata: any;
  created_at: string;
}

// Storage helpers
export const uploadVideo = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  
  return data;
};

export const getVideoUrl = (path: string) => {
  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(path);
  
  return data.publicUrl;
};
