import React from 'react';
import { motion } from 'framer-motion';
import styles from './Segmented.module.css';

interface SegmentedProps<T extends string | number> {
  id: string; // unique per instance, so the sliding indicators don't jump between controls
  label: string;
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

// A row of mutually exclusive choices; the indicator slides to the picked one
function Segmented<T extends string | number>({ id, label, options, value, onChange, disabled }: SegmentedProps<T>) {
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    const buttons = (event.currentTarget.parentElement?.querySelectorAll('button') || []) as NodeListOf<HTMLButtonElement>;
    buttons[(index + step + options.length) % options.length]?.focus();
  };

  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={`${styles.option} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {selected && (
              <motion.span
                layoutId={`segmented-${id}`}
                className={styles.indicator}
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span className={styles.text}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
