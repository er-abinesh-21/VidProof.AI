import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'x-my-custom-header': 'vidproof'
    }
  }
});

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
  
  // For files larger than 6MB, use resumable uploads
  const uploadOptions = {
    cacheControl: '3600',
    upsert: false,
    duplex: 'half' as const
  };
  
  // Check if file is larger than 6MB (Supabase's default limit for standard uploads)
  const FILE_SIZE_LIMIT = 6 * 1024 * 1024; // 6MB in bytes
  
  if (file.size > FILE_SIZE_LIMIT) {
    // For large files, we need to use a different approach
    // Split into chunks or use resumable upload
    console.log(`Uploading large file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, uploadOptions);

  if (error) {
    console.error('Upload error:', error);
    if (error.message?.includes('row size') || error.message?.includes('payload too large')) {
      throw new Error('File size exceeds server limit. Please contact support to enable large file uploads.');
    }
    throw error;
  }
  
  return data;
};

export const getVideoUrl = (path: string) => {
  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(path);
  
  return data.publicUrl;
};
