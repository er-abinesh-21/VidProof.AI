import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import { addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, RETENTION_OPTIONS, DEFAULT_RETENTION_DAYS, expiryDate } from '../lib/firebase';
import { processVideo, AnalysisProgress, AnalysisStage } from '../services/aiService';
import { formatBytes } from '../lib/verdict';
import FrameStrip from '../components/FrameStrip';
import Segmented from '../components/Segmented';
import StepRibbon from '../components/StepRibbon';
import styles from './Upload.module.css';

const MAX_FILE_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '104857600'); // 100MB
const MAX_MB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
const ALLOWED_TYPES = (process.env.REACT_APP_ALLOWED_FILE_TYPES || 'video/mp4,video/quicktime,video/x-msvideo').split(',');

// Which of the four ribbon steps each analysis stage belongs to
const STEP_OF: Record<AnalysisStage, number> = { frames: 0, deepfake: 1, transcript: 2, sentiment: 2, saving: 3 };

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

type Phase = 'select' | 'analysing' | 'error';

const Upload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [retentionDays, setRetentionDays] = useState<number>(DEFAULT_RETENTION_DAYS);
  const [phase, setPhase] = useState<Phase>('select');
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');

  // Preview the chosen file locally; nothing leaves the device
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDuration(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Leaving mid-analysis loses the work, so ask first
  useEffect(() => {
    if (phase !== 'analysing') return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const chosen = acceptedFiles[0];
    if (!chosen) return; // every dropped file was rejected (handled in onDropRejected)
    if (!ALLOWED_TYPES.includes(chosen.type)) {
      setError('That file type isn’t supported. Choose an MP4, MOV or AVI video.');
      return;
    }
    setError('');
    setFile(chosen);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      setError(
        code === 'file-too-large'
          ? `That video is larger than ${MAX_MB} MB. Trim it or choose a shorter clip.`
          : code === 'too-many-files'
          ? 'Choose one video at a time.'
          : 'That file type isn’t supported. Choose an MP4, MOV or AVI video.'
      );
    },
    accept: { 'video/*': ['.mp4', '.mov', '.avi'] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    noClick: !!file,
    noKeyboard: !!file,
    disabled: phase === 'analysing'
  });

  const startAnalysis = async () => {
    if (!file || !user) return;
    setPhase('analysing');
    setFinished(false);
    setError('');
    setProgress({ stage: 'frames' });

    try {
      const now = new Date().toISOString();
      const videoRef = await addDoc(collection(db, COLLECTIONS.videoUploads), {
        user_id: user.uid,
        filename: file.name,
        file_size: file.size,
        upload_date: now,
        status: 'processing',
        retention_days: retentionDays,
        expires_at: expiryDate(retentionDays),
        created_at: now
      });

      const report = await processVideo(videoRef.id, file, user.uid, retentionDays, setProgress);
      setFinished(true);
      setTimeout(() => navigate(`/report/${report.id}`), 700);
    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err?.message || 'The video couldn’t be checked. Try again.');
      setPhase('error');
    }
  };

  const reset = () => {
    setFile(null);
    setProgress(null);
    setError('');
    setPhase('select');
  };

  const currentStep = progress ? STEP_OF[progress.stage] : 0;

  if (phase === 'analysing' && file) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="display page-title">{finished ? 'Report ready' : 'Checking your video'}</h1>
            <p className="page-lede">
              {file.name}. Keep this page open until the report is saved.
            </p>
          </div>
        </header>

        <FrameStrip
          frames={progress?.frames || []}
          scores={progress?.frameScores}
          scanning={progress?.stage === 'deepfake'}
        />

        <div className={styles.ribbon}>
          <StepRibbon current={currentStep} complete={finished} animateIn={false} />
        </div>
        <p className={styles.hint} aria-live="polite">
          {finished
            ? 'Report saved. Opening it now.'
            : progress?.stage === 'deepfake'
            ? 'Checking frames. The first check downloads the AI models (about 200 MB); after that they’re cached.'
            : progress?.stage === 'transcript' || progress?.stage === 'sentiment'
            ? 'Listening to the speech and measuring its tone.'
            : progress?.stage === 'saving'
            ? 'Saving the report.'
            : 'Reading frames from the video.'}
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="display page-title">Verify a video</h1>
          <p className="page-lede">
            The video is analysed on this device and never uploaded. Only the report is saved.
          </p>
        </div>
      </header>

      <AnimatePresence>
        {error && (
          <motion.div
            className={styles.error}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.errorInner}>
              <FiAlertTriangle aria-hidden="true" />
              <p>{error}</p>
              {phase === 'error' && file && (
                <button type="button" className="btn btn-secondary" onClick={startAnalysis}>
                  Try again
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.layout}>
        <div
          {...getRootProps({
            className: `${styles.viewfinder} ${isDragActive ? styles.dragging : ''} ${file ? styles.hasFile : ''}`
          })}
        >
          <input {...getInputProps()} aria-label="Choose a video file" />
          <span className={`${styles.corner} ${styles.tl}`} />
          <span className={`${styles.corner} ${styles.tr}`} />
          <span className={`${styles.corner} ${styles.br}`} />
          <span className={`${styles.corner} ${styles.bl}`} />

          {file && previewUrl ? (
            <video
              className={styles.preview}
              src={previewUrl}
              controls
              muted
              playsInline
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
          ) : (
            <div className={styles.prompt}>
              <p className={styles.promptTitle}>
                <span className={styles.pointerCopy}>{isDragActive ? 'Drop to choose this video' : 'Drop a video here'}</span>
                <span className={styles.touchCopy}>Choose a video</span>
              </p>
              <p className={styles.promptText}>MP4, MOV or AVI, up to {MAX_MB} MB</p>
              <button type="button" className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); open(); }}>
                Choose a file
              </button>
            </div>
          )}
        </div>

        <aside className={styles.side}>
          {file ? (
            <div className={styles.fileInfo}>
              <p className={styles.fileName} title={file.name}>{file.name}</p>
              <dl className={styles.fileMeta}>
                <div><dt>Size</dt><dd>{formatBytes(file.size)}</dd></div>
                <div><dt>Length</dt><dd>{duration ? formatDuration(duration) : '…'}</dd></div>
              </dl>
              <button type="button" className={`btn btn-ghost ${styles.change}`} onClick={reset}>
                Choose a different video
              </button>
            </div>
          ) : (
            <p className={styles.privacy}>
              Nothing is uploaded. A SHA-256 fingerprint ties the report to the exact file you check.
            </p>
          )}

          <div className={styles.retention}>
            <h2>Keep the report for</h2>
            <Segmented
              id="retention"
              label="Keep the report for"
              value={retentionDays}
              onChange={setRetentionDays}
              options={[...RETENTION_OPTIONS].sort((a, b) => a - b).map((days) => ({ value: days, label: `${days} days` }))}
            />
            <p className="field-hint">The report is deleted automatically after this.</p>
          </div>

          <button type="button" className={`btn btn-primary btn-block ${styles.start}`} disabled={!file} onClick={startAnalysis}>
            Start verification
          </button>
        </aside>
      </div>

      <section className={styles.how} aria-labelledby="how-heading">
        <h2 id="how-heading">How a check works</h2>
        <StepRibbon />
      </section>
    </div>
  );
};

export default Upload;
