
import { jsPDF } from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';

/**
 * Create a new jsPDF A4 instance.
 */
export function createDocument(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  return new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });
}

/**
 * Add clinic header to the PDF document.
 * Returns the new Y position after the header.
 */
export function addClinicHeader(doc: jsPDF, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Clinic name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(CLINIC_INFO.name, pageWidth / 2, y, { align: 'center' });
  y += 7;

  // Address
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(CLINIC_INFO.address, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Contact info
  doc.text(`Phone: ${CLINIC_INFO.phone} | Email: ${CLINIC_INFO.email}`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 5;

  // GST Number
  if (CLINIC_INFO.gstNumber) {
    doc.text(`GSTIN: ${CLINIC_INFO.gstNumber}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(10, y, pageWidth - 10, y);
  y += 5;

  return y;
}

/**
 * Add page footer with page number and "Computer Generated" text.
 */
export function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);

    doc.text('Computer Generated Invoice', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  // Reset text color
  doc.setTextColor(0, 0, 0);
}

interface TableOptions {
  headerBg?: [number, number, number];
  fontSize?: number;
  cellPadding?: number;
  columnWidths?: number[];
}

/**
 * Generic table renderer with auto column widths.
 * Returns the new Y position after the table.
 */
export function addTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  options?: TableOptions
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const tableWidth = pageWidth - margin * 2;
  const fontSize = options?.fontSize ?? 8;
  const cellPadding = options?.cellPadding ?? 3;
  const headerBg = options?.headerBg ?? [240, 240, 240];

  // Calculate column widths
  const columnWidths =
    options?.columnWidths ?? headers.map(() => tableWidth / headers.length);

  let y = startY;
  const rowHeight = fontSize + cellPadding * 2;

  // Draw header
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(margin, y, tableWidth, rowHeight, 'F');
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');

  let x = margin;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + cellPadding, y + cellPadding + fontSize / 2 + 1);
    x += columnWidths[i];
  }
  y += rowHeight;

  // Draw rows
  doc.setFont('helvetica', 'normal');
  for (const row of rows) {
    // Check if we need a new page
    if (y + rowHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 15;
    }

    // Draw row border
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);

    x = margin;
    for (let i = 0; i < row.length; i++) {
      const cellText = row[i] ?? '';
      doc.text(cellText, x + cellPadding, y + cellPadding + fontSize / 2 + 1);
      x += columnWidths[i];
    }
    y += rowHeight;
  }

  return y + 5;
}

// Indian number words arrays
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigitWords(n: number): string {
  if (n < 20) return ones[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return `${tens[ten]}${one ? ' ' + ones[one] : ''}`;
}

/**
 * Convert a number to Indian English words.
 * Example: 1234 -> "One Thousand Two Hundred Thirty Four Rupees Only"
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const intPart = Math.floor(Math.abs(num));
  const paisaPart = Math.round((Math.abs(num) - intPart) * 100);

  let result = '';

  if (intPart >= 10000000) {
    result += twoDigitWords(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  const lakh = Math.floor((intPart % 10000000) / 100000);
  if (lakh > 0) {
    result += twoDigitWords(lakh) + ' Lakh ';
  }
  const thousand = Math.floor((intPart % 100000) / 1000);
  if (thousand > 0) {
    result += twoDigitWords(thousand) + ' Thousand ';
  }
  const hundred = Math.floor((intPart % 1000) / 100);
  if (hundred > 0) {
    result += ones[hundred] + ' Hundred ';
  }
  const remainder = intPart % 100;
  if (remainder > 0) {
    result += twoDigitWords(remainder) + ' ';
  }

  result += 'Rupees';

  if (paisaPart > 0) {
    result += ' and ' + twoDigitWords(paisaPart) + ' Paise';
  }

  result += ' Only';
  return result.trim();
}

/**
 * Format a number as INR with Indian grouping.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
