import jsPDF from 'jspdf';
import { Registration } from '../types';
import { format } from 'date-fns';

interface PDFData {
  user: {
    name: string;
    email: string;
    department: string;
    year: number;
    rollNumber: string;
  };
  registrations: Registration[];
  stats: {
    totalParticipations: number;
    approved: number;
    pending: number;
    rejected: number;
    successRate: number;
  };
}

export const generateParticipationReport = async (data: PDFData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header with JoinUP branding
  doc.setFillColor(59, 130, 246); // Blue color
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('JoinUP', margin, 25);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Participation Report', margin, 35);
  
  doc.setTextColor(0, 0, 0);
  yPosition = 60;

  // User Information Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Participant Information', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.user.name}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Email: ${data.user.email}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Department: ${data.user.department}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Year: ${data.user.year}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Roll Number: ${data.user.rollNumber}`, margin, yPosition);
  yPosition += 15;

  // Summary Statistics
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Participations: ${data.stats.totalParticipations}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Approved: ${data.stats.approved}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Pending: ${data.stats.pending}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Rejected: ${data.stats.rejected}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Success Rate: ${data.stats.successRate}%`, margin, yPosition);
  yPosition += 15;

  // Participation History Table
  checkPageBreak(20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Participation History', margin, yPosition);
  yPosition += 10;

  if (data.registrations.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('No participation history available.', margin, yPosition);
  } else {
    // Table Header
    checkPageBreak(15);
    doc.setFillColor(243, 244, 246); // Light gray
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Competition', margin + 2, yPosition + 2);
    doc.text('Status', margin + 80, yPosition + 2);
    doc.text('Date', margin + 120, yPosition + 2);
    doc.text('Team', margin + 160, yPosition + 2);
    yPosition += 12;

    // Table Rows
    data.registrations.forEach((registration, index) => {
      checkPageBreak(12);
      
      if (index > 0 && index % 2 === 0) {
        doc.setFillColor(249, 250, 251); // Very light gray for alternating rows
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Competition ID (truncated if too long)
      const competitionId = registration.hackathonId.length > 25 
        ? registration.hackathonId.substring(0, 22) + '...'
        : registration.hackathonId;
      doc.text(competitionId, margin + 2, yPosition + 2);
      
      // Status with color
      const statusColors: Record<string, [number, number, number]> = {
        'approved': [34, 197, 94], // Green
        'pending': [234, 179, 8],  // Yellow
        'rejected': [239, 68, 68], // Red
        'waitlisted': [59, 130, 246] // Blue
      };
      const statusColor = statusColors[registration.status] || [0, 0, 0];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(registration.status.charAt(0).toUpperCase() + registration.status.slice(1), margin + 80, yPosition + 2);
      doc.setTextColor(0, 0, 0);
      
      // Date
      const dateStr = format(new Date(registration.submittedAt), 'MMM dd, yyyy');
      doc.text(dateStr, margin + 120, yPosition + 2);
      
      // Team name or Individual
      const teamInfo = registration.teamName || 'Individual';
      doc.text(teamInfo.length > 15 ? teamInfo.substring(0, 12) + '...' : teamInfo, margin + 160, yPosition + 2);
      
      yPosition += 10;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${format(new Date(), 'MMMM dd, yyyy')} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'JoinUP - Student Competition Platform',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Generate filename
  const filename = `JoinUP_Participation_Report_${data.user.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};
