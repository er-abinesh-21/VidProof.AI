import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { frameVerdict } from '../lib/verdict';
import styles from './FrameStrip.module.css';

interface FrameStripProps {
  frames: string[];
  // Deepfake likelihood (0-100) per frame; omitted while unknown
  scores?: number[];
  // Shows the scanning loupe while frames are being checked
  scanning?: boolean;
  // Number of empty cells to show before frames exist
  placeholderCount?: number;
}

// The video's own frames on a strip of film, each with its deepfake reading
const FrameStrip: React.FC<FrameStripProps> = ({ frames, scores, scanning = false, placeholderCount = 5 }) => {
  const count = frames.length || placeholderCount;

  return (
    <figure className={styles.wrap} style={{ '--count': count } as React.CSSProperties}>
      <div className={styles.film}>
        <div className={styles.cells}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className={styles.cell}>
              <AnimatePresence>
                {frames[i] && (
                  <motion.img
                    key={frames[i].slice(-24)}
                    src={frames[i]}
                    alt={`Frame ${i + 1} of ${count}`}
                    className={styles.frame}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {scanning && <div className={styles.loupe} aria-hidden="true" />}
      </div>

      <figcaption className={styles.readings}>
        {Array.from({ length: count }, (_, i) => {
          const score = scores?.[i];
          return (
            <div key={i} className={styles.reading}>
              <AnimatePresence mode="wait">
                {typeof score === 'number' ? (
                  <motion.span
                    key="score"
                    className={`${styles.score} ${styles[frameVerdict(score)]}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                  >
                    <strong>{score}%</strong> deepfake
                  </motion.span>
                ) : (
                  <span key="pending" className={styles.pending}>
                    Frame {i + 1}
                  </span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </figcaption>
    </figure>
  );
};

export default FrameStrip;
