import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import ForgotPassword from './pages/ForgotPassword';
import './styles/globals.css';

const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

// Toasts sit below the app's top bar, or at the top on the sign-in pages that have none
const AppToaster: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <Toaster
      position="top-center"
      containerStyle={{ top: AUTH_PATHS.includes(pathname) ? 20 : 76 }}
      toastOptions={{
        className: 'vp-toast',
        duration: 4000,
        success: { iconTheme: { primary: '#8fc28a', secondary: '#1a120e' } },
        error: { iconTheme: { primary: '#e5675c', secondary: '#1a120e' } }
      }}
    />
  );
};

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Router>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              element={
                <PrivateRoute>
                  <Navbar />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report/:id" element={<ReportDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
