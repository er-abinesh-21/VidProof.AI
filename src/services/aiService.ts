import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS, expiryDate } from '../lib/firebase';
import toast from 'react-hot-toast';

// When true, results are replaced with clearly labelled placeholder data if the AI models cannot run
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

// Free, open-source models that run locally in the browser (see ai.worker.ts); no API key or server needed.
// Keep these names in sync with the worker.
const MODELS = {
  deepfake: 'onnx-community/Deep-Fake-Detector-v2-Model-ONNX',
  whisper: 'Xenova/whisper-tiny',
  sentiment: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
};

const FRAME_COUNT = 5;
const MAX_FRAME_WIDTH = 640; // keeps stored frames small enough for Firestore's 1MB document limit
const FRAME_EXTRACTION_TIMEOUT_MS = 30000;
const MAX_TRANSCRIPT_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TRANSCRIPT_SECONDS = 300; // only the first 5 minutes are transcribed
const WHISPER_SAMPLE_RATE = 16000;
const SILENCE_THRESHOLD = 0.01;
const MAX_SENTIMENT_CHARS = 2000;

interface Sentiment {
  positive: number;
  negative: number;
  neutral: number;
}

// Extract frames from a video (client-side), sampled from the middle of each segment
const extractFrames = (videoUrl: string, numFrames: number = FRAME_COUNT): Promise<string[]> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frames: string[] = [];
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      resolve(frames);
    };
    // Unsupported codecs can leave the video silent (no events at all), so never wait forever
    const timer = setTimeout(finish, FRAME_EXTRACTION_TIMEOUT_MS);

    video.muted = true;
    video.preload = 'auto';
    video.addEventListener('error', finish);
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      if (!context || !isFinite(duration) || duration <= 0 || !video.videoWidth) {
        finish();
        return;
      }

      const interval = duration / numFrames;
      const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      let index = 0;

      const captureNext = () => {
        if (index >= numFrames) {
          finish();
          return;
        }
        video.addEventListener('seeked', onSeeked, { once: true });
        video.currentTime = Math.min(duration - 0.05, interval * (index + 0.5));
      };

      const onSeeked = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
        index++;
        captureNext();
      };

      captureNext();
    });

    video.src = videoUrl;
  });

// Talks to the AI worker; resolves to null (never fake data) when a model cannot run
let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, (result: { value?: any; failed?: boolean }) => void>();

const failAllPending = () => {
  pending.forEach((resolve) => resolve({ failed: true }));
  pending.clear();
  worker?.terminate();
  worker = null;
};

const getWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent) => {
      const { id, result, error } = event.data;
      const resolve = pending.get(id);
      if (!resolve) return;
      pending.delete(id);
      if (error) console.error('AI worker error:', error);
      resolve(error ? { failed: true } : { value: result });
    };
    worker.onerror = (event) => {
      console.error('AI worker crashed:', event.message);
      failAllPending();
    };
  }
  return worker;
};

const runModel = <T>(task: string, payload: object, transfer: Transferable[] = []): Promise<T | null> =>
  new Promise((resolve) => {
    const id = nextRequestId++;
    pending.set(id, (res) => resolve(res.failed ? null : (res.value as T)));
    try {
      getWorker().postMessage({ id, task, payload }, transfer);
    } catch (error) {
      console.error('Could not start AI worker:', error);
      pending.delete(id);
      resolve(null);
    }
  });

// Deepfake likelihood (0-100) of each frame, or null if the model could not run
const analyzeFramesForDeepfake = async (frames: string[]): Promise<number[] | null> => {
  const probabilities = await runModel<number[]>('deepfake', { frames });
  if (!probabilities || probabilities.length !== frames.length) return null;
  return probabilities.map((p) => Math.round(p * 100));
};

// Decode the video's audio track to 16kHz mono samples; null when there is no usable audio
const extractAudio = async (file: File): Promise<Float32Array | null> => {
  if (file.size > MAX_TRANSCRIPT_FILE_BYTES) return null;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  const audioContext = new AudioContextClass({ sampleRate: WHISPER_SAMPLE_RATE });

  try {
    const decoded = await audioContext.decodeAudioData(await file.arrayBuffer());
    const length = Math.min(decoded.length, MAX_TRANSCRIPT_SECONDS * WHISPER_SAMPLE_RATE);
    const mono = new Float32Array(length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const data = decoded.getChannelData(channel);
      for (let i = 0; i < length; i++) mono[i] += data[i] / decoded.numberOfChannels;
    }

    // Whisper invents text for silence, so skip it
    let peak = 0;
    for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(mono[i]));
    return peak < SILENCE_THRESHOLD ? null : mono;
  } catch (error) {
    console.warn('Could not decode audio from this video:', error);
    return null;
  } finally {
    audioContext.close().catch(() => {});
  }
};

// Speech-to-text on the video's audio track; null when unavailable
const extractTranscript = async (file: File): Promise<string | null> => {
  const audio = await extractAudio(file);
  if (!audio) return null;
  const text = await runModel<string>('transcribe', { audio }, [audio.buffer]);
  return text && text.length > 2 ? text : null;
};

// Analyze sentiment of transcript; null when unavailable
const analyzeSentiment = async (text: string): Promise<Sentiment | null> => {
  const labels = await runModel<{ label: string; score: number }[]>('sentiment', {
    text: text.slice(0, MAX_SENTIMENT_CHARS)
  });
  if (!labels) return null;

  let positive = 0;
  let negative = 0;
  labels.forEach((item) => {
    if (/positive/i.test(item.label)) positive = item.score * 100;
    else if (/negative/i.test(item.label)) negative = item.score * 100;
  });

  const roundedPositive = Math.round(positive);
  const roundedNegative = Math.round(negative);
  return {
    positive: roundedPositive,
    negative: roundedNegative,
    neutral: Math.max(0, 100 - roundedPositive - roundedNegative)
  };
};

// Detect tampering indicators
const detectTamperingIndicators = (deepfakeScore: number, sentiment: Sentiment | null): string[] => {
  const indicators: string[] = [];

  if (deepfakeScore > 70) {
    indicators.push('High probability of AI-generated or manipulated content detected');
  } else if (deepfakeScore > 50) {
    indicators.push('Moderate signs of potential video manipulation');
  }
  if (sentiment && sentiment.negative > 60) {
    indicators.push('High negative sentiment detected in speech content');
  }

  return indicators;
};

// SHA-256 of the original file, so a report can be tied to the exact video analysed
const hashFile = async (file: File): Promise<string | null> => {
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Could not hash video:', error); // crypto.subtle needs HTTPS or localhost
    return null;
  }
};

export type AnalysisStage = 'frames' | 'deepfake' | 'transcript' | 'sentiment' | 'saving';

export interface AnalysisProgress {
  stage: AnalysisStage;
  frames?: string[];
  frameScores?: number[];
}

// Main processing function
export const processVideo = async (
  videoId: string,
  file: File,
  userId: string,
  retentionDays: number,
  onProgress: (progress: AnalysisProgress) => void = () => {}
) => {
  // The video is analysed in the browser straight from the selected file (nothing is stored)
  const videoUrl = URL.createObjectURL(file);
  const startedAt = Date.now();

  try {
    onProgress({ stage: 'frames' });
    const frames = await extractFrames(videoUrl);
    if (frames.length === 0) {
      throw new Error('Could not read frames from this video. The file may be corrupt or use an unsupported codec.');
    }

    onProgress({ stage: 'deepfake', frames });
    let frameScores = await analyzeFramesForDeepfake(frames);
    if (frameScores) onProgress({ stage: 'transcript', frames, frameScores });
    else onProgress({ stage: 'transcript', frames });

    let transcript = await extractTranscript(file);

    onProgress({ stage: 'sentiment', frames, frameScores: frameScores || undefined });
    let sentiment = transcript ? await analyzeSentiment(transcript) : null;

    let demoData = false;
    if (frameScores === null) {
      if (!DEMO_MODE) {
        throw new Error(
          'The AI models could not run. Check your internet connection (they download on first use) and try again.'
        );
      }
      demoData = true;
      frameScores = frames.map(() => 15);
      transcript = 'Demo transcript: placeholder text, not from this video.';
      sentiment = { positive: 60, negative: 10, neutral: 30 };
      toast('AI models unavailable: showing demo data', { icon: '⚠️' });
    }

    const deepfakeScore = Math.round(frameScores.reduce((acc, p) => acc + p, 0) / frameScores.length);
    const tamperingIndicators = detectTamperingIndicators(deepfakeScore, sentiment);
    onProgress({ stage: 'saving', frames, frameScores });

    // Overall authenticity score (sentiment counts as neutral when there was no speech to analyse)
    const authenticityScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (100 - deepfakeScore) * 0.6 + // 60% weight on deepfake detection
            ((sentiment ? sentiment.positive : 50) / 100) * 20 + // 20% weight on positive sentiment
            (tamperingIndicators.length === 0 ? 20 : 10) // 20% for no tampering indicators
        )
      )
    );

    const reportData = {
      video_id: videoId,
      user_id: userId,
      filename: file.name,
      authenticity_score: authenticityScore,
      deepfake_likelihood: deepfakeScore,
      transcript: transcript || '',
      sentiment_analysis: sentiment,
      tampering_indicators: tamperingIndicators,
      key_frames: frames, // small JPEGs; all five stay well under Firestore's 1MB limit
      frame_scores: frameScores,
      metadata: {
        processing_date: new Date().toISOString(),
        processing_seconds: Math.round((Date.now() - startedAt) / 1000),
        models_used: [MODELS.deepfake, ...(transcript ? [MODELS.whisper] : []), ...(sentiment ? [MODELS.sentiment] : [])],
        video_sha256: await hashFile(file),
        video_size: file.size,
        demo_data: demoData
      },
      retention_days: retentionDays,
      expires_at: expiryDate(retentionDays),
      created_at: new Date().toISOString()
    };
    const reportRef = await addDoc(collection(db, COLLECTIONS.verificationReports), reportData);
    const report = { id: reportRef.id, ...reportData };

    // Update video status
    await updateDoc(doc(db, COLLECTIONS.videoUploads, videoId), { status: 'completed' });

    return report;
  } catch (error: any) {
    console.error('Error processing video:', error);

    // Update video status to failed
    await updateDoc(doc(db, COLLECTIONS.videoUploads, videoId), { status: 'failed' }).catch(() => {});

    throw error; // the caller shows the error
  } finally {
    URL.revokeObjectURL(videoUrl);
  }
};
