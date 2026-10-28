import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import styles from './Auth.module.css';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { met: password.length >= 8, text: '8 or more characters' },
    { met: /[A-Z]/.test(password), text: 'An uppercase letter' },
    { met: /[a-z]/.test(password), text: 'A lowercase letter' },
    { met: /[0-9]/.test(password), text: 'A number' }
  ];
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

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

    if (!passwordRequirements.every((r) => r.met)) {
      toast.error('Choose a password that meets all four requirements.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('The two passwords don’t match.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      navigate('/'); // Firebase signs the new user in automatically
    } catch {
      // AuthContext already shows the error toast
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Create an account"
      lede="Verify videos and keep their reports for up to 90 days."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogle} disabled={loading} />
      <div className={styles.divider}>or sign up with email</div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="name">Name</label>
          <input
            id="name"
            className="input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
          <label className="field-label" htmlFor="password">Password</label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              className="input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-describedby="password-requirements"
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
          <ul id="password-requirements" className={styles.requirements}>
            {passwordRequirements.map((req) => (
              <li key={req.text} className={`${styles.requirement} ${req.met ? styles.met : ''}`}>
                <span className={styles.tick} aria-hidden="true">
                  {req.met && <FiCheck size={10} strokeWidth={3.5} />}
                </span>
                {req.text}
                <span className="visually-hidden">{req.met ? '(done)' : '(not yet)'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            className="input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={mismatch}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {mismatch && <span className={styles.error}>Doesn’t match the password above.</span>}
        </div>

        <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`} disabled={loading}>
          {loading && <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden="true" />}
          {loading ? 'Creating account' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
