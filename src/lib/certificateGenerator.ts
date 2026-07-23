import jsPDF from 'jspdf';
import { Film, Filmmaker } from '../types';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getContentId(film: Film): string {
  if (film.contentId) return film.contentId;
  const hash = hashCode(film.id || film.title).toString(36).toUpperCase().padStart(5, '0');
  const year = film.releaseYear || 2026;
  return `TPF-CID-${year}-${hash.slice(0, 5)}`;
}

export function getThumbnailContentId(film: Film): string {
  if (film.thumbnailContentId) return film.thumbnailContentId;
  const hash = hashCode((film.id || film.title) + '-thumb').toString(36).toUpperCase().padStart(5, '0');
  const year = film.releaseYear || 2026;
  return `TPF-THM-${year}-${hash.slice(0, 5)}`;
}

export function getCertificateNo(film: Film): string {
  const hash = hashCode((film.id || film.title) + '-cert').toString(10).padStart(6, '0').slice(0, 6);
  return `TPF-CERT-${film.releaseYear || 2026}-${hash}`;
}

export function generateScreeningCertificatePDF(film: Film, filmmaker?: Filmmaker): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const contentId = getContentId(film);
  const thumbId = getThumbnailContentId(film);
  const certNo = getCertificateNo(film);
  const directorName = filmmaker?.name || film.director || 'Licensed Filmmaker';
  const country = filmmaker?.country || 'India';
  const upiId = filmmaker?.upiId || film.upiId || 'Direct GPay Peer-to-Peer';
  const issueDate = film.createdAt 
    ? new Date(film.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Page Dimensions: A4 Landscape is 297mm x 210mm
  const pageWidth = 297;
  const pageHeight = 210;

  // Background Fill (Deep Luxury Dark Charcoal)
  doc.setFillColor(14, 14, 18);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Decorative Gold Double Frame
  doc.setDrawColor(217, 119, 6); // Amber Gold
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(245, 158, 11); // Lighter Gold
  doc.setLineWidth(0.5);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // Corner Accent Brackets
  const drawCorner = (x: number, y: number, xMult: number, yMult: number) => {
    doc.setLineWidth(1.2);
    doc.setDrawColor(245, 158, 11);
    doc.line(x, y, x + 12 * xMult, y);
    doc.line(x, y, x, y + 12 * yMult);
  };
  drawCorner(14, 14, 1, 1);
  drawCorner(pageWidth - 14, 14, -1, 1);
  drawCorner(14, pageHeight - 14, 1, -1);
  drawCorner(pageWidth - 14, pageHeight - 14, -1, -1);

  // Header Banner - TPF CINEMAS
  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TPF CINEMAS', pageWidth / 2, 28, { align: 'center' });

  doc.setTextColor(180, 180, 195);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INDIE FILM OTT & DIGITAL STREAMING VAULT', pageWidth / 2, 34, { align: 'center' });

  // Certificate Main Title
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.line(60, 38, pageWidth - 60, 38);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTENT STREAMING RIGHTS & CONSENT CERTIFICATE', pageWidth / 2, 46, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(`CERTIFICATE REF: ${certNo}`, pageWidth / 2, 52, { align: 'center' });

  // Main Container Box for Details
  doc.setFillColor(22, 22, 28);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.roundedRect(20, 58, pageWidth - 40, 82, 3, 3, 'FD');

  // Left Column - Content Assets & Identifiers
  let startY = 66;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('1. CONTENT ASSET IDENTIFICATION', 28, startY);

  startY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 200, 210);
  doc.text('Title of Content:', 28, startY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(film.title, 65, startY);

  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Unique Content ID:', 28, startY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(contentId, 65, startY);

  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Thumbnail Asset ID:', 28, startY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(thumbId, 65, startY);

  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Format & Duration:', 28, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`${film.type.toUpperCase()} • ${film.duration || 'Feature'}`, 65, startY);

  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Genre Classification:', 28, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(Array.isArray(film.genre) ? film.genre.join(', ') : film.genre, 65, startY);

  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Release Year & Gear:', 28, startY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`${film.releaseYear} • ${film.cameraUsed || 'Digital Cinema'}`, 65, startY);

  // Right Column - Filmmaker & License Details
  let rightY = 66;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('2. LICENSOR & CREATOR DETAILS', 155, rightY);

  rightY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Director / Creator:', 155, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(directorName, 195, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Country of Origin:', 155, rightY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(country, 195, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('GPay Monetization ID:', 155, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(upiId, 195, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Hosting Approval Date:', 155, rightY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(issueDate, 195, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('Grant Status:', 155, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('APPROVED & ACTIVATED', 195, rightY);

  // Legal Consent Grant Clause Box
  const clauseY = 145;
  doc.setFillColor(18, 18, 24);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.2);
  doc.roundedRect(20, clauseY, pageWidth - 40, 26, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('GRANT OF DIGITAL SCREENING RIGHTS & CONSENT TERMS:', 25, clauseY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 195);
  const clauseText = 
    `By virtue of this certificate, the Licensor/Filmmaker explicitly grants TPF Cinemas non-exclusive digital screening, streaming, and display rights for the specified content asset (${contentId}) and associated artwork (${thumbId}). The filmmaker retains 100% intellectual property rights, copyright ownership, and master film rights. TPF Cinemas is authorized to host, process high-bitrate streaming playback, and route 100% direct crowd sponsorship (via GPay UPI) directly to the creator without platform deductions.`;
  
  const splitClause = doc.splitTextToSize(clauseText, pageWidth - 50);
  doc.text(splitClause, 25, clauseY + 10);

  // Footer Signatures & Official Seal
  const footerY = 177;

  // Gold Seal / Stamp Circle
  doc.setFillColor(245, 158, 11);
  doc.circle(45, footerY + 8, 11, 'F');
  doc.setFillColor(14, 14, 18);
  doc.circle(45, footerY + 8, 9.5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('TPF CINEMAS', 45, footerY + 6, { align: 'center' });
  doc.text('VERIFIED', 45, footerY + 9, { align: 'center' });
  doc.text('OFFICIAL', 45, footerY + 12, { align: 'center' });

  // Verification text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL TPF CINEMAS ARCHIVE SEAL', 62, footerY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 170);
  doc.text('Digitally validated on the TPF Cinemas Firestore Ledger.', 62, footerY + 10);

  // Authorized Signatory (Right)
  doc.setDrawColor(245, 158, 11);
  doc.line(pageWidth - 85, footerY + 10, pageWidth - 25, footerY + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Authorized Content Curation Board', pageWidth - 55, footerY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 170);
  doc.text('TPF Cinemas Content Rights & Licensing Division', pageWidth - 55, footerY + 18, { align: 'center' });

  // Save the PDF
  const cleanTitle = film.title.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`TPF_Screening_Rights_Certificate_${cleanTitle}.pdf`);
}
