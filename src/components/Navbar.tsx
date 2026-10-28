import React from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLogOut } from 'react-icons/fi';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

const LINKS = [
  { to: '/', label: 'Overview', match: (path: string) => path === '/' },
  { to: '/upload', label: 'Verify a video', match: (path: string) => path === '/upload' },
  { to: '/reports', label: 'Reports', match: (path: string) => path.startsWith('/report') }
];

// Signed-in shell: top bar plus the current page
const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      // AuthContext already shows the error toast
    }
  };

  return (
    <>
      <header className={styles.bar}>
        <div className="colorbar" aria-hidden="true" />
        <div className={styles.inner}>
          <Link to="/" className={styles.brand} aria-label="VidProof overview">
            <Logo />
          </Link>

          <nav className={styles.nav} aria-label="Main">
            {LINKS.map((link) => {
              const active = link.match(pathname);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`${styles.link} ${active ? styles.active : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className={styles.indicator}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">
              {(user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span className={styles.who} title={user?.email || undefined}>
              {user?.displayName || user?.email}
            </span>
            <button type="button" className={`btn btn-ghost ${styles.signOut}`} onClick={handleSignOut}>
              <FiLogOut aria-hidden="true" />
              <span className={styles.signOutLabel}>Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Navbar;
