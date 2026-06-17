
import { jsPDF } from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { formatDate } from '@/lib/formatters';
import type { Prescription, PrescriptionItem, Patient, Doctor, Vitals } from '@/types';

interface PrescriptionPDFData extends Omit<Prescription, 'patient' | 'doctor'> {
  patient: Patient;
  doctor: Doctor;
  items: PrescriptionItem[];
  symptoms?: string;
  clinicalNotes?: string;
}

export function generatePrescriptionPDF(
  prescription: PrescriptionPDFData,
  vitals?: Vitals
): jsPDF {
  // A5 portrait: 148 × 210 mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const PW = 148;
  const PH = 210;
  const ML = 8;
  const MT = 6;
  const TW = PW - ML * 2;
  let y = MT;

  const set = (size: number, style: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(0);
  };
  const hl = (yy: number, lw = 0.2) => {
    doc.setDrawColor(0); doc.setLineWidth(lw);
    doc.line(ML, yy, ML + TW, yy);
  };
  const grayRect = (x: number, yy: number, w: number, h: number) => {
    doc.setFillColor(235, 235, 235);
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.rect(x, yy, w, h, 'F');
  };

  // ── outer border ────────────────────────────────────────────────────────────
  doc.setDrawColor(0); doc.setLineWidth(0.4);
  doc.rect(ML, MT, TW, PH - MT * 2, 'S');

  // ── clinic header ───────────────────────────────────────────────────────────
  set(12, 'bold');
  doc.text(CLINIC_INFO.name, PW / 2, y + 7, { align: 'center' });
  set(7);
  doc.text(CLINIC_INFO.address, PW / 2, y + 12, { align: 'center' });
  doc.text(`Ph: ${CLINIC_INFO.phone}  |  ${CLINIC_INFO.email}`, PW / 2, y + 16, { align: 'center' });
  y += 19;
  hl(y, 0.3);
  y += 3;

  // ── doctor info (left) | Rx meta (right) ────────────────────────────────────
  const MID = ML + TW / 2;
  set(9, 'bold');
  doc.text(`Dr. ${prescription.doctor.name}`, ML + 2, y + 4);
  set(7);
  doc.text(`${prescription.doctor.qualification}  |  ${prescription.doctor.specialization}`, ML + 2, y + 8.5);
  doc.text(`Reg. No: ${prescription.doctor.registrationNo}`, ML + 2, y + 13);

  const RR = ML + TW - 2;
  set(7);
  doc.text('Rx No', MID + 2, y + 4);
  set(7, 'bold'); doc.text(prescription.prescriptionNo, RR, y + 4, { align: 'right' });
  set(7);
  doc.text('Date', MID + 2, y + 9);
  doc.text(formatDate(prescription.createdAt), RR, y + 9, { align: 'right' });

  y += 17;
  hl(y, 0.3);
  y += 3;

  // ── patient row ─────────────────────────────────────────────────────────────
  set(8, 'bold'); doc.text('Patient:', ML + 2, y + 4);
  set(8); doc.text(
    `${prescription.patient.name}  |  ${prescription.patient.age} yrs / ${prescription.patient.gender}`,
    ML + 18, y + 4
  );
  if (prescription.patient.phone) {
    set(7); doc.text(`Ph: ${prescription.patient.phone}`, RR, y + 4, { align: 'right' });
  }
  y += 8;

  // ── vitals — two-row table: label row + value row ───────────────────────────
  if (vitals) {
    const vItems: { label: string; value: string }[] = [];
    if (vitals.bp)     vItems.push({ label: 'BP (mmHg)',  value: vitals.bp });
    if (vitals.pulse)  vItems.push({ label: 'Pulse/min',  value: vitals.pulse });
    if (vitals.temp)   vItems.push({ label: 'Temp (°F)',  value: vitals.temp });
    if (vitals.weight) vItems.push({ label: 'Wt (kg)',    value: vitals.weight });
    if (vitals.height) vItems.push({ label: 'Ht (cm)',    value: vitals.height });
    if (vitals.spo2)   vItems.push({ label: 'SpO2 (%)',   value: vitals.spo2 });

    if (vItems.length) {
      const BW = TW / vItems.length;
      const LH = 5;   // label row height
      const VH = 7;   // value row height

      // label row — dark gray bg
      doc.setFillColor(70, 70, 70);
      doc.rect(ML, y, TW, LH, 'F');
      set(5.5, 'bold'); doc.setTextColor(255);
      vItems.forEach((v, i) => {
        const bx = ML + i * BW;
        doc.text(v.label, bx + BW / 2, y + 3.5, { align: 'center' });
      });

      // value row — light bg
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.2);
      doc.rect(ML, y + LH, TW, VH, 'FD');
      set(9, 'bold'); doc.setTextColor(0);
      vItems.forEach((v, i) => {
        const bx = ML + i * BW;
        if (i > 0) {
          doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
          doc.line(bx, y + LH, bx, y + LH + VH);
        }
        doc.text(v.value, bx + BW / 2, y + LH + 5, { align: 'center' });
      });

      doc.setTextColor(0);
      y += LH + VH + 2;
    }
  }

  hl(y, 0.2);
  y += 3;

  // ── symptoms ────────────────────────────────────────────────────────────────
  if (prescription.symptoms?.trim()) {
    set(7, 'bold'); doc.text('Symptoms:', ML + 2, y);
    set(7);
    const sLines = doc.splitTextToSize(prescription.symptoms.trim(), TW - 26);
    doc.text(sLines, ML + 22, y);
    y += sLines.length * 4 + 2;
  }

  // ── diagnosis ───────────────────────────────────────────────────────────────
  set(8, 'bold');  doc.text('Diagnosis:', ML + 2, y + 4);
  set(8);          doc.text(prescription.diagnosis ?? '', ML + 24, y + 4, { maxWidth: TW - 26 });
  y += 10;
  hl(y, 0.2);
  y += 2;

  // ── medicine table ──────────────────────────────────────────────────────────
  // cols: # | Medicine | Dosage | Frequency | Duration | Timing | Notes
  const C_W = [6, 34, 16, 20, 16, 20, TW - 112] as const;
  const C_H = ['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Timing', 'Notes'];
  const THH = 5.5;

  grayRect(ML, y, TW, THH);
  set(6, 'bold');
  let cx = ML + 1;
  for (let i = 0; i < C_H.length; i++) {
    doc.text(C_H[i], cx, y + 3.8);
    cx += C_W[i];
  }
  y += THH;

  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.1);

  prescription.items.forEach((item, idx) => {
    const RH = 6;
    if (y > PH - MT - 30) { doc.addPage(); y = MT + 4; }

    set(7);
    cx = ML + 1;
    const row = [
      String(idx + 1),
      item.medicineName,
      item.dosage === '-' ? '' : (item.dosage ?? ''),
      item.frequency,
      item.duration,
      item.timing || '',
      item.instructions || '',
    ];
    row.forEach((txt, ci) => {
      const mw = C_W[ci] - 1.5;
      const lines = doc.splitTextToSize(txt, mw);
      doc.text(lines[0] ?? '', cx, y + 4);
      cx += C_W[ci];
    });

    doc.line(ML, y + RH, ML + TW, y + RH);
    y += RH;
  });

  y += 4;

  // ── advice ──────────────────────────────────────────────────────────────────
  // strip any embedded "Follow-up: ..." line that may have been saved in old records
  const rawAdvice = prescription.advice ?? '';
  const adviceLines2 = rawAdvice.split('\n');
  let embeddedFollowup = '';
  const cleanAdvice = adviceLines2.filter((l) => {
    const m = l.match(/^Follow-up:\s*(.+)/i);
    if (m) { embeddedFollowup = m[1]; return false; }
    return true;
  }).join('\n').trim();

  if (cleanAdvice) {
    set(8, 'bold'); doc.text('Advice:', ML + 2, y);
    set(8);
    const lines = doc.splitTextToSize(cleanAdvice, TW - 24);
    doc.text(lines, ML + 20, y);
    y += lines.length * 4 + 3;
  }

  // ── follow-up — bold, separate line ─────────────────────────────────────────
  const followupText = (prescription.followupDate
    ? String(prescription.followupDate).replace(/^Follow-up:\s*/i, '')
    : embeddedFollowup
  ).trim();

  if (followupText) {
    set(8, 'bold'); doc.text('Follow-up:', ML + 2, y);
    set(8, 'bold'); doc.setTextColor(30, 80, 180);
    doc.text(followupText, ML + 22, y);
    doc.setTextColor(0);
    y += 6;
  }

  // ── clinical notes ───────────────────────────────────────────────────────────
  if (prescription.clinicalNotes?.trim()) {
    set(7, 'bold'); doc.text('Notes:', ML + 2, y);
    set(7); doc.setTextColor(80);
    const nLines = doc.splitTextToSize(prescription.clinicalNotes.trim(), TW - 20);
    doc.text(nLines, ML + 16, y);
    doc.setTextColor(0);
    y += nLines.length * 4 + 3;
  }

  // ── signature — flows right after content ───────────────────────────────────
  y += 6;
  const sigX = ML + TW - 44;
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.line(sigX, y, ML + TW - 2, y);
  set(8); doc.text(`Dr. ${prescription.doctor.name}`, sigX + 21, y + 4, { align: 'center' });
  set(6); doc.text(prescription.doctor.qualification, sigX + 21, y + 8, { align: 'center' });

  // ── footer ───────────────────────────────────────────────────────────────────
  set(6, 'italic'); doc.setTextColor(140);
  doc.text('This is a computer-generated prescription.', PW / 2, PH - MT - 1, { align: 'center' });

  return doc;
}
