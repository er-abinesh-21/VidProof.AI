import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import styles from './Auth.module.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch {
      // AuthContext already shows the error toast
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch {
      // AuthContext already shows the error toast
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Sign in"
      lede="Pick up where you left off with your reports."
      footer={
        <>
          New to VidProof? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogle} disabled={loading} />
      <div className={styles.divider}>or use your email</div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <div className={styles.labelRow}>
            <label className="field-label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className={styles.smallLink}>Forgot password?</Link>
          </div>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              className="input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`} disabled={loading}>
          {loading && <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden="true" />}
          {loading ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
