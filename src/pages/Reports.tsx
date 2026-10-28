import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, isExpired, VerificationReport } from '../lib/firebase';
import { deleteReport } from '../lib/reports';
import { VERDICT_LABEL, Verdict, verdictFor } from '../lib/verdict';
import ReportRow from '../components/ReportRow';
import Segmented from '../components/Segmented';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './Reports.module.css';

type Filter = 'all' | Verdict;

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<VerificationReport[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<VerificationReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        // Sorted client-side to avoid requiring a composite Firestore index
        const snap = await getDocs(
          query(collection(db, COLLECTIONS.verificationReports), where('user_id', '==', user.uid))
        );
        if (cancelled) return;
        setReports(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as VerificationReport))
            .filter((r) => !isExpired(r))
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
        );
      } catch (error) {
        console.error('Error loading reports:', error);
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
    const result: Record<Filter, number> = { all: 0, authentic: 0, review: 0, flagged: 0 };
    (reports || []).forEach((r) => {
      result.all++;
      result[verdictFor(r.authenticity_score)]++;
    });
    return result;
  }, [reports]);

  const visible = (reports || []).filter((r) => filter === 'all' || verdictFor(r.authenticity_score) === filter);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteReport(toDelete);
      setReports((current) => (current || []).filter((r) => r.id !== toDelete.id));
      toast.success('Report deleted');
      setToDelete(null);
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(
        error?.code === 'permission-denied'
          ? 'You can only delete your own reports. Refresh the page and try again.'
          : 'The report couldn’t be deleted. Try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!reports) {
    return (
      <div className="page-loader" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="visually-hidden">Loading reports</span>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="display page-title">Reports</h1>
          <p className="page-lede">Each report is deleted automatically when its retention period ends.</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          <FiPlus aria-hidden="true" />
          Verify a video
        </Link>
      </header>

      {reports.length === 0 ? (
        <div className={`panel ${styles.empty}`}>
          <h2>No reports yet</h2>
          <p>Verify a video and its report will be kept here for as long as you choose, up to 90 days.</p>
          <Link to="/upload" className="btn btn-secondary">Verify your first video</Link>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <Segmented
              id="report-filter"
              label="Show reports"
              value={filter}
              onChange={setFilter}
              options={(['all', 'authentic', 'review', 'flagged'] as Filter[]).map((f) => ({
                value: f,
                label: (
                  <>
                    {f === 'all' ? 'All' : VERDICT_LABEL[f]}
                    <span className={styles.count}>{counts[f]}</span>
                  </>
                )
              }))}
            />
          </div>

          <section className={`panel ${styles.listPanel}`} aria-label="Reports">
            {visible.length === 0 ? (
              <p className={styles.none}>No reports with this verdict.</p>
            ) : (
              <ul className={styles.list}>
                <AnimatePresence initial={false}>
                  {visible.map((report) => (
                    <ReportRow key={report.id} report={report} onDelete={setToDelete} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this report?"
        message={`The report for ${toDelete?.filename || 'this video'} will be permanently deleted. This can’t be undone.`}
        confirmLabel="Delete report"
        busyLabel="Deleting"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default Reports;
