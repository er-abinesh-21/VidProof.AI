import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';
import StepRibbon from './StepRibbon';
import styles from './AuthLayout.module.css';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const STRIPES = ['espresso', 'caramel', 'mocha', 'roast'] as const;

// The entrance plays once per visit, not every time you move between sign-in, sign-up and reset
let brandPlayed = false;

// Four stripes fall from the top, then the band slides across and they wrap into the four steps of a check
const BrandPanel: React.FC = () => {
  const animate = useRef(!brandPlayed).current;
  useEffect(() => {
    brandPlayed = true;
  }, []);

  return (
    <aside className={styles.brandSide} aria-hidden="true">
      <div className={`colorbar ${styles.colorbar}`} />

      <div className={styles.stripes}>
        {STRIPES.map((tone, i) => (
          <motion.span
            key={tone}
            className={`${styles.stripe} ${styles[tone]}`}
            initial={animate ? { scaleY: 0 } : false}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.09, ease: EASE }}
          />
        ))}
      </div>

      <motion.p
        className={`display ${styles.claim}`}
        initial={animate ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        Check a video before you trust it.
      </motion.p>

      <motion.div
        className={styles.ribbon}
        initial={animate ? { opacity: 0, x: 60 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
      >
        <StepRibbon compact animateIn={animate} />
      </motion.div>
    </aside>
  );
};

interface AuthLayoutProps {
  title: string;
  lede: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, lede, children, footer }) => (
  <div className={styles.shell}>
    <section className={styles.formSide}>
      <Link to="/login" className={styles.logoLink} aria-label="VidProof">
        <Logo />
      </Link>

      <motion.div
        className={styles.formBox}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <h1 className={`display ${styles.title}`}>{title}</h1>
        <p className={styles.lede}>{lede}</p>
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </motion.div>

      <p className={styles.note}>Videos are analysed on your device and never uploaded.</p>
    </section>

    <BrandPanel />
  </div>
);

export default AuthLayout;
