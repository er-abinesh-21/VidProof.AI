import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import styles from './Auth.module.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSentTo(email);
    } catch {
      // AuthContext already shows the error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      lede="Enter the email you signed up with and we’ll send you a link to choose a new password."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <AnimatePresence mode="wait">
        {sentTo ? (
          <motion.div
            key="sent"
            className={styles.sent}
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <strong>Check your inbox</strong>
            If an account exists for {sentTo}, a reset link is on its way. It can take a few minutes to arrive.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className={styles.form}
            onSubmit={handleSubmit}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="field">
              <label className="field-label" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`} disabled={loading}>
              {loading && <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden="true" />}
              {loading ? 'Sending link' : 'Send reset link'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ForgotPassword;
