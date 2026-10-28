import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, isExpired, VerificationReport, VideoUpload } from '../lib/firebase';
import { VERDICT_LABEL, Verdict, verdictFor } from '../lib/verdict';
import ReportRow from '../components/ReportRow';
import styles from './Dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const DAY_MS = 24 * 60 * 60 * 1000;
const VERDICTS: Verdict[] = ['authentic', 'review', 'flagged'];
const VERDICT_COLOR: Record<Verdict, string> = { authentic: '#8fc28a', review: '#e9c46a', flagged: '#e5675c' };

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

// Last 7 calendar days (oldest first) with the average score of reports made that day
const buildWeek = (reports: VerificationReport[]) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  return {
    labels: days.map((d) => d.toLocaleDateString(undefined, { weekday: 'short' })),
    values: days.map((day) => {
      const start = day.getTime();
      const dayScores = reports
        .filter((r) => {
          const created = new Date(r.created_at).getTime();
          return created >= start && created < start + DAY_MS;
        })
        .map((r) => r.authenticity_score);
      return dayScores.length ? Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length) : null;
    })
  };
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<VerificationReport[] | null>(null);
  const [uploads, setUploads] = useState<VideoUpload[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const [uploadsSnap, reportsSnap] = await Promise.all([
          getDocs(query(collection(db, COLLECTIONS.videoUploads), where('user_id', '==', user.uid))),
          getDocs(query(collection(db, COLLECTIONS.verificationReports), where('user_id', '==', user.uid)))
        ]);
        if (cancelled) return;
        setUploads(
          uploadsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as VideoUpload)).filter((u) => !isExpired(u))
        );
        setReports(
          reportsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as VerificationReport))
            .filter((r) => !isExpired(r))
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
        );
      } catch (error) {
        console.error('Error loading overview:', error);
        if (!cancelled) {
          toast.error('Couldn’t load your reports. Check your connection and refresh.');
          setReports([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const counts = useMemo(() => {
    const result: Record<Verdict, number> = { authentic: 0, review: 0, flagged: 0 };
    (reports || []).forEach((r) => result[verdictFor(r.authenticity_score)]++);
    return result;
  }, [reports]);

  const week = useMemo(() => buildWeek(reports || []), [reports]);
  const unfinished = uploads.filter((u) => u.status === 'processing' || u.status === 'failed').length;

  if (!reports) {
    return (
      <div className="page-loader" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="visually-hidden">Loading your overview</span>
      </div>
    );
  }

  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const needsLook = counts.review + counts.flagged;
  const lede =
    reports.length === 0
      ? 'Verify your first video and its report will appear here.'
      : `You have ${reports.length} ${reports.length === 1 ? 'report' : 'reports'}. ${
          needsLook === 0 ? 'None need a closer look.' : `${needsLook} ${needsLook === 1 ? 'needs' : 'need'} a closer look.`
        }`;
  const hasWeekData = week.values.some((v) => v !== null);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="display page-title">
            {greeting()}
            {name ? `, ${name}` : ''}
          </h1>
          <p className="page-lede">{lede}</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          <FiPlus aria-hidden="true" />
          Verify a video
        </Link>
      </header>

      <dl className={styles.ledger}>
        <div className={styles.figure}>
          <dt>Reports</dt>
          <dd>{reports.length}</dd>
        </div>
        {VERDICTS.map((v) => (
          <div key={v} className={`${styles.figure} ${styles[v]}`}>
            <dt>{VERDICT_LABEL[v]}</dt>
            <dd>{counts[v]}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.grid}>
        <section className={`panel ${styles.recent}`} aria-labelledby="recent-heading">
          <div className={styles.panelHead}>
            <h2 id="recent-heading">Recent reports</h2>
            {reports.length > 0 && <Link to="/reports">All reports</Link>}
          </div>
          {reports.length === 0 ? (
            <div className={styles.empty}>
              <p>No reports yet. Your video is analysed on this device, so nothing is uploaded.</p>
              <Link to="/upload" className="btn btn-secondary">Verify your first video</Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {reports.slice(0, 5).map((report) => (
                <ReportRow key={report.id} report={report} />
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.side}>
          <section className={`panel ${styles.card}`} aria-labelledby="verdicts-heading">
            <h2 id="verdicts-heading">Verdicts</h2>
            {reports.length === 0 ? (
              <p className="muted">Verdicts from your reports will be broken down here.</p>
            ) : (
              <>
                <div className={styles.bar} role="img" aria-label={VERDICTS.map((v) => `${counts[v]} ${VERDICT_LABEL[v]}`).join(', ')}>
                  {VERDICTS.filter((v) => counts[v] > 0).map((v, i) => (
                    <motion.span
                      key={v}
                      className={styles.segment}
                      style={{ background: VERDICT_COLOR[v] }}
                      initial={{ flexGrow: 0 }}
                      animate={{ flexGrow: counts[v] }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                    />
                  ))}
                </div>
                <ul className={styles.legend}>
                  {VERDICTS.map((v) => (
                    <li key={v}>
                      <span className={styles.swatch} style={{ background: VERDICT_COLOR[v] }} />
                      <span>{VERDICT_LABEL[v]}</span>
                      <strong>{Math.round((counts[v] / reports.length) * 100)}%</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className={`panel ${styles.card}`} aria-labelledby="week-heading">
            <h2 id="week-heading">Average score this week</h2>
            {hasWeekData ? (
              <div className={styles.chart}>
                <Line
                  data={{
                    labels: week.labels,
                    datasets: [
                      {
                        data: week.values,
                        spanGaps: true,
                        borderColor: '#c68f59',
                        backgroundColor: 'rgba(198, 143, 89, 0.14)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: '#c68f59'
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#1a120e',
                        padding: 10,
                        displayColors: false,
                        callbacks: { label: (ctx) => `Average score ${ctx.parsed.y}` }
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: '#a8927a', font: { family: 'Figtree' } } },
                      y: {
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 50, color: '#a8927a', font: { family: 'Figtree' } },
                        grid: { color: '#4a3729' },
                        border: { display: false }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <p className="muted">No videos verified in the last 7 days.</p>
            )}
          </section>

          {unfinished > 0 && (
            <p className={styles.note}>
              {unfinished} {unfinished === 1 ? 'analysis' : 'analyses'} didn’t finish, usually because the page was closed
              while a video was being checked. <Link to="/upload">Verify it again</Link>.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
