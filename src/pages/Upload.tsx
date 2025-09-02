import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiX, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadVideo } from '../lib/supabase';
import { processVideo } from '../services/aiService';

const MAX_FILE_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '104857600'); // 100MB
const ALLOWED_TYPES = (process.env.REACT_APP_ALLOWED_FILE_TYPES || 'video/mp4,video/quicktime,video/x-msvideo').split(',');

const Upload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    
    if (uploadedFile.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 100MB limit');
      return;
    }

    if (!ALLOWED_TYPES.includes(uploadedFile.type)) {
      toast.error('Invalid file type. Please upload MP4, MOV, or AVI files.');
      return;
    }

    setFile(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE
  });

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Supabase Storage
      const uploadData = await uploadVideo(file, user.id);
      setUploadProgress(50);

      // Create database entry
      const { data: videoData, error: dbError } = await supabase
        .from('video_uploads')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_url: uploadData.path,
          file_size: file.size,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setUploadProgress(75);

      // Process with AI
      setProcessing(true);
      toast.success('Video uploaded! Processing with AI...');
      
      // Call AI processing service
      const report = await processVideo(videoData.id, uploadData.path, user.id);
      
      setUploadProgress(100);
      toast.success('Video verification complete!');
      
      // Navigate to report
      navigate(`/report/${report.id}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto" style={{ padding: '2rem 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Upload Video</h1>
            <p style={{ color: '#94a3b8' }}>Upload your video for AI-powered verification</p>
          </div>

          <div className="max-w-4xl mx-auto" style={{ padding: '0 1rem' }}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(16px) saturate(200%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '3rem',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
                marginBottom: '2rem'
              }}
            >
              {!file ? (
                <div
                  {...getRootProps()}
                  style={{
                    border: '2px dashed',
                    borderColor: isDragActive ? '#818cf8' : 'rgba(148, 163, 184, 0.3)',
                    borderRadius: '16px',
                    padding: '4rem 3rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: isDragActive 
                      ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDragActive) {
                      e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.5)';
                      e.currentTarget.style.background = 'rgba(129, 140, 248, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragActive) {
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FiUploadCloud style={{ 
                      fontSize: '5rem', 
                      margin: '0 auto 1.5rem',
                      color: isDragActive ? '#818cf8' : '#64748b'
                    }} />
                  </motion.div>
                  <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#e2e8f0', fontWeight: '500' }}>
                    {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
                  </p>
                  <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '1.125rem' }}>or click to browse</p>
                  <p style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                    Supported formats: MP4, MOV, AVI (Max 100MB)
                  </p>
                </div>
              ) : (
                <div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%)',
                      borderRadius: '12px',
                      marginBottom: '2rem',
                      border: '1px solid rgba(129, 140, 248, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FiFile style={{ fontSize: '1.5rem', marginRight: '0.75rem', color: '#818cf8' }} />
                      <div>
                        <p style={{ fontWeight: '500', color: '#e2e8f0' }}>{file.name}</p>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <motion.button
                        onClick={removeFile}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                      >
                        <FiX style={{ fontSize: '1.25rem', color: '#fca5a5' }} />
                      </motion.button>
                    )}
                  </motion.div>

                  {uploadProgress > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ marginBottom: '2rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>{processing ? '🤖' : '📤'}</span>
                          <span>{processing ? 'Processing with AI...' : 'Uploading...'}</span>
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#818cf8' }}>{uploadProgress}%</span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div style={{ marginBottom: '2rem' }}>
                    {[
                      { icon: '🔍', text: 'Deepfake detection analysis' },
                      { icon: '🎤', text: 'Speech-to-text extraction' },
                      { icon: '💭', text: 'Sentiment & consistency check' },
                      { icon: '📊', text: 'Comprehensive verification report' }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          marginBottom: '0.75rem',
                          background: 'rgba(52, 211, 153, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(52, 211, 153, 0.1)'
                        }}
                      >
                        <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>{item.icon}</span>
                        <span style={{ color: '#cbd5e1' }}>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    onClick={handleUpload}
                    disabled={uploading || processing}
                    whileHover={{ scale: uploading || processing ? 1 : 1.05 }}
                    whileTap={{ scale: uploading || processing ? 1 : 0.95 }}
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      background: uploading || processing 
                        ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.5) 0%, rgba(100, 116, 139, 0.3) 100%)'
                        : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: uploading || processing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s',
                      boxShadow: uploading || processing 
                        ? 'none'
                        : '0 4px 15px rgba(129, 140, 248, 0.3)'
                    }}
                  >
                    {uploading || processing ? (
                      <>
                        <div className="spinner" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}></div>
                        {processing ? 'Processing...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <FiUploadCloud style={{ marginRight: '0.5rem' }} />
                        Start Verification
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(16px) saturate(200%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '2.5rem',
                marginTop: '2rem',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
              }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#e2e8f0' }}>
                📋 Important Notes
              </h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  '• Maximum file size: 100MB',
                  '• Supported formats: MP4, MOV, AVI',
                  '• Processing time depends on video length and quality',
                  '• All uploads are encrypted and stored securely',
                  '• Reports are generated automatically after processing'
                ].map((note, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    style={{ 
                      color: '#94a3b8', 
                      fontSize: '0.9375rem',
                      marginBottom: '0.75rem',
                      paddingLeft: '0.75rem',
                      lineHeight: '1.6'
                    }}
                  >
                    {note}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Upload;
