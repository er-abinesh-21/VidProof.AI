import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiFileText, FiFilm, FiMic, FiShield } from 'react-icons/fi';
import styles from './StepRibbon.module.css';

// The four steps of a check, each wrapped in one palette colour, like stripes folding over a band
const STEPS = [
  { icon: FiFilm, label: 'Sample', detail: 'Five frames are taken from the video' },
  { icon: FiShield, label: 'Detect', detail: 'Each frame is checked for deepfakes' },
  { icon: FiMic, label: 'Listen', detail: 'Speech is transcribed and its tone measured' },
  { icon: FiFileText, label: 'Report', detail: 'A verdict you can keep or download' }
];
const TONES = ['espresso', 'caramel', 'mocha', 'roast'] as const;

interface StepRibbonProps {
  // Index of the step in progress; omit to show the steps as a plain explainer
  current?: number;
  complete?: boolean;
  compact?: boolean;
  animateIn?: boolean;
}

const StepRibbon: React.FC<StepRibbonProps> = ({ current, complete = false, compact = false, animateIn = true }) => (
  <ol className={`${styles.band} ${compact ? styles.compact : ''}`}>
    {STEPS.map((step, i) => {
      const state =
        current === undefined ? 'idle' : complete || i < current ? 'done' : i === current ? 'active' : 'pending';
      const Icon = step.icon;
      return (
        <motion.li
          key={step.label}
          className={`${styles.pill} ${styles[TONES[i]]} ${styles[state]}`}
          style={{ zIndex: i + 1 }}
          initial={animateIn ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: state === 'active' ? -4 : 0 }}
          transition={{ duration: 0.5, delay: animateIn ? 0.15 + i * 0.09 : 0, ease: [0.2, 0.8, 0.2, 1] }}
          aria-current={state === 'active' ? 'step' : undefined}
        >
          <span className={styles.icon} aria-hidden="true">
            {state === 'done' ? (
              <FiCheck strokeWidth={3} />
            ) : state === 'active' ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <Icon />
            )}
          </span>
          <span className={styles.num} aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className={styles.label}>{step.label}</span>
          <span className={styles.detail}>{step.detail}</span>
          {state !== 'idle' && (
            <span className="visually-hidden">
              {state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Waiting'}
            </span>
          )}
        </motion.li>
      );
    })}
  </ol>
);

export default StepRibbon;
