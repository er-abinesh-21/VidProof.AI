import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('Firebase credentials not found. Please check your .env file.');
}

const app = initializeApp(firebaseConfig);

// Auth persists the session in IndexedDB by default
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore collection names
export const COLLECTIONS = {
  videoUploads: 'video_uploads',
  verificationReports: 'verification_reports'
} as const;

// Database types
export interface VideoUpload {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retention_days: number;
  expires_at?: { toDate: () => Date };
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
  } | null;
  tampering_indicators: string[];
  key_frames: string[];
  metadata: any;
  retention_days: number;
  expires_at?: { toDate: () => Date };
  created_at: string;
}

// Data retention: how long a report is kept before Firestore's TTL policy deletes it
export const RETENTION_OPTIONS = [90, 60, 30, 14, 7] as const;
export const DEFAULT_RETENTION_DAYS = 30;

export const expiryDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// TTL deletion can lag by a day or more, so hide expired docs on the client too
export const isExpired = (data: { expires_at?: { toDate: () => Date } | null; [key: string]: any }) =>
  !!data.expires_at && data.expires_at.toDate().getTime() <= Date.now();

// Firestore TTL policies need the Blaze plan, so each user's expired docs are deleted
// client-side when they sign in. Failures are ignored; the next sign-in retries.
export const purgeExpired = async (userId: string) => {
  for (const name of Object.values(COLLECTIONS)) {
    try {
      const snap = await getDocs(query(collection(db, name), where('user_id', '==', userId)));
      await Promise.all(snap.docs.filter((d) => isExpired(d.data() as any)).map((d) => deleteDoc(d.ref)));
    } catch (error) {
      console.warn(`Could not purge expired ${name}:`, error);
    }
  }
};
