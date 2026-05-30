// #must: Generate payment receipt PDF (compact A5 size) — clinic header, service details, amount
import { jsPDF } from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface ReceiptData {
  receiptNo: string;
  date: string;
  patientName: string;
  patientPhone: string;
  serviceType: string;
  serviceDetails: string;
  amount: number;
  paymentMethod: string;
  receivedBy: string;
}

export function generateReceiptPDF(data: ReceiptData): jsPDF {
  // A5 landscape for compact receipt
  const doc = new jsPDF('p', 'mm', 'a5');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = margin;

  // --- Clinic Header (compact) ---
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(CLINIC_INFO.name, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(CLINIC_INFO.address, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(`Phone: ${CLINIC_INFO.phone}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // --- Title ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Horizontal line
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // --- Receipt Details ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt No:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.receiptNo, margin + 24, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - margin - 35, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.date), pageWidth - margin - 23, y);
  y += 7;

  // --- Patient Info ---
  doc.setFont('helvetica', 'bold');
  doc.text('Patient:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patientName, margin + 17, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patientPhone, margin + 15, y);
  y += 8;

  // --- Service Details ---
  doc.setDrawColor(200);
  doc.setLineWidth(0.1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Service:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.serviceType, margin + 17, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Details:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.serviceDetails, margin + 16, y);
  y += 8;

  // --- Amount Box ---
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, pageWidth - margin * 2, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Paid:', margin + 4, y + 6);
  doc.setFontSize(13);
  doc.text(formatCurrency(data.amount), margin + 4, y + 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Payment Method: ${data.paymentMethod.toUpperCase()}`,
    pageWidth - margin - 4,
    y + 9,
    { align: 'right' }
  );
  y += 20;

  // --- Received By ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Received By: ${data.receivedBy}`, margin, y);
  y += 15;

  // --- Signature placeholder ---
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(pageWidth - margin - 40, y, pageWidth - margin, y);
  doc.setFontSize(7);
  doc.text('Authorized Signature', pageWidth - margin - 20, y + 4, { align: 'center' });

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 8;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text('Thank you for visiting. Get well soon!', pageWidth / 2, footerY - 3, {
    align: 'center',
  });
  doc.text('This is a computer-generated receipt.', pageWidth / 2, footerY, {
    align: 'center',
  });

  return doc;
}
