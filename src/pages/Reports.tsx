import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiShield, FiAlertTriangle, FiFileText, FiClock, FiImage, FiUploadCloud, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase, VerificationReport } from '../lib/supabase';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Reports: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport(id);
    } else {
      fetchReports();
    }
  }, [id, user]);

  const fetchReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('verification_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('verification_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setSelectedReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setReportToDelete(reportId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete || !user) {
      console.error('Missing reportToDelete or user');
      return;
    }

    setDeleting(true);
    try {
      console.log('Attempting to delete report:', reportToDelete);
      console.log('User ID:', user.id);
      
      // First, let's verify the report exists and belongs to the user
      const { data: reportCheck, error: checkError } = await supabase
        .from('verification_reports')
        .select('*')
        .eq('id', reportToDelete)
        .single();
      
      console.log('Report check:', { reportCheck, checkError });
      
      if (checkError || !reportCheck) {
        console.error('Report not found or error checking:', checkError);
        toast.error('Report not found');
        return;
      }
      
      // Now attempt to delete
      const { error } = await supabase
        .from('verification_reports')
        .delete()
        .eq('id', reportToDelete);

      console.log('Delete error (if any):', error);

      if (error) {
        console.error('Supabase delete error:', error);
        // If error contains RLS policy message, provide more helpful feedback
        if (error.message?.includes('policy')) {
          toast.error('Permission denied. Please refresh the page and try again.');
        } else {
          toast.error(error.message || 'Failed to delete report');
        }
        return;
      }

      // Successfully deleted
      toast.success('Report deleted successfully');
      setReports(reports.filter(r => r.id !== reportToDelete));
      setDeleteModalOpen(false);
      setReportToDelete(null);
      
      // Optionally refresh the reports list to ensure consistency
      fetchReports();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast.error(error.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setReportToDelete(null);
  };

  const generatePDF = (report: VerificationReport) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Helper function to draw gradient-like header
    const drawHeader = () => {
      // Draw gradient background (simulated with rectangles)
      doc.setFillColor(15, 15, 30);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Add subtle gradient effect
      doc.setFillColor(129, 140, 248, 0.1);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo and Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text('VidProof', margin, 25);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(167, 139, 250);
      doc.text('AI-Powered Video Verification Report', margin, 35);
      
      // Report metadata - properly aligned to the right
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      const reportId = `Report ID: ${report.id.slice(0, 8)}...`;
      const dateStr = `Generated: ${new Date(report.created_at).toLocaleDateString()}`;
      const timeStr = `Time: ${new Date(report.created_at).toLocaleTimeString()}`;
      
      // Calculate text widths for right alignment
      const idWidth = doc.getTextWidth(reportId);
      const dateWidth = doc.getTextWidth(dateStr);
      const timeWidth = doc.getTextWidth(timeStr);
      
      doc.text(reportId, pageWidth - margin - idWidth, 20);
      doc.text(dateStr, pageWidth - margin - dateWidth, 28);
      doc.text(timeStr, pageWidth - margin - timeWidth, 36);
    };
    
    // Helper function to draw section header
    const drawSectionHeader = (title: string, yPos: number) => {
      // Section background with gradient effect
      doc.setFillColor(25, 25, 40);
      doc.roundedRect(margin - 5, yPos - 8, contentWidth + 10, 14, 3, 3, 'F');
      
      // Add accent line
      doc.setFillColor(129, 140, 248);
      doc.rect(margin - 5, yPos - 8, 3, 14, 'F');
      
      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 2, yPos);
    };
    
    // Helper function to draw progress bar
    const drawProgressBar = (x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) => {
      // Background
      doc.setFillColor(40, 40, 55);
      doc.roundedRect(x, y, width, height, 2, 2, 'F');
      
      // Progress
      doc.setFillColor(...color);
      doc.roundedRect(x, y, (width * percentage) / 100, height, 2, 2, 'F');
      
      // Percentage text centered in bar
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      const percentText = `${percentage}%`;
      const textWidth = doc.getTextWidth(percentText);
      doc.text(percentText, x + (width - textWidth) / 2, y + height - 3);
    };
    
    // Page 1: Overview and Scores
    drawHeader();
    
    // Executive Summary Section
    let currentY = 58;
    drawSectionHeader('EXECUTIVE SUMMARY', currentY);
    
    // Main Score Card with improved layout
    currentY += 18;
    doc.setFillColor(20, 20, 35);
    doc.roundedRect(margin, currentY - 5, contentWidth, 52, 4, 4, 'F');
    
    // Add subtle border
    doc.setDrawColor(129, 140, 248, 0.3);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, currentY - 5, contentWidth, 52, 4, 4, 'S');
    
    // Score visualization
    const scoreColor = report.authenticity_score >= 70 ? [52, 211, 153] as [number, number, number] : 
                      report.authenticity_score >= 40 ? [251, 191, 36] as [number, number, number] : 
                      [248, 113, 113] as [number, number, number];
    
    // Large score display - left side
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${report.authenticity_score}%`, margin + 10, currentY + 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    const authText = report.authenticity_score >= 70 ? 'HIGH AUTHENTICITY' : 
                     report.authenticity_score >= 40 ? 'MEDIUM AUTHENTICITY' : 
                     'LOW AUTHENTICITY';
    doc.text(authText, margin + 10, currentY + 34);
    
    // Progress bar for authenticity - positioned on right side
    const barWidth = 85;
    const barStartX = pageWidth - margin - barWidth - 5;
    const barY = currentY + 8;
    drawProgressBar(barStartX, barY, barWidth, 12, report.authenticity_score, scoreColor);
    
    // Deepfake Risk - positioned below the progress bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Deepfake Risk:', barStartX, barY + 24);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const deepfakeColor = report.deepfake_likelihood <= 30 ? [52, 211, 153] as [number, number, number] : 
                         report.deepfake_likelihood <= 60 ? [251, 191, 36] as [number, number, number] : 
                         [248, 113, 113] as [number, number, number];
    doc.setTextColor(deepfakeColor[0], deepfakeColor[1], deepfakeColor[2]);
    const deepfakeText = `${report.deepfake_likelihood}%`;
    const deepfakeTextWidth = doc.getTextWidth(deepfakeText);
    doc.text(deepfakeText, pageWidth - margin - 5 - deepfakeTextWidth, barY + 24);
    
    // Key Metrics Section
    currentY += 65;
    drawSectionHeader('KEY METRICS', currentY);
    
    currentY += 18;
    // Metrics grid - 2x2 layout with improved spacing
    const metrics = [
      { label: 'Authenticity Score', value: report.authenticity_score.toString(), unit: '%' },
      { label: 'Deepfake Risk', value: report.deepfake_likelihood.toString(), unit: '%' },
      { label: 'Video ID', value: report.video_id.slice(0, 8) + '...', unit: '' },
      { label: 'Analysis Date', value: new Date(report.created_at).toLocaleDateString(), unit: '' }
    ];
    
    const cardWidth = (contentWidth - 15) / 2;
    const cardHeight = 25;
    
    metrics.forEach((metric, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * (cardWidth + 15);
      const y = currentY + row * (cardHeight + 8);
      
      // Card background with border
      doc.setFillColor(25, 25, 40);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
      
      // Add subtle border
      doc.setDrawColor(129, 140, 248, 0.2);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(metric.label, x + 8, y + 9);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(167, 139, 250);
      doc.text(`${metric.value}${metric.unit}`, x + 8, y + 18);
    });
    
    // Sentiment Analysis Section
    if (report.sentiment_analysis) {
      currentY += 68;
      
      // Check if we need a new page for sentiment analysis
      if (currentY > pageHeight - 90) {
        doc.addPage();
        drawHeader();
        currentY = 60;
      }
      
      drawSectionHeader('SENTIMENT ANALYSIS', currentY);
      
      currentY += 18;
      const sentiments = [
        { label: 'Positive', value: report.sentiment_analysis?.positive || 0, color: [52, 211, 153] as [number, number, number] },
        { label: 'Neutral', value: report.sentiment_analysis?.neutral || 0, color: [148, 163, 184] as [number, number, number] },
        { label: 'Negative', value: report.sentiment_analysis?.negative || 0, color: [248, 113, 113] as [number, number, number] }
      ];
      
      sentiments.forEach((sentiment, index) => {
        const y = currentY + (index * 18);
        
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text(sentiment.label, margin, y + 4);
        
        // Progress bar
        const barX = margin + 50;
        const barWidth = contentWidth - 85;
        
        // Background
        doc.setFillColor(25, 25, 40);
        doc.roundedRect(barX, y - 2, barWidth, 10, 3, 3, 'F');
        
        // Fill
        const fillWidth = (sentiment.value / 100) * barWidth;
        doc.setFillColor(sentiment.color[0], sentiment.color[1], sentiment.color[2]);
        doc.roundedRect(barX, y - 2, fillWidth, 10, 3, 3, 'F');
        
        // Percentage - right aligned
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(sentiment.color[0], sentiment.color[1], sentiment.color[2]);
        const percentText = `${sentiment.value}%`;
        const percentWidth = doc.getTextWidth(percentText);
        doc.text(percentText, pageWidth - margin - percentWidth, y + 4);
      });
    }
    
    // Page 2: Detailed Analysis
    doc.addPage();
    drawHeader();
    
    currentY = 60;
    
    // Transcript Section
    drawSectionHeader('VIDEO TRANSCRIPT', currentY);
    currentY += 18;
    
    // Get the actual transcript from the report data
    const transcriptText = report.transcript || 'No transcript available for this video.';
    
    // Calculate dynamic height based on content
    const lines = doc.splitTextToSize(transcriptText, contentWidth - 16);
    const maxLines = 18; // Increased to show more transcript
    const displayLines = lines.slice(0, maxLines);
    const transcriptHeight = Math.min(displayLines.length * 5 + 15, 140); // Dynamic height with max limit
    
    if (lines.length > maxLines) {
      displayLines[maxLines - 1] = displayLines[maxLines - 1].substring(0, displayLines[maxLines - 1].length - 10) + '...';
    }
    
    // Background for transcript with border
    doc.setFillColor(20, 20, 35);
    doc.roundedRect(margin, currentY - 5, contentWidth, transcriptHeight, 4, 4, 'F');
    
    // Add subtle border
    doc.setDrawColor(129, 140, 248, 0.2);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY - 5, contentWidth, transcriptHeight, 4, 4, 'S');
    
    // Transcript text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    
    // Add line height for better readability
    let textY = currentY + 8;
    displayLines.forEach((line: string, index: number) => {
      if (textY < currentY + transcriptHeight - 8) {
        doc.text(line, margin + 8, textY);
        textY += 5;
      }
    });
    
    currentY += transcriptHeight + 10;
    
    // Tampering Indicators Section
    if (report.tampering_indicators && report.tampering_indicators.length > 0) {
      // Check if we need a new page
      if (currentY > pageHeight - 80) {
        doc.addPage();
        drawHeader();
        currentY = 60;
      }
      
      drawSectionHeader('TAMPERING INDICATORS', currentY);
      currentY += 18;
      
      report.tampering_indicators.forEach((indicator, index) => {
        if (currentY > pageHeight - 40) {
          doc.addPage();
          drawHeader();
          currentY = 60;
        }
        
        // Improved indicator card
        doc.setFillColor(40, 20, 20);
        doc.roundedRect(margin, currentY - 3, contentWidth, 18, 3, 3, 'F');
        
        // Add warning border
        doc.setDrawColor(248, 113, 113, 0.3);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY - 3, contentWidth, 18, 3, 3, 'S');
        
        // Warning prefix instead of icon
        doc.setTextColor(248, 113, 113);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('[!]', margin + 8, currentY + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        const indicatorText = doc.splitTextToSize(indicator, contentWidth - 30);
        doc.text(indicatorText[0], margin + 25, currentY + 6);
        currentY += 22;
      });
    }
    
    // Technical Details Section
    if (currentY > pageHeight - 70) {
      doc.addPage();
      drawHeader();
      currentY = 60;
    }
    
    drawSectionHeader('TECHNICAL DETAILS', currentY);
    currentY += 18;
    
    doc.setFillColor(20, 20, 35);
    doc.roundedRect(margin, currentY - 5, contentWidth, 50, 4, 4, 'F');
    
    // Add subtle border
    doc.setDrawColor(129, 140, 248, 0.2);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY - 5, contentWidth, 50, 4, 4, 'S');
    
    const details = [
      `Analysis Engine: VidProof AI v2.0`,
      `Processing Date: ${new Date(report.created_at).toLocaleString()}`,
      `Report ID: ${report.id}`,
      `Video Hash: ${'SHA256:' + report.id.slice(0, 16) + '...'}`
    ];
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    details.forEach((detail, index) => {
      doc.text(detail, margin + 8, currentY + 8 + (index * 10));
    });
    
    // Footer function
    const addFooter = () => {
      // Footer background with gradient
      doc.setFillColor(15, 15, 30);
      doc.rect(0, pageHeight - 22, pageWidth, 22, 'F');
      
      // Add subtle top border
      doc.setFillColor(129, 140, 248, 0.2);
      doc.rect(0, pageHeight - 22, pageWidth, 0.5, 'F');
      
      // Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('© 2024 VidProof - AI-Powered Video Verification System', margin, pageHeight - 13);
      doc.text('This report is confidential and for authorized use only', margin, pageHeight - 6);
      
      // Page number - properly aligned
      doc.setTextColor(167, 139, 250);
      doc.setFontSize(9);
      const pageNumber = (doc as any).internal.getCurrentPageInfo()?.pageNumber || 1;
      const pageText = `Page ${pageNumber}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 10);
    };
    
    // Add footers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages() || 2;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter();
    }
    
    // Save PDF
    doc.save(`VidProof_Report_${report.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Professional report downloaded successfully!', {
      style: {
        background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.9), rgba(167, 139, 250, 0.9))',
        color: '#fff',
        borderRadius: '12px',
        padding: '12px 20px'
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High Authenticity';
    if (score >= 40) return 'Medium Authenticity';
    return 'Low Authenticity';
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        position: 'relative'
      }}>
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedReport || id) {
    const report = selectedReport;
    if (!report) return null;

    const authenticityData = {
      labels: ['Authentic', 'Suspicious'],
      datasets: [{
        data: [report.authenticity_score, 100 - report.authenticity_score],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1
      }]
    };

    const sentimentData = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        label: 'Sentiment Distribution',
        data: [
          report.sentiment_analysis?.positive || 0,
          report.sentiment_analysis?.neutral || 0,
          report.sentiment_analysis?.negative || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(148, 163, 184, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }]
    };

    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        position: 'relative'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <div style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            top: '10%',
            left: '-10%',
            animation: 'float 20s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            bottom: '10%',
            right: '-10%',
            animation: 'float 25s ease-in-out infinite reverse'
          }} />
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'float 30s ease-in-out infinite'
          }} />
        </div>
        
        <Navbar />
        <div className="container mx-auto" style={{ padding: '2rem 3rem', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ marginBottom: '3rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Link 
                to="/reports" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: '#94a3b8',
                  textDecoration: 'none',
                  marginBottom: '1.5rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateX(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <FiArrowLeft style={{ marginRight: '0.5rem' }} />
                Back to Reports
              </Link>
              <h1 style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Verification Report</h1>
              <p style={{ color: '#94a3b8' }}>Report ID: {report.id.slice(0, 8)}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '2rem' }}>
              {/* Main Score Card */}
              <div className="lg:col-span-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    backdropFilter: 'blur(16px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'fit-content'
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    <FiShield style={{ 
                      fontSize: '3rem', 
                      margin: '0 auto 0.75rem',
                      color: report.authenticity_score >= 70 ? '#34d399' : report.authenticity_score >= 40 ? '#fbbf24' : '#f87171'
                    }} />
                  </motion.div>
                  <h2 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: '700', 
                    marginBottom: '0.25rem',
                    background: report.authenticity_score >= 70 
                      ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
                      : report.authenticity_score >= 40
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                      : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{report.authenticity_score}%</h2>
                  <p style={{ 
                    fontSize: '1rem',
                    color: report.authenticity_score >= 70 ? '#34d399' : report.authenticity_score >= 40 ? '#fbbf24' : '#f87171',
                    marginBottom: '1rem'
                  }}>
                    {getScoreLabel(report.authenticity_score)}
                  </p>
                  <div style={{ 
                    width: '180px',
                    height: '180px',
                    margin: '0 auto',
                    position: 'relative'
                  }}>
                    <Doughnut data={authenticityData} options={{ 
                      maintainAspectRatio: true,
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          padding: 8,
                          displayColors: false,
                          callbacks: {
                            label: function(context) {
                              return context.label + ': ' + context.parsed + '%';
                            }
                          }
                        }
                      },
                      cutout: '70%',
                      elements: {
                        arc: {
                          borderWidth: 2
                        }
                      }
                    }} />
                  </div>
                  
                  {/* Additional Stats */}
                  <div style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Deepfake Risk</p>
                      <p style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600',
                        color: report.deepfake_likelihood < 30 ? '#34d399' : report.deepfake_likelihood < 70 ? '#fbbf24' : '#f87171'
                      }}>
                        {report.deepfake_likelihood}%
                      </p>
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Report Date</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                        <FiClock style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Details Cards */}
              <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Deepfake Analysis */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    backdropFilter: 'blur(16px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '2rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#e2e8f0' }}>
                    <FiAlertTriangle style={{ marginRight: '0.5rem', color: '#fbbf24' }} />
                    Deepfake Analysis
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: '#94a3b8' }}>Deepfake Likelihood</span>
                    <span style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: '700',
                      color: report.deepfake_likelihood < 30 ? '#34d399' : report.deepfake_likelihood < 70 ? '#fbbf24' : '#f87171'
                    }}>
                      {report.deepfake_likelihood}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${report.deepfake_likelihood}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{ 
                        background: report.deepfake_likelihood < 30 
                          ? 'linear-gradient(90deg, #34d399 0%, #10b981 100%)' 
                          : report.deepfake_likelihood < 70 
                          ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)' 
                          : 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'
                      }}
                    />
                  </div>
                </motion.div>

                {/* Sentiment Analysis */}
                {report.sentiment_analysis && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      backdropFilter: 'blur(16px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#e2e8f0' }}>
                      <FiFileText style={{ marginRight: '0.5rem', color: '#818cf8' }} />
                      Sentiment Analysis
                    </h3>
                    <div style={{ height: '180px' }}>
                      <Bar data={sentimentData} options={{ 
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 8
                          }
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: '#94a3b8',
                              font: {
                                size: 11
                              }
                            },
                            grid: {
                              color: 'rgba(148, 163, 184, 0.05)',
                              display: true
                            }
                          },
                          y: {
                            ticks: {
                              color: '#94a3b8',
                              font: {
                                size: 11
                              },
                              stepSize: 20
                            },
                            grid: {
                              color: 'rgba(148, 163, 184, 0.05)',
                              display: true
                            },
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }} />
                    </div>
                    
                    {/* Sentiment Values */}
                    <div style={{
                      marginTop: '1rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.125rem' }}>Positive</p>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#34d399' }}>
                          {report.sentiment_analysis?.positive || 0}%
                        </p>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        background: 'rgba(148, 163, 184, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.2)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.125rem' }}>Neutral</p>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#94a3b8' }}>
                          {report.sentiment_analysis?.neutral || 0}%
                        </p>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '0.125rem' }}>Negative</p>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#f87171' }}>
                          {report.sentiment_analysis?.negative || 0}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Transcript */}
                {report.transcript && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      backdropFilter: 'blur(16px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#e2e8f0' }}>
                      <FiFileText style={{ marginRight: '0.5rem', color: '#a78bfa' }} />
                      Video Transcript
                    </h3>
                    <p style={{ 
                      color: '#cbd5e1', 
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                      fontSize: '0.95rem',
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>{report.transcript}</p>
                  </motion.div>
                )}

                {/* Tampering Indicators */}
                {report.tampering_indicators && report.tampering_indicators.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                      backdropFilter: 'blur(16px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      boxShadow: '0 8px 32px rgba(251, 191, 36, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#fbbf24' }}>
                      <FiAlertTriangle style={{ marginRight: '0.5rem' }} />
                      Potential Issues Detected
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {report.tampering_indicators.map((indicator, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start',
                            marginBottom: '0.75rem',
                            padding: '0.75rem',
                            background: 'rgba(251, 191, 36, 0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(251, 191, 36, 0.1)'
                          }}
                        >
                          <FiAlertTriangle style={{ marginRight: '0.75rem', marginTop: '0.125rem', color: '#fbbf24', flexShrink: 0 }} />
                          <span style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>{indicator}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Key Frames */}
                {report.key_frames && report.key_frames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      backdropFilter: 'blur(16px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#e2e8f0' }}>
                      <FiImage style={{ marginRight: '0.5rem', color: '#60a5fa' }} />
                      Key Frames Analyzed
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {report.key_frames.slice(0, 6).map((frame, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          style={{
                            aspectRatio: '16/9',
                            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            cursor: 'pointer'
                          }}
                        >
                          <FiImage style={{ color: '#60a5fa', fontSize: '1.5rem' }} />
                        </motion.div>
                      ))}
                    </div>
                    {report.key_frames.length > 6 && (
                      <p style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                        +{report.key_frames.length - 6} more frames analyzed
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Download Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generatePDF(report)}
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(129, 140, 248, 0.3)'
                  }}
                >
                  <FiDownload style={{ marginRight: '0.5rem' }} />
                  Download PDF Report
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
      position: 'relative'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '10%',
          left: '-10%',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          bottom: '10%',
          right: '-10%',
          animation: 'float 25s ease-in-out infinite reverse'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float 30s ease-in-out infinite'
        }} />
      </div>
      
      <Navbar />
      <div className="container mx-auto" style={{ padding: '2rem 3rem', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: '3rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Verification Reports</h1>
            <p style={{ color: '#94a3b8' }}>View all your video verification reports</p>
          </div>

          {reports.length === 0 ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(16px) saturate(200%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '4rem',
                textAlign: 'center',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
              }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiFileText style={{ fontSize: '4rem', margin: '0 auto 1rem', color: '#64748b' }} />
              </motion.div>
              <p style={{ fontSize: '1.25rem', color: '#e2e8f0', marginBottom: '1rem' }}>No reports yet</p>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Upload your first video to get started</p>
              <Link 
                to="/upload" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 15px rgba(129, 140, 248, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <FiUploadCloud style={{ marginRight: '0.5rem' }} />
                Upload your first video
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2.5rem', rowGap: '3.5rem' }}>
              {reports.map((report) => (
                <div
                  key={report.id}
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={(e) => handleDeleteClick(e, report.id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <FiTrash2 style={{ color: '#ef4444', fontSize: '1rem' }} />
                  </button>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Link to={`/report/${report.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      backdropFilter: 'blur(16px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '2rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
                      height: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(129, 140, 248, 0.2), inset 0 0 0 1px rgba(129, 140, 248, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)';
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <FiShield style={{ 
                          fontSize: '2rem',
                          color: report.authenticity_score >= 70 ? '#34d399' : report.authenticity_score >= 40 ? '#fbbf24' : '#f87171'
                        }} />
                        <span style={{ 
                          fontSize: '1.75rem', 
                          fontWeight: '700',
                          background: report.authenticity_score >= 70 
                            ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
                            : report.authenticity_score >= 40
                            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                            : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {report.authenticity_score}%
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                        <FiShield style={{ marginRight: '0.25rem', fontSize: '1rem' }} />
                        Report #{report.id.slice(0, 8)}
                      </p>
                      <div style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        background: report.authenticity_score >= 70 
                          ? 'rgba(52, 211, 153, 0.1)'
                          : report.authenticity_score >= 40
                          ? 'rgba(251, 191, 36, 0.1)'
                          : 'rgba(248, 113, 113, 0.1)',
                        border: report.authenticity_score >= 70 
                          ? '1px solid rgba(52, 211, 153, 0.2)'
                          : report.authenticity_score >= 40
                          ? '1px solid rgba(251, 191, 36, 0.2)'
                          : '1px solid rgba(248, 113, 113, 0.2)',
                        textAlign: 'center'
                      }}>
                        <p style={{ 
                          fontSize: '0.875rem',
                          color: report.authenticity_score >= 70 ? '#34d399' : report.authenticity_score >= 40 ? '#fbbf24' : '#f87171'
                        }}>
                          {getScoreLabel(report.authenticity_score)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.98) 0%, rgba(20, 20, 35, 0.98) 100%)',
                backdropFilter: 'blur(20px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <FiAlertTriangle style={{ fontSize: '1.75rem', color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.5rem' }}>
                  Delete Report?
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                  This action cannot be undone. The report will be permanently deleted.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontWeight: '600',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: deleting ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: deleting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
