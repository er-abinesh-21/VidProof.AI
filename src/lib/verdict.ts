// One place for how scores turn into verdicts, so every screen and the PDF agree.
export type Verdict = 'authentic' | 'review' | 'flagged';

export const verdictFor = (score: number): Verdict =>
  score >= 70 ? 'authentic' : score >= 40 ? 'review' : 'flagged';

export const VERDICT_LABEL: Record<Verdict, string> = {
  authentic: 'Likely authentic',
  review: 'Needs review',
  flagged: 'Likely manipulated'
};

export const VERDICT_SUMMARY: Record<Verdict, string> = {
  authentic: 'No strong signs of manipulation in the sampled frames.',
  review: 'Some signals are inconclusive. Check the frames and the source before relying on this video.',
  flagged: 'The sampled frames show strong signs of AI generation or manipulation.'
};

// Per-frame deepfake probability (0-100) to a verdict for that frame
export const frameVerdict = (deepfakePercent: number): Verdict =>
  deepfakePercent < 30 ? 'authentic' : deepfakePercent < 60 ? 'review' : 'flagged';

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

export const daysUntil = (date: Date) => Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
