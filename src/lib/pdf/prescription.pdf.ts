// #must: Generate prescription PDF using jsPDF — clinic header, Rx symbol, patient info, medicine table
import { jsPDF } from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { formatDate } from '@/lib/formatters';
import type { Prescription, PrescriptionItem, Patient, Doctor, Vitals } from '@/types';

interface PrescriptionPDFData extends Omit<Prescription, 'patient' | 'doctor'> {
  patient: Patient;
  doctor: Doctor;
  items: PrescriptionItem[];
}

export function generatePrescriptionPDF(
  prescription: PrescriptionPDFData,
  vitals?: Vitals
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Clinic Header ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(CLINIC_INFO.name, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(CLINIC_INFO.address, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Phone: ${CLINIC_INFO.phone} | Email: ${CLINIC_INFO.email}`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 6;

  // Doctor info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${prescription.doctor.name}`, margin, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const doctorInfo = `${prescription.doctor.qualification} | ${prescription.doctor.specialization}`;
  doc.text(doctorInfo, margin, y + 4);
  doc.text(`Reg. No: ${prescription.doctor.registrationNo}`, margin, y + 8);

  // Prescription number on the right
  doc.setFontSize(9);
  doc.text(`Rx No: ${prescription.prescriptionNo}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Date: ${formatDate(prescription.createdAt)}`, pageWidth - margin, y + 4, {
    align: 'right',
  });
  y += 14;

  // Horizontal line
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // --- Patient Info ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${prescription.patient.name} | ${prescription.patient.age} yrs / ${prescription.patient.gender}`,
    margin + 17,
    y
  );

  if (prescription.patient.phone) {
    doc.text(`Phone: ${prescription.patient.phone}`, pageWidth - margin, y, { align: 'right' });
  }
  y += 6;

  // --- Vitals line ---
  if (vitals) {
    const vitalParts: string[] = [];
    if (vitals.bp) vitalParts.push(`BP: ${vitals.bp}`);
    if (vitals.pulse) vitalParts.push(`Pulse: ${vitals.pulse}`);
    if (vitals.temp) vitalParts.push(`Temp: ${vitals.temp}°F`);
    if (vitals.weight) vitalParts.push(`Wt: ${vitals.weight}kg`);
    if (vitals.spo2) vitalParts.push(`SpO2: ${vitals.spo2}%`);

    if (vitalParts.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Vitals: ${vitalParts.join(' | ')}`, margin, y);
      y += 5;
    }
  }

  // --- Rx Symbol + Diagnosis ---
  y += 2;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Rx', margin, y);
  y += 2;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnosis: ', margin + 12, y - 4);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.diagnosis, margin + 34, y - 4);
  y += 6;

  // --- Medicine Table ---
  const colWidths = [8, 50, 20, 22, 22, 26, contentWidth - 148];
  const headers = ['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Timing', 'Instructions'];

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 1, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  let xPos = margin + 1;
  headers.forEach((header, idx) => {
    doc.text(header, xPos, y + 3.5);
    xPos += colWidths[idx];
  });
  y += 9;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  prescription.items.forEach((item, idx) => {
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    xPos = margin + 1;
    const rowData = [
      String(idx + 1),
      item.medicineName,
      item.dosage,
      item.frequency,
      item.duration,
      item.timing || '-',
      item.instructions || '-',
    ];

    rowData.forEach((text, colIdx) => {
      const maxWidth = colWidths[colIdx] - 2;
      const truncated =
        doc.getTextWidth(text) > maxWidth
          ? text.substring(0, Math.floor((maxWidth / doc.getTextWidth(text)) * text.length)) + '..'
          : text;
      doc.text(truncated, xPos, y);
      xPos += colWidths[colIdx];
    });

    y += 6;

    // Light separator
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  y += 4;

  // --- Advice ---
  if (prescription.advice) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Advice:', margin, y);
    doc.setFont('helvetica', 'normal');
    const adviceLines = doc.splitTextToSize(prescription.advice, contentWidth - 20);
    doc.text(adviceLines, margin + 16, y);
    y += adviceLines.length * 4 + 4;
  }

  // --- Follow-up ---
  if (prescription.followupDate) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Follow-up:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(prescription.followupDate, margin + 22, y);
    y += 8;
  }

  // --- Doctor Signature ---
  const signatureY = Math.max(y + 20, 250);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dr. ${prescription.doctor.name}`, pageWidth - margin - 25, signatureY + 5, {
    align: 'center',
  });
  doc.setFontSize(7);
  doc.text(prescription.doctor.qualification, pageWidth - margin - 25, signatureY + 9, {
    align: 'center',
  });

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text('This is a computer-generated prescription.', pageWidth / 2, footerY, {
    align: 'center',
  });

  return doc;
}
