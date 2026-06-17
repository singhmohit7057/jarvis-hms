
import jsPDF from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { formatDate } from '@/lib/formatters';
import type { LabBooking, Patient, LabReport, LabTest, LabResultEntry } from '@/types';

type BookingWithPatient = LabBooking & { patient: Patient };
type ReportWithTest = LabReport & { test: LabTest };

export function generateLabReportPDF(
  booking: BookingWithPatient,
  reports: ReportWithTest[]
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 15;
  const MR = 15;
  const CW = PW - ML - MR;

  const patient = booking.patient;

  // ── helpers ──────────────────────────────────────────────────────────────────
  function drawBorder() {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(8, 8, PW - 16, PH - 16);
  }

  function drawLine(y: number, dashed = false) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    if (dashed) {
      const dash = 2, gap = 1.5;
      let x = ML;
      while (x < PW - MR) {
        doc.line(x, y, Math.min(x + dash, PW - MR), y);
        x += dash + gap;
      }
    } else {
      doc.line(ML, y, PW - MR, y);
    }
  }

  function drawClinicHeader(y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text(CLINIC_INFO.name.toUpperCase(), PW / 2, y + 5, { align: 'center' });
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('DIAGNOSTIC LABORATORY', PW / 2, y + 3, { align: 'center' });
    y += 7;

    doc.setFontSize(8);
    doc.text(CLINIC_INFO.address, PW / 2, y + 2, { align: 'center' });
    y += 5;
    doc.text(`Phone: ${CLINIC_INFO.phone} | Email: ${CLINIC_INFO.email}`, PW / 2, y + 2, { align: 'center' });
    y += 6;

    doc.setDrawColor(44, 62, 80);
    doc.setLineWidth(0.8);
    doc.line(ML, y, PW - MR, y);
    y += 2;
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(0.4);
    doc.line(ML, y, PW - MR, y);
    y += 5;

    return y;
  }

  function drawSmallClinicHeader(y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(33, 37, 41);
    doc.text(CLINIC_INFO.name.toUpperCase(), PW / 2, y + 4, { align: 'center' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${CLINIC_INFO.address} | Ph: ${CLINIC_INFO.phone}`,
      PW / 2, y + 2, { align: 'center' }
    );
    y += 5;

    doc.setDrawColor(44, 62, 80);
    doc.setLineWidth(0.5);
    doc.line(ML, y, PW - MR, y);
    y += 1;
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y);
    y += 4;

    return y;
  }

  function drawPageFooter(pageLabel: string) {
    const fy = PH - 18;
    drawLine(fy);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'This is a computer-generated report and does not require signature.',
      PW / 2, fy + 4, { align: 'center' }
    );
    doc.text(pageLabel, PW - MR, fy + 4, { align: 'right' });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Cover / Summary
  // ════════════════════════════════════════════════════════════════════════════
  drawBorder();
  let y = 15;

  y = drawClinicHeader(y);

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);
  doc.text('LABORATORY REPORT', PW / 2, y, { align: 'center' });
  y += 7;

  // Booking meta row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Report No: ${booking.bookingNumber}`, ML, y);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, PW - MR, y, { align: 'right' });
  y += 8;

  // ── Patient Information ───────────────────────────────────────────────────
  drawLine(y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(44, 62, 80);
  doc.text('PATIENT INFORMATION', ML, y);
  y += 6;

  const leftInfo = [
    { label: 'Patient Name', value: patient.name ?? '' },
    { label: 'Age / Gender', value: `${patient.age ?? '--'} yrs / ${patient.gender ?? '--'}` },
    { label: 'Patient ID', value: patient.patientId ?? '' },
  ];
  const rightInfo = [
    { label: 'Phone', value: patient.phone ?? '' },
    { label: 'Booking Date', value: formatDate(booking.createdAt) },
    { label: 'Collected By', value: booking.collectorName ?? booking.collectedBy ?? 'N/A' },
  ];

  doc.setFontSize(8);
  leftInfo.forEach((item, i) => {
    const iy = y + i * 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${item.label}:`, ML, iy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text(item.value, ML + 32, iy);
  });

  rightInfo.forEach((item, i) => {
    const iy = y + i * 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${item.label}:`, PW / 2 + 8, iy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text(item.value, PW / 2 + 42, iy);
  });

  y += leftInfo.length * 5.5 + 5;

  // ── Tests Summary Table ────────────────────────────────────────────────────
  drawLine(y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(44, 62, 80);
  doc.text('TESTS INCLUDED IN THIS REPORT', ML, y);
  y += 6;

  // Table header
  doc.setFillColor(44, 62, 80);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', ML + 3, y + 4.5);
  doc.text('Test Name', ML + 12, y + 4.5);
  doc.text('Sample Type', ML + 90, y + 4.5);
  doc.text('Parameters', ML + 130, y + 4.5);
  doc.text('Page', PW - MR - 3, y + 4.5, { align: 'right' });
  y += 7;

  reports.forEach((report, idx) => {
    const rowH = 7;
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(ML, y, CW, rowH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(33, 37, 41);
    doc.text(String(idx + 1), ML + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(report.test.testName, ML + 12, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(report.test.sampleType ?? '-', ML + 90, y + 4.5);
    doc.text(String((report.results as LabResultEntry[]).length), ML + 130, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 152, 219);
    doc.text(String(idx + 2), PW - MR - 3, y + 4.5, { align: 'right' });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(ML, y + rowH, PW - MR, y + rowH);
    y += rowH;
  });

  y += 10;

  // ── Prepared / Verified By ────────────────────────────────────────────────
  drawLine(y);
  y += 7;

  const preparedBy = booking.preparedBy;
  if (preparedBy) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Report Prepared By:', ML, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text(String(preparedBy), ML + 36, y);
    y += 5;
  }
  drawPageFooter(`Page 1 of ${reports.length + 1}`);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE PER TEST
  // ════════════════════════════════════════════════════════════════════════════
  reports.forEach((report, reportIdx) => {
    doc.addPage();
    drawBorder();
    let py = 12;

    py = drawSmallClinicHeader(py);

    // Page label + test title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text(report.test.testName.toUpperCase(), PW / 2, py + 4, { align: 'center' });
    py += 8;

    // Booking ref + sample type
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Booking: ${booking.bookingNumber}`, ML, py);
    doc.text(`Sample: ${report.test.sampleType ?? ''}`, PW - MR, py, { align: 'right' });
    py += 4;

    // Patient mini-bar
    doc.setFillColor(240, 244, 248);
    doc.rect(ML, py, CW, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text(
      `${patient.name ?? ''}  |  ${patient.age ?? '--'} yrs / ${patient.gender ?? '--'}  |  ID: ${patient.patientId ?? ''}  |  ${formatDate(booking.createdAt)}`,
      PW / 2, py + 4.5, { align: 'center' }
    );
    py += 11;

    // Results table header
    const colX = {
      parameter: ML + 2,
      result: ML + 68,
      unit: ML + 100,
      reference: ML + 128,
      flag: PW - MR - 10,
    };

    doc.setFillColor(44, 62, 80);
    doc.rect(ML, py, CW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Parameter', colX.parameter, py + 4.5);
    doc.text('Result', colX.result, py + 4.5);
    doc.text('Unit', colX.unit, py + 4.5);
    doc.text('Reference Range', colX.reference, py + 4.5);
    doc.text('Flag', colX.flag, py + 4.5, { align: 'right' });
    py += 7;

    const results = report.results as LabResultEntry[];

    results.forEach((result, ri) => {
      const rowH = 6.5;

      if (ri % 2 === 0) {
        doc.setFillColor(250, 251, 252);
        doc.rect(ML, py, CW, rowH, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(33, 37, 41);
      doc.text(result.parameter ?? '', colX.parameter, py + 4);

      const isAbnormal = result.flag === 'high' || result.flag === 'low' || result.flag === 'critical';
      if (isAbnormal) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(192, 57, 43);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 37, 41);
      }
      doc.text(result.value ?? '', colX.result, py + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(result.unit ?? '', colX.unit, py + 4);
      doc.text(result.normalRange ?? '', colX.reference, py + 4);

      if (isAbnormal) {
        const sym = result.flag === 'high' ? 'H ↑' : result.flag === 'low' ? 'L ↓' : 'C !!';
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(192, 57, 43);
        doc.text(sym, colX.flag, py + 4, { align: 'right' });
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(ML, py + rowH, PW - MR, py + rowH);
      py += rowH;
    });

    py += 6;

    // Interpretation
    if (report.interpretation) {
      doc.setFillColor(255, 253, 235);
      const interpLines = doc.splitTextToSize(report.interpretation, CW - 8);
      const interpH = interpLines.length * 4 + 8;
      doc.rect(ML, py, CW, interpH, 'F');
      doc.setDrawColor(230, 200, 60);
      doc.setLineWidth(0.4);
      doc.line(ML, py, ML, py + interpH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 80, 0);
      doc.text('Interpretation:', ML + 4, py + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(interpLines, ML + 4, py + 10);
      py += interpH + 6;
    }

    // Flag legend
    const ly = PH - 24;
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.setFont('helvetica', 'normal');
    doc.text('H ↑ = High    |    L ↓ = Low    |    C !! = Critical', ML, ly);

    drawPageFooter(`Page ${reportIdx + 2} of ${reports.length + 1}`);
  });

  return doc;
}
