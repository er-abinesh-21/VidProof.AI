import jsPDF from 'jspdf';
import { VerificationReport } from './firebase';
import { VERDICT_LABEL, VERDICT_SUMMARY, formatDateTime, frameVerdict, verdictFor, Verdict } from './verdict';

type RGB = [number, number, number];

// Same palette as the app, tuned for paper
const INK: RGB = [24, 35, 58];
const INK_2: RGB = [70, 82, 107];
const INK_3: RGB = [111, 123, 146];
const RULE: RGB = [214, 221, 230];
const TABLE: RGB = [238, 242, 246];
const VERDICT_RGB: Record<Verdict, RGB> = {
  authentic: [14, 124, 102],
  review: [168, 106, 12],
  flagged: [200, 50, 63]
};

const MARGIN = 18;

export const downloadReportPdf = (report: VerificationReport) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = pageWidth - MARGIN * 2;
  const verdict = verdictFor(report.authenticity_score);
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 22) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const heading = (text: string) => {
    ensureSpace(16);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(text, MARGIN, y);
    y += 2.5;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + width, y);
    y += 6;
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text('VidProof', MARGIN, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK_3);
  doc.text('Video verification report', MARGIN, y + 9);
  const generated = `Generated ${formatDateTime(new Date().toISOString())}`;
  doc.text(generated, pageWidth - MARGIN - doc.getTextWidth(generated), y + 4);
  y += 20;

  // Verdict
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...VERDICT_RGB[verdict]);
  doc.text(VERDICT_LABEL[verdict], MARGIN, y);
  const score = `${report.authenticity_score}/100`;
  doc.setFontSize(20);
  doc.text(score, pageWidth - MARGIN - doc.getTextWidth(score), y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK_2);
  doc.text(doc.splitTextToSize(VERDICT_SUMMARY[verdict], width), MARGIN, y);
  y += 10;

  if (report.metadata?.demo_data) {
    doc.setFillColor(247, 234, 210);
    doc.roundedRect(MARGIN, y - 4, width, 9, 1.5, 1.5, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...VERDICT_RGB.review);
    doc.text('Demo data: the AI models could not run, so these values are placeholders, not a real analysis.', MARGIN + 3, y + 1.5);
    y += 12;
  }

  // Details
  heading('Details');
  const details: [string, string][] = [
    ['File', report.filename || 'Not recorded'],
    ['Analysed', formatDateTime(report.created_at)],
    ['Report ID', report.id],
    ['Video SHA-256', report.metadata?.video_sha256 || 'Not available'],
    ['Kept until', report.expires_at ? formatDateTime(report.expires_at.toDate().toISOString()) : 'Not set'],
    ['Models', (report.metadata?.models_used || []).join(', ') || 'Not recorded']
  ];
  doc.setFontSize(9.5);
  details.forEach(([label, value]) => {
    const lines = doc.splitTextToSize(value, width - 38);
    ensureSpace(lines.length * 4.5 + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK_3);
    doc.text(label, MARGIN, y);
    doc.setFont(label === 'Video SHA-256' ? 'courier' : 'helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(lines, MARGIN + 38, y);
    y += lines.length * 4.5 + 1.5;
  });

  // Frames
  const frames = report.key_frames || [];
  if (frames.length > 0) {
    heading('Sampled frames');
    const gap = 3;
    const frameWidth = (width - gap * (frames.length - 1)) / frames.length;
    const frameHeight = frameWidth * (9 / 16);
    ensureSpace(frameHeight + 10);
    frames.forEach((frame, i) => {
      const x = MARGIN + i * (frameWidth + gap);
      try {
        doc.addImage(frame, 'JPEG', x, y, frameWidth, frameHeight);
      } catch {
        doc.setFillColor(...TABLE);
        doc.rect(x, y, frameWidth, frameHeight, 'F');
      }
      const frameScore = report.frame_scores?.[i];
      if (typeof frameScore === 'number') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...VERDICT_RGB[frameVerdict(frameScore)]);
        doc.text(`${frameScore}% deepfake`, x, y + frameHeight + 4.5);
      }
    });
    y += frameHeight + 10;
  }

  // Signals
  heading('Signals');
  const bar = (label: string, value: number, color: RGB) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK_2);
    doc.text(label, MARGIN, y);
    const valueText = `${value}%`;
    doc.setTextColor(...INK);
    doc.text(valueText, MARGIN + width - doc.getTextWidth(valueText), y);
    doc.setFillColor(...TABLE);
    doc.rect(MARGIN + 48, y - 2.6, width - 64, 2.8, 'F');
    doc.setFillColor(...color);
    doc.rect(MARGIN + 48, y - 2.6, ((width - 64) * value) / 100, 2.8, 'F');
    y += 7;
  };
  bar('Deepfake likelihood', report.deepfake_likelihood, VERDICT_RGB[frameVerdict(report.deepfake_likelihood)]);
  if (report.sentiment_analysis) {
    bar('Positive speech', report.sentiment_analysis.positive, VERDICT_RGB.authentic);
    bar('Negative speech', report.sentiment_analysis.negative, VERDICT_RGB.flagged);
  }

  if (report.tampering_indicators?.length) {
    y += 2;
    report.tampering_indicators.forEach((indicator) => {
      const lines = doc.splitTextToSize(indicator, width - 6);
      ensureSpace(lines.length * 4.5 + 2);
      doc.setFillColor(...VERDICT_RGB.flagged);
      doc.circle(MARGIN + 1.2, y - 1.2, 0.9, 'F');
      doc.setTextColor(...INK);
      doc.text(lines, MARGIN + 5, y);
      y += lines.length * 4.5 + 1.5;
    });
  }

  // Transcript
  heading('Transcript');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const transcript = report.transcript || 'No speech was transcribed for this video.';
  doc.splitTextToSize(transcript, width).forEach((line: string) => {
    ensureSpace(5);
    doc.text(line, MARGIN, y);
    y += 5;
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.line(MARGIN, pageHeight - 14, pageWidth - MARGIN, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...INK_3);
    doc.text('Automated screening by VidProof. Treat as an indicator, not forensic proof.', MARGIN, pageHeight - 9);
    const pageText = `${i} of ${pages}`;
    doc.text(pageText, pageWidth - MARGIN - doc.getTextWidth(pageText), pageHeight - 9);
  }

  doc.save(`VidProof-report-${report.id.slice(0, 8)}.pdf`);
};
