import React from 'react';
import { motion } from 'framer-motion';
import styles from './ScoreRing.module.css';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The authenticity score as a dial that fills to its value when the report opens
const ScoreRing: React.FC<{ score: number; color: string }> = ({ score, color }) => (
  <div className={styles.ring} role="img" aria-label={`Authenticity score ${score} out of 100`}>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle className={styles.track} cx="60" cy="60" r={RADIUS} />
      <motion.circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        transform="rotate(-90 60 60)"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - score / 100) }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </svg>
    <span className={styles.value}>
      <span className={styles.number}>{score}</span>
      <span className={styles.of}>of 100</span>
    </span>
  </div>
);

export default ScoreRing;
