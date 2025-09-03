import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheck, FiShield } from 'react-icons/fi';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }


    setLoading(true);
    try {
      await signUp(email, password);
      toast.success('Account created successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0e6ff 0%, #e6d4ff 25%, #d4b3ff 50%, #c299ff 75%, #b380ff 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative shapes */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
        filter: 'blur(40px)',
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(147, 51, 234, 0.05))',
        filter: 'blur(60px)',
        animation: 'float 25s ease-in-out infinite reverse'
      }} />

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '1000px',
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(147, 51, 234, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)'
          }}
        >
          {/* Left side - Image */}
          <div style={{
            flex: '0 0 40%',
            background: 'linear-gradient(135deg, #9333ea 0%, #c084fc 50%, #e879f9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.1
            }} />
            
            <div style={{
              textAlign: 'center',
              color: 'white',
              padding: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 2rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M12 5L19 8.5V12C19 15.5 17.5 18.5 15 20.5L12 21.5L9 20.5C6.5 18.5 5 15.5 5 12V8.5L12 5Z" fill="#9333ea"/>
                  <path d="M10 12L11.5 13.5L14.5 10.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                Join VidProof.AI
              </h2>
              <p style={{
                fontSize: '1.125rem',
                opacity: 0.95,
                lineHeight: 1.6
              }}>
                Start verifying video authenticity
              </p>
              <p style={{
                fontSize: '0.95rem',
                opacity: 0.85,
                marginTop: '0.5rem'
              }}>
                with AI-powered technology
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div style={{
            flex: '1',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxHeight: '100vh',
            overflowY: 'auto'
          }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '0.5rem'
              }}>
                Create Account
              </h1>
              <p style={{
                color: '#6b7280',
                fontSize: '0.95rem',
                marginBottom: '1.5rem'
              }}>
                Get started with your free account
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#1a1a1a'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#9333ea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <FiUser style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      fontSize: '1.125rem'
                    }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#1a1a1a'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#9333ea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <FiMail style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      fontSize: '1.125rem'
                    }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 3rem 0.75rem 2.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#1a1a1a'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#9333ea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <FiLock style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      fontSize: '1.125rem'
                    }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.875rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password requirements */}
                  {password && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.25rem'
                    }}>
                      {passwordRequirements.map((req, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          color: req.met ? '#10b981' : '#9ca3af'
                        }}>
                          <FiCheck style={{ fontSize: '0.875rem' }} />
                          <span>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 3rem 0.75rem 2.75rem',
                        border: `1px solid ${confirmPassword && password !== confirmPassword ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#1a1a1a'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#ef4444' : '#9333ea';
                        e.target.style.boxShadow = `0 0 0 3px ${confirmPassword && password !== confirmPassword ? 'rgba(239, 68, 68, 0.1)' : 'rgba(147, 51, 234, 0.1)'}`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#ef4444' : '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <FiLock style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: confirmPassword && password !== confirmPassword ? '#ef4444' : '#9ca3af',
                      fontSize: '1.125rem'
                    }} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.875rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#ef4444'
                    }}>
                      Passwords do not match
                    </p>
                  )}
                </div>


                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: loading ? '#d1d5db' : 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </motion.button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '1.25rem 0',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Or Continue With</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast('Google signup coming soon!', { icon: '🚀' })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#9333ea';
                      e.currentTarget.style.background = '#faf5ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <FaGoogle style={{ color: '#ea4335' }} />
                    <span style={{ color: '#374151', fontWeight: '500' }}>Google</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast('Facebook signup coming soon!', { icon: '🚀' })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#9333ea';
                      e.currentTarget.style.background = '#faf5ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <FaFacebook style={{ color: '#1877f2' }} />
                    <span style={{ color: '#374151', fontWeight: '500' }}>Facebook</span>
                  </motion.button>
                </div>

                <p style={{
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: '#9333ea',
                      textDecoration: 'none',
                      fontWeight: '600',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#7c3aed'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9333ea'}
                  >
                    Log in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Register;
