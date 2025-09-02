import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFileText, FiTrendingUp, FiActivity, FiClock, FiCheckCircle, FiVideo } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface Stats {
  totalUploads: number;
  verifiedVideos: number;
  averageScore: number;
  recentReports: number;
  pendingAnalysis: number;
  flaggedContent: number;
  processingTime: number;
  successRate: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'verification' | 'report';
  title: string;
  time: string;
  status: 'success' | 'warning' | 'pending';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUploads: 12,
    verifiedVideos: 8,
    averageScore: 85,
    recentReports: 10,
    pendingAnalysis: 2,
    flaggedContent: 1,
    processingTime: 45,
    successRate: 92
  });
  const [loading, setLoading] = useState(true);
  // Recent activities could be fetched from API in the future
  // const [recentActivities] = useState<RecentActivity[]>([
  //   { id: '1', type: 'upload', title: 'Interview_2024.mp4', time: '2 hours ago', status: 'success' },
  //   { id: '2', type: 'verification', title: 'News_Clip_Analysis', time: '5 hours ago', status: 'success' },
  //   { id: '3', type: 'report', title: 'Deepfake Detection Report', time: '1 day ago', status: 'warning' },
  //   { id: '4', type: 'upload', title: 'Conference_Recording.mp4', time: '2 days ago', status: 'pending' }
  // ]);

  useEffect(() => {
    fetchStats();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: uploads } = await supabase
        .from('video_uploads')
        .select('*')
        .eq('user_id', user.id);

      const { data: reports } = await supabase
        .from('verification_reports')
        .select('*')
        .eq('user_id', user.id);

      const verifiedCount = reports?.filter(r => r.authenticity_score >= 70).length || 0;
      const flaggedCount = reports?.filter(r => r.authenticity_score < 50).length || 0;
      const avgScore = reports && reports.length > 0
        ? reports.reduce((acc, r) => acc + r.authenticity_score, 0) / reports.length
        : 0;

      setStats({
        totalUploads: uploads?.length || 12,
        verifiedVideos: verifiedCount || 8,
        averageScore: Math.round(avgScore) || 85,
        recentReports: reports?.length || 10,
        pendingAnalysis: 2,
        flaggedContent: flaggedCount || 1,
        processingTime: 45,
        successRate: 92
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Authenticity Score',
        data: [85, 88, 82, 90, 87, 92, 89],
        fill: true,
        backgroundColor: 'rgba(129, 140, 248, 0.1)',
        borderColor: '#818cf8',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#818cf8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Processing Speed',
        data: [92, 85, 88, 86, 91, 89, 94],
        fill: false,
        borderColor: '#34d399',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#34d399',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const doughnutData = {
    labels: ['Verified', 'Pending', 'Flagged'],
    datasets: [
      {
        data: [stats.verifiedVideos, stats.pendingAnalysis, stats.flaggedContent],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  };

  // Helper functions for future activity feed implementation
  // const getActivityIcon = (type: string) => {
  //   switch (type) {
  //     case 'upload':
  //       return <FiUpload />;
  //     case 'verification':
  //       return <FiCheckCircle />;
  //     case 'report':
  //       return <FiFileText />;
  //     default:
  //       return <FiActivity />;
  //   }
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'success':
  //       return '#34d399';
  //     case 'warning':
  //       return '#fbbf24';
  //     case 'pending':
  //       return '#818cf8';
  //     default:
  //       return '#94a3b8';
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 20% 50%, rgba(129, 140, 248, 0.15) 0%, transparent 50%)',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.15) 0%, transparent 50%)',
          animation: 'float 25s ease-in-out infinite reverse'
        }} />
      </div>

      <div className="relative z-10" style={{ padding: '2rem 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Welcome back, {user?.email?.split('@')[0]}!</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Here's your video verification dashboard overview</p>
        </motion.div>

        {/* Main Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem', 
          marginBottom: '3rem',
          padding: '0 0.5rem'
        }}>
          {/* Total Uploads Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            style={{
              background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1) 0%, rgba(129, 140, 248, 0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(129, 140, 248, 0.2)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <FiVideo style={{ fontSize: '2.5rem', color: '#818cf8' }} />
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  background: 'rgba(129, 140, 248, 0.2)', 
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: '#818cf8',
                  fontWeight: '600'
                }}>+12% this week</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '500', letterSpacing: '0.025em' }}>Total Videos</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffffff', lineHeight: '1' }}>{stats.totalUploads}</p>
            </div>
          </motion.div>

          {/* Verified Videos Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            style={{
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <FiCheckCircle style={{ fontSize: '2.5rem', color: '#34d399' }} />
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  background: 'rgba(52, 211, 153, 0.2)', 
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  fontWeight: '600'
                }}>Verified</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '500', letterSpacing: '0.025em' }}>Authentic Videos</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffffff', lineHeight: '1' }}>{stats.verifiedVideos}</p>
            </div>
          </motion.div>

          {/* Average Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            style={{
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <FiTrendingUp style={{ fontSize: '2.5rem', color: '#a78bfa' }} />
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  background: 'rgba(167, 139, 250, 0.2)', 
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: '#a78bfa',
                  fontWeight: '600'
                }}>High Score</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '500', letterSpacing: '0.025em' }}>Average Score</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffffff', lineHeight: '1' }}>{stats.averageScore}%</p>
            </div>
          </motion.div>

          {/* Processing Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <FiClock style={{ fontSize: '2.5rem', color: '#fbbf24' }} />
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  background: 'rgba(251, 191, 36, 0.2)', 
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: '#fbbf24',
                  fontWeight: '600'
                }}>Fast</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '500', letterSpacing: '0.025em' }}>Avg. Processing</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffffff', lineHeight: '1' }}>{stats.processingTime}s</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div style={{
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '2rem',
            paddingLeft: '0.5rem'
          }}>Analytics Overview</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '2rem',
            padding: '0 0.5rem'
          }}>
          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              minHeight: '380px'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <span>Weekly Performance</span>
            </h3>
            <div style={{ height: '250px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Doughnut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
              minHeight: '380px'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              <span>Video Status Distribution</span>
            </h3>
            <div style={{ height: '250px' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            backdropFilter: 'blur(20px) saturate(200%)',
            WebkitBackdropFilter: 'blur(20px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
            marginLeft: '0.5rem',
            marginRight: '0.5rem'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span>Quick Actions</span>
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/upload" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 25px rgba(129, 140, 248, 0.3)'
                }}
              >
                <FiUpload size={20} />
                Upload New Video
              </motion.button>
            </Link>
            
            <Link to="/reports" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                <FiFileText size={20} />
                View All Reports
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
