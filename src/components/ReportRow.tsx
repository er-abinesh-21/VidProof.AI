import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { VerificationReport } from '../lib/firebase';
import { VERDICT_LABEL, daysUntil, formatDate, verdictFor } from '../lib/verdict';
import styles from './ReportRow.module.css';

interface ReportRowProps {
  report: VerificationReport;
  onDelete?: (report: VerificationReport) => void;
}

const ReportRow: React.FC<ReportRowProps> = ({ report, onDelete }) => {
  const verdict = verdictFor(report.authenticity_score);
  const name = report.filename || 'Untitled video';
  const daysLeft = report.expires_at ? daysUntil(report.expires_at.toDate()) : null;

  return (
    <motion.li
      layout
      className={styles.row}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
    >
      <Link to={`/report/${report.id}`} className={styles.main}>
        <span className={styles.thumb}>
          {report.key_frames?.[0] && <img src={report.key_frames[0]} alt="" />}
        </span>
        <span className={styles.info}>
          <span className={styles.name}>{name}</span>
          <span className={styles.meta}>Analysed {formatDate(report.created_at)}</span>
        </span>
        <span className={styles.expiry}>
          {daysLeft === null ? '' : daysLeft === 0 ? 'Deleted today' : `Deleted in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
        </span>
        <span className={styles.verdict}>
          <span className={`chip chip-${verdict}`}>{VERDICT_LABEL[verdict]}</span>
        </span>
        <span className={styles.score} aria-label={`Score ${report.authenticity_score} out of 100`}>
          {report.authenticity_score}
        </span>
      </Link>
      {onDelete && (
        <button
          type="button"
          className={`btn btn-ghost btn-icon ${styles.delete}`}
          onClick={() => onDelete(report)}
          aria-label={`Delete report for ${name}`}
          title="Delete report"
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      )}
    </motion.li>
  );
};

export default ReportRow;
