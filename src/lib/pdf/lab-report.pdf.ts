// #must: Generate professional lab report PDF using jsPDF — clinic header, patient info, results table, flags
import jsPDF from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { formatDate } from '@/lib/formatters';
import type { LabBooking, Patient, LabReport, LabTest, LabResultEntry } from '@/types';

type BookingWithPatient = LabBooking & { patient: Patient };
type ReportWithTest = LabReport & { test: LabTest };

/**
 * Generates a professional lab diagnostic report PDF.
 * Includes clinic header, patient details, test results with flags, and footer.
 */
export function generateLabReportPDF(
  booking: BookingWithPatient,
  reports: ReportWithTest[]
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper: check if we need a new page
  function checkPageBreak(requiredHeight: number) {
    if (yPos + requiredHeight > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      drawPageBorder();
    }
  }

  // Helper: draw page border
  function drawPageBorder() {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  }

  // Helper: draw horizontal line
  function drawLine(y: number, style: 'solid' | 'dashed' = 'solid') {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    if (style === 'dashed') {
      const dashLength = 2;
      const gapLength = 1.5;
      let x = margin;
      while (x < pageWidth - margin) {
        const end = Math.min(x + dashLength, pageWidth - margin);
        doc.line(x, y, end, y);
        x = end + gapLength;
      }
    } else {
      doc.line(margin, y, pageWidth - margin, y);
    }
  }

  // --- PAGE BORDER ---
  drawPageBorder();

  // --- CLINIC HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text(CLINIC_INFO.name.toUpperCase(), pageWidth / 2, yPos + 5, { align: 'center' });
  yPos += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('DIAGNOSTIC LABORATORY', pageWidth / 2, yPos + 4, { align: 'center' });
  yPos += 8;

  doc.setFontSize(8);
  doc.text(CLINIC_INFO.address, pageWidth / 2, yPos + 3, { align: 'center' });
  yPos += 5;
  doc.text(
    `Phone: ${CLINIC_INFO.phone} | Email: ${CLINIC_INFO.email}`,
    pageWidth / 2,
    yPos + 3,
    { align: 'center' }
  );
  yPos += 7;

  // Header separator
  doc.setDrawColor(44, 62, 80);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 2;
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(0.4);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // --- REPORT INFO ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text('LABORATORY REPORT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Report number and date row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Report No: ${booking.bookingNumber}`, margin, yPos);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, yPos, {
    align: 'right',
  });
  yPos += 8;

  // --- PATIENT INFORMATION ---
  drawLine(yPos);
  yPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(44, 62, 80);
  doc.text('PATIENT INFORMATION', margin, yPos);
  yPos += 6;

  const patient = booking.patient;
  const patientInfoLeft = [
    { label: 'Patient Name', value: patient.name },
    { label: 'Age / Gender', value: `${patient.age} yrs / ${patient.gender}` },
    { label: 'Patient ID', value: patient.patientId },
  ];
  const patientInfoRight = [
    { label: 'Phone', value: patient.phone },
    { label: 'Booking Date', value: formatDate(booking.createdAt) },
    { label: 'Collection Date', value: booking.collectedBy ? formatDate(booking.createdAt) : 'N/A' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(33, 37, 41);

  patientInfoLeft.forEach((item, idx) => {
    const y = yPos + idx * 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${item.label}:`, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text(item.value, margin + 30, y);
  });

  patientInfoRight.forEach((item, idx) => {
    const y = yPos + idx * 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${item.label}:`, pageWidth / 2 + 10, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text(item.value, pageWidth / 2 + 40, y);
  });

  yPos += patientInfoLeft.length * 5 + 4;
  drawLine(yPos);
  yPos += 8;

  // --- TEST RESULTS ---
  reports.forEach((report, reportIndex) => {
    const test = report.test;
    const results = report.results as LabResultEntry[];

    // Test section header height estimate
    const sectionHeight = 12 + results.length * 6 + (report.interpretation ? 15 : 0) + 10;
    checkPageBreak(Math.min(sectionHeight, 80));

    // Test header
    doc.setFillColor(240, 244, 248);
    doc.rect(margin, yPos - 2, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(44, 62, 80);
    doc.text(test.testName.toUpperCase(), margin + 2, yPos + 3);

    // Sample type on the right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Sample: ${test.sampleType}`,
      pageWidth - margin - 2,
      yPos + 3,
      { align: 'right' }
    );
    yPos += 10;

    // Results table header
    const colX = {
      parameter: margin + 2,
      result: margin + 60,
      unit: margin + 95,
      reference: margin + 120,
      flag: pageWidth - margin - 12,
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Parameter', colX.parameter, yPos);
    doc.text('Result', colX.result, yPos);
    doc.text('Unit', colX.unit, yPos);
    doc.text('Reference Range', colX.reference, yPos);
    doc.text('Flag', colX.flag, yPos);
    yPos += 2;

    drawLine(yPos, 'dashed');
    yPos += 4;

    // Result rows
    results.forEach((result) => {
      checkPageBreak(7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(33, 37, 41);
      doc.text(result.parameter, colX.parameter, yPos);

      // Value - bold if abnormal
      if (result.flag === 'high' || result.flag === 'low' || result.flag === 'critical') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(192, 57, 43);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 37, 41);
      }
      doc.text(result.value, colX.result, yPos);

      // Unit and reference
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(result.unit, colX.unit, yPos);
      doc.text(result.normalRange, colX.reference, yPos);

      // Flag indicator
      let flagSymbol = '';
      if (result.flag === 'high') flagSymbol = 'H *';
      else if (result.flag === 'low') flagSymbol = 'L ↓';
      else if (result.flag === 'critical') flagSymbol = 'C **';

      if (flagSymbol) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(192, 57, 43);
        doc.text(flagSymbol, colX.flag, yPos);
      }

      yPos += 5.5;
    });

    yPos += 2;

    // Interpretation
    if (report.interpretation) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(60, 60, 60);
      doc.text('Interpretation:', margin + 2, yPos);
      yPos += 4;
      doc.setFont('helvetica', 'normal');

      // Word-wrap interpretation text
      const splitText = doc.splitTextToSize(report.interpretation, contentWidth - 4);
      splitText.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin + 2, yPos);
        yPos += 3.5;
      });
      yPos += 2;
    }

    // Separator between tests
    if (reportIndex < reports.length - 1) {
      yPos += 3;
      drawLine(yPos, 'dashed');
      yPos += 6;
    }
  });

  // --- FOOTER SECTION ---
  yPos += 10;
  checkPageBreak(35);
  drawLine(yPos);
  yPos += 8;

  // Verified by
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Verified by:', margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(booking.verifiedBy ?? 'Lab Staff', margin, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Lab Technician', margin, yPos);

  // Flag legend on the right
  const legendX = pageWidth - margin - 50;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('H * = High', legendX, yPos - 9);
  doc.text('L ↓ = Low', legendX, yPos - 5);
  doc.text('C ** = Critical', legendX, yPos - 1);

  yPos += 10;

  // Footer note
  drawLine(yPos);
  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'This is a computer-generated report and does not require signature.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 5;
  doc.text('--- End of Report ---', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}
