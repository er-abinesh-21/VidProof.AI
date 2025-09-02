import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUpload, FiFileText, FiLogOut, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItemStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'all 0.3s',
    background: active 
      ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)' 
      : 'transparent',
    border: active ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid transparent',
    color: active ? '#ffffff' : '#cbd5e1',
    textDecoration: 'none',
    position: 'relative' as const,
    overflow: 'hidden'
  });

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Link to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textDecoration: 'none'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <FiShield style={{ 
                fontSize: '2rem', 
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(129, 140, 248, 0.5))'
              }} />
            </motion.div>
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em'
            }}>
              VidProof
            </span>
          </Link>
        </motion.div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/"
              style={navItemStyle(isActive('/'))}
              onMouseEnter={(e) => {
                if (!isActive('/')) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <FiHome style={{ fontSize: '1.125rem' }} />
              <span>Dashboard</span>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/upload"
              style={navItemStyle(isActive('/upload'))}
              onMouseEnter={(e) => {
                if (!isActive('/upload')) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/upload')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <FiUpload style={{ fontSize: '1.125rem' }} />
              <span>Upload</span>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/reports"
              style={navItemStyle(isActive('/reports'))}
              onMouseEnter={(e) => {
                if (!isActive('/reports')) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/reports')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <FiFileText style={{ fontSize: '1.125rem' }} />
              <span>Reports</span>
            </Link>
          </motion.div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginLeft: '1.5rem', 
            paddingLeft: '1.5rem', 
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              {user?.email}
            </span>
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                fontWeight: '500',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)';
                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)';
                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.2)';
              }}
            >
              <FiLogOut style={{ fontSize: '1.125rem' }} />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
