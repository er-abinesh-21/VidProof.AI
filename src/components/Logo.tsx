import React from 'react';
import styles from './Logo.module.css';

// Viewfinder brackets around a record dot: checking footage is the whole product
const Logo: React.FC<{ inverse?: boolean }> = ({ inverse }) => (
  <span className={`${styles.logo} ${inverse ? styles.inverse : ''}`}>
    <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3.2" className={styles.dot} />
    </svg>
    <span className={styles.word}>VidProof</span>
  </span>
);

export default Logo;
