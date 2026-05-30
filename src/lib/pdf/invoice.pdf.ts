// #must: PDF generation for medicine invoices using jsPDF
import { jsPDF } from 'jspdf';
import type { Sale, SaleItem } from '@/types';
import { calculateCartGST } from '@/lib/gst';
import { createDocument, addClinicHeader, addFooter, addTable, numberToWords, formatINR } from './shared.pdf';

/**
 * Generate a complete invoice PDF for a sale.
 */
export function generateInvoicePDF(sale: Sale & { items: SaleItem[] }): jsPDF {
  const doc = createDocument('portrait');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  // Clinic Header
  let y = addClinicHeader(doc, 15);

  // Invoice Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Invoice Info and Customer Info side by side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Left side - Invoice details
  doc.text(`Invoice No: ${sale.invoiceNumber}`, margin, y);
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN')}`, margin, y + 5);
  doc.text(`Billed By: ${sale.billedBy}`, margin, y + 10);

  // Right side - Customer details
  const rightX = pageWidth - margin;
  doc.text(`Customer: ${sale.customerName}`, rightX, y, { align: 'right' });
  if (sale.customerPhone) {
    doc.text(`Phone: ${sale.customerPhone}`, rightX, y + 5, { align: 'right' });
  }
  doc.text(`Payment: ${sale.paymentMethod.toUpperCase()}`, rightX, y + 10, { align: 'right' });

  y += 18;

  // Items Table
  const headers = ['S.No', 'Medicine', 'HSN', 'Batch', 'Qty', 'Rate', 'GST%', 'Amount'];
  const tableWidth = pageWidth - margin * 2;
  const columnWidths = [
    tableWidth * 0.06,  // S.No
    tableWidth * 0.25,  // Medicine
    tableWidth * 0.1,   // HSN
    tableWidth * 0.12,  // Batch
    tableWidth * 0.07,  // Qty
    tableWidth * 0.13,  // Rate
    tableWidth * 0.1,   // GST%
    tableWidth * 0.17,  // Amount
  ];

  const rows: string[][] = sale.items.map((item, index) => [
    String(index + 1),
    item.medicineName,
    item.hsnCode,
    item.batchNumber,
    String(item.quantity),
    formatINR(item.unitPrice),
    `${item.gstPercentage}%`,
    formatINR(item.totalPrice),
  ]);

  y = addTable(doc, headers, rows, y, { columnWidths, fontSize: 8 });

  y += 3;

  // GST Summary
  const cartItems = sale.items.map((item) => ({
    id: item.id,
    medicineId: item.medicineId,
    batchId: item.batchId,
    medicineName: item.medicineName,
    batchNumber: item.batchNumber,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    gstPercentage: item.gstPercentage,
    hsnCode: item.hsnCode,
    gstAmount: item.gstAmount,
    totalPrice: item.totalPrice,
  }));

  const gstResult = calculateCartGST(cartItems);

  if (gstResult.gstBreakdown.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GST Summary', margin, y);
    y += 5;

    const gstHeaders = ['Slab', 'Taxable Amount', 'CGST', 'SGST', 'Total GST'];
    const gstColumnWidths = [
      tableWidth * 0.15,
      tableWidth * 0.25,
      tableWidth * 0.2,
      tableWidth * 0.2,
      tableWidth * 0.2,
    ];

    const gstRows: string[][] = gstResult.gstBreakdown.map((slab) => [
      `${slab.percentage}%`,
      formatINR(slab.taxableAmount),
      formatINR(slab.cgst),
      formatINR(slab.sgst),
      formatINR(slab.totalGst),
    ]);

    y = addTable(doc, gstHeaders, gstRows, y, { columnWidths: gstColumnWidths, fontSize: 8 });
  }

  y += 3;

  // Totals section (right-aligned)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;

  doc.text('Subtotal:', totalsX, y);
  doc.text(formatINR(sale.subtotal), valuesX, y, { align: 'right' });
  y += 5;

  doc.text('GST Total:', totalsX, y);
  doc.text(formatINR(sale.gstTotal), valuesX, y, { align: 'right' });
  y += 5;

  if (sale.discountAmount > 0) {
    doc.text(`Discount (${sale.discountType === 'percentage' ? sale.discountValue + '%' : 'Fixed'}):`, totalsX, y);
    doc.text(`-${formatINR(sale.discountAmount)}`, valuesX, y, { align: 'right' });
    y += 5;
  }

  // Grand total (bold and larger)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(totalsX - 5, y, valuesX, y);
  y += 4;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalsX, y);
  doc.text(formatINR(sale.grandTotal), valuesX, y, { align: 'right' });
  y += 7;

  // Amount in words
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Amount in words: ${numberToWords(sale.grandTotal)}`, margin, y);
  y += 8;

  // Payment info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (sale.paymentMethod === 'cash') {
    doc.text(`Paid: ${formatINR(sale.paidAmount)} | Change: ${formatINR(sale.changeAmount)}`, margin, y);
  } else {
    doc.text(`Paid via ${sale.paymentMethod.toUpperCase()}: ${formatINR(sale.paidAmount)}`, margin, y);
  }

  // Footer
  addFooter(doc);

  return doc;
}
