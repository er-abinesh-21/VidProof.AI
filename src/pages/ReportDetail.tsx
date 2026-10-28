import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDownload, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, isExpired, VerificationReport } from '../lib/firebase';
import { deleteReport } from '../lib/reports';
import { downloadReportPdf } from '../lib/reportPdf';
import {
  VERDICT_LABEL,
  VERDICT_SUMMARY,
  daysUntil,
  formatBytes,
  formatDateTime,
  frameVerdict,
  verdictFor
} from '../lib/verdict';
import FrameStrip from '../components/FrameStrip';
import ScoreRing from '../components/ScoreRing';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './ReportDetail.module.css';

const EASE = [0.2, 0.8, 0.2, 1] as const;

const Meter: React.FC<{ value: number; tone: string; label: string }> = ({ value, tone, label }) => (
  <div className={styles.meter} role="img" aria-label={`${label}: ${value}%`}>
    <motion.span
      className={styles.meterFill}
      style={{ background: tone }}
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
    />
  </div>
);

const TONE = { authentic: 'var(--authentic)', review: 'var(--review)', flagged: 'var(--flagged)' };
// SVG presentation attributes can't read CSS variables, so the ring gets the literal colours
const VERDICT_HEX = { authentic: '#8fc28a', review: '#e9c46a', flagged: '#e5675c' };

const ReportDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<VerificationReport | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    setReport(undefined);

    (async () => {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.verificationReports, id));
        const data = snap.exists() ? ({ id: snap.id, ...snap.data() } as VerificationReport) : null;
        if (!cancelled) setReport(data && !isExpired(data) ? data : null);
      } catch (error) {
        console.error('Error loading report:', error);
        if (!cancelled) setReport(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Couldn’t copy. Select the fingerprint and copy it manually.');
    }
  };

  const confirmDelete = async () => {
    if (!report) return;
    setDeleting(true);
    try {
      await deleteReport(report);
      toast.success('Report deleted');
      navigate('/reports');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('The report couldn’t be deleted. Try again.');
      setDeleting(false);
    }
  };

  if (report === undefined) {
    return (
      <div className="page-loader" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="visually-hidden">Loading report</span>
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="page">
        <div className={`panel ${styles.missing}`}>
          <h1 className="display">Report not found</h1>
          <p>It may have been deleted, or its retention period has ended.</p>
          <Link to="/reports" className="btn btn-secondary">Back to reports</Link>
        </div>
      </div>
    );
  }

  const verdict = verdictFor(report.authenticity_score);
  const deepfakeVerdict = frameVerdict(report.deepfake_likelihood);
  const daysLeft = report.expires_at ? daysUntil(report.expires_at.toDate()) : null;
  const sentiment = report.sentiment_analysis;
  const hash: string | null = report.metadata?.video_sha256 || null;

  return (
    <div className="page">
      <Link to="/reports" className={styles.back}>
        <FiArrowLeft aria-hidden="true" />
        All reports
      </Link>

      <header className={`${styles.hero} ${styles[`aura-${verdict}`]}`}>
        <div className={styles.verdictLine}>
          <div>
            <motion.h1
              className={`display ${styles.verdict} ${styles[verdict]}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              {VERDICT_LABEL[verdict]}
            </motion.h1>
            <p className={styles.summary}>{VERDICT_SUMMARY[verdict]}</p>
          </div>
          <ScoreRing score={report.authenticity_score} color={VERDICT_HEX[verdict]} />
        </div>

        <dl className={styles.details}>
          <div>
            <dt>File</dt>
            <dd title={report.filename}>{report.filename || 'Not recorded'}</dd>
          </div>
          <div>
            <dt>Analysed</dt>
            <dd>{formatDateTime(report.created_at)}</dd>
          </div>
          <div>
            <dt>Kept until</dt>
            <dd>
              {report.expires_at
                ? `${formatDateTime(report.expires_at.toDate().toISOString())} (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left)`
                : 'Not set'}
            </dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={() => downloadReportPdf(report)}>
            <FiDownload aria-hidden="true" />
            Download PDF
          </button>
          <button type="button" className={`btn btn-ghost ${styles.deleteBtn}`} onClick={() => setConfirmOpen(true)}>
            <FiTrash2 aria-hidden="true" />
            Delete report
          </button>
        </div>
      </header>

      {report.metadata?.demo_data && (
        <p className={styles.demo} role="note">
          Demo data: the AI models couldn’t run, so these values are placeholders and not a real analysis.
        </p>
      )}

      <section className={styles.frames} aria-labelledby="frames-heading">
        <div className={styles.sectionHead}>
          <h2 id="frames-heading">Sampled frames</h2>
          <p>How likely each frame is to be a deepfake</p>
        </div>
        {report.key_frames?.length ? (
          <FrameStrip frames={report.key_frames} scores={report.frame_scores} />
        ) : (
          <p className="muted">No frames were stored for this report.</p>
        )}
      </section>

      <div className={styles.columns}>
        <section className={`panel ${styles.transcript}`} aria-labelledby="transcript-heading">
          <h2 id="transcript-heading">Transcript</h2>
          {report.transcript ? (
            <p className={styles.transcriptText}>{report.transcript}</p>
          ) : (
            <p className="muted">
              No speech was transcribed. The video may be silent, or over the transcription limits (50 MB and the first 5
              minutes).
            </p>
          )}
        </section>

        <section className={`panel ${styles.signals}`} aria-labelledby="signals-heading">
          <h2 id="signals-heading">Signals</h2>

          <div className={styles.signal}>
            <div className={styles.signalHead}>
              <h3>Deepfake likelihood</h3>
              <strong style={{ color: TONE[deepfakeVerdict] }}>{report.deepfake_likelihood}%</strong>
            </div>
            <Meter value={report.deepfake_likelihood} tone={TONE[deepfakeVerdict]} label="Deepfake likelihood" />
            <p className={styles.signalNote}>Average across the sampled frames</p>
          </div>

          <div className={styles.signal}>
            <div className={styles.signalHead}>
              <h3>Tone of speech</h3>
            </div>
            {sentiment ? (
              <>
                <div className={styles.tone} role="img" aria-label={`Positive ${sentiment.positive}%, neutral ${sentiment.neutral}%, negative ${sentiment.negative}%`}>
                  {[
                    { key: 'positive', value: sentiment.positive, color: 'var(--authentic)' },
                    { key: 'neutral', value: sentiment.neutral, color: 'var(--rule-strong)' },
                    { key: 'negative', value: sentiment.negative, color: 'var(--flagged)' }
                  ]
                    .filter((part) => part.value > 0)
                    .map((part, i) => (
                      <motion.span
                        key={part.key}
                        style={{ background: part.color }}
                        initial={{ flexGrow: 0 }}
                        animate={{ flexGrow: part.value }}
                        transition={{ duration: 0.7, delay: 0.35 + i * 0.08, ease: EASE }}
                      />
                    ))}
                </div>
                <ul className={styles.toneLegend}>
                  <li><span style={{ background: 'var(--authentic)' }} />Positive {sentiment.positive}%</li>
                  <li><span style={{ background: 'var(--rule-strong)' }} />Neutral {sentiment.neutral}%</li>
                  <li><span style={{ background: 'var(--flagged)' }} />Negative {sentiment.negative}%</li>
                </ul>
              </>
            ) : (
              <p className={styles.signalNote}>No speech to measure.</p>
            )}
          </div>

          <div className={styles.signal}>
            <div className={styles.signalHead}>
              <h3>Tampering indicators</h3>
            </div>
            {report.tampering_indicators?.length ? (
              <ul className={styles.indicators}>
                {report.tampering_indicators.map((indicator) => (
                  <li key={indicator}>{indicator}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.signalNote}>None found.</p>
            )}
          </div>
        </section>
      </div>

      <section className={styles.fingerprint} aria-labelledby="fingerprint-heading">
        <h2 id="fingerprint-heading">Verification details</h2>
        <dl>
          <div className={styles.hashRow}>
            <dt>SHA-256 fingerprint</dt>
            <dd>
              {hash ? (
                <>
                  <code className={styles.hash}>{hash}</code>
                  <button type="button" className="btn btn-ghost" onClick={() => copyHash(hash)}>
                    {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </>
              ) : (
                'Not available'
              )}
            </dd>
          </div>
          <div>
            <dt>Video size</dt>
            <dd>{report.metadata?.video_size ? formatBytes(report.metadata.video_size) : 'Not recorded'}</dd>
          </div>
          <div>
            <dt>Models used</dt>
            <dd>{(report.metadata?.models_used || []).join(', ') || 'Not recorded'}</dd>
          </div>
          <div>
            <dt>Report ID</dt>
            <dd>{report.id}</dd>
          </div>
        </dl>
        <p className={styles.disclaimer}>
          This is automated screening. Treat the verdict as a signal to guide further checks, not as forensic proof.
        </p>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this report?"
        message={`The report for ${report.filename || 'this video'} will be permanently deleted. This can’t be undone.`}
        confirmLabel="Delete report"
        busyLabel="Deleting"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ReportDetail;
