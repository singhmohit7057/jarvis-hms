
import { jsPDF } from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { supabase } from '@/lib/supabase';

function rupee(amount: number): string {
  return 'Rs.' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export interface LabReceiptData {
  bookingNumber: string;
  date: string;
  patientName: string;
  patientId?: string;
  patientPhone?: string;
  tests: { testName: string; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  collectorName?: string;
  bottleNumber?: string;
}

interface ClinicInfo { name: string; address: string; phone: string; email: string; gstNumber: string; }

export async function fetchLabReceiptClinic(): Promise<ClinicInfo> {
  const { data } = await supabase.from('clinic_settings')
    .select('clinic_name, address, phone, email, gst_number').limit(1).maybeSingle();
  if (data) return {
    name: data.clinic_name ?? CLINIC_INFO.name, address: data.address ?? CLINIC_INFO.address,
    phone: data.phone ?? CLINIC_INFO.phone, email: data.email ?? CLINIC_INFO.email,
    gstNumber: data.gst_number ?? CLINIC_INFO.gstNumber,
  };
  return { ...CLINIC_INFO };
}

export function generateLabReceiptPDF(data: LabReceiptData, clinic?: ClinicInfo): jsPDF {
  const C = clinic ?? { ...CLINIC_INFO };

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
  const PH = 148, PW = 210, ML = 6, MT = 5;
  const TW = PW - ML * 2;

  const hl = (y: number, x1 = ML, x2 = ML + TW, lw = 0.2) => {
    doc.setDrawColor(0); doc.setLineWidth(lw); doc.line(x1, y, x2, y);
  };
  const vl = (x: number, y1: number, y2: number) => {
    doc.setDrawColor(0); doc.setLineWidth(0.2); doc.line(x, y1, x, y2);
  };
  const set = (size: number, bold = false) => {
    doc.setTextColor(0); doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
  };
  const grayFill = (x: number, y: number, w: number, h: number) => {
    doc.setFillColor(230, 230, 230); doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, 'FD'); doc.setFillColor(255, 255, 255);
  };

  // outer box
  doc.setDrawColor(0); doc.setLineWidth(0.4);
  doc.rect(ML, MT, TW, PH - MT * 2, 'S');

  let y = MT;

  // banner
  const BANNER_H = 7;
  grayFill(ML, y, TW, BANNER_H);
  set(11, true);
  doc.text('LAB RECEIPT', PW / 2, y + 4.8, { align: 'center' });
  hl(y + BANNER_H);
  y += BANNER_H;

  // header: left = clinic | right = booking meta + patient
  const HDR_H = 30;
  const MID = ML + TW / 2;
  vl(MID, y, y + HDR_H);

  set(10, true); doc.text(C.name.toUpperCase(), ML + 2, y + 6);
  set(7);
  doc.text('Address : ' + C.address, ML + 2, y + 12);
  doc.text('Phone   : ' + C.phone,   ML + 2, y + 17);
  doc.text('Email   : ' + C.email,   ML + 2, y + 22);
  if (C.gstNumber) doc.text('GSTIN   : ' + C.gstNumber, ML + 2, y + 27);

  const RX = MID + 2, RR = ML + TW - 2;
  set(7);
  doc.text('Booking No', RX, y + 6);
  set(7, true); doc.text(data.bookingNumber, RR, y + 6, { align: 'right' });
  set(7);
  doc.text('Date', RX, y + 11); doc.text(fmtDate(data.date), RR, y + 11, { align: 'right' });
  doc.text('Time', RX, y + 16); doc.text(fmtTime(data.date), RR, y + 16, { align: 'right' });

  set(7, true); doc.text('PATIENT NAME:', RX, y + 22);
  set(7); doc.text(data.patientName.toUpperCase(), RX + 24, y + 22);
  if (data.patientPhone) doc.text('Mobile: ' + data.patientPhone, RX, y + 27);

  y += HDR_H;
  hl(y);

  // test table header
  const C_PCT = [0.55, 0.25, 0.20] as const;
  const C_LBL = ['Test Name', 'Category', 'Amount'];
  const cW = C_PCT.map(p => p * TW);
  const cX: number[] = [];
  { let x = ML; for (const w of cW) { cX.push(x); x += w; } cX.push(ML + TW); }

  const THH = 5.5, RH = 6;

  grayFill(ML, y, TW, THH);
  set(5.5, true);
  for (let i = 0; i < C_LBL.length; i++) {
    vl(cX[i], y, y + THH);
    doc.text(C_LBL[i], cX[i] + 0.8, y + 3.8);
  }
  vl(cX[C_LBL.length], y, y + THH);
  hl(y + THH);
  y += THH;

  // test rows
  set(6);
  for (const test of data.tests) {
    for (let i = 0; i < 3; i++) vl(cX[i], y, y + RH);
    vl(cX[3], y, y + RH);
    doc.text(test.testName, cX[0] + 0.8, y + 4, { maxWidth: cW[0] - 1.5 });
    doc.text('Lab Test',    cX[1] + 0.8, y + 4);
    set(6, true); doc.text(rupee(test.price), cX[2] + cW[2] - 1, y + 4, { align: 'right' });
    set(6);
    hl(y + RH);
    y += RH;
  }

  // total row
  grayFill(ML, y, TW, RH);
  for (let i = 0; i < 3; i++) vl(cX[i], y, y + RH);
  vl(cX[3], y, y + RH);
  set(7, true);
  doc.text('TOTAL', cX[0] + 0.8, y + 4);
  doc.text(rupee(data.totalAmount), cX[2] + cW[2] - 1, y + 4, { align: 'right' });
  hl(y + RH);
  y += RH;

  // ── summary / bottom ──────────────────────────────────────────────────────
  const SUMMARY_H = 16;
  const BOT_H = 24;
  const SY = Math.max(y + 2, PH - MT - BOT_H - SUMMARY_H);

  if (SY > y + 1) hl(SY);

  // left: collection info
  const LW = TW * 0.56;
  const LE = ML + LW;
  set(7);
  doc.text('Payment Method : ' + data.paymentMethod.toUpperCase(), ML + 2, SY + 5);
  if (data.collectorName) doc.text('Collected By   : ' + data.collectorName, ML + 2, SY + 11);
  if (data.bottleNumber)  doc.text('Bottle / Tube  : ' + data.bottleNumber,  ML + 2, SY + 17);

  // right: summary box
  const TRH = SUMMARY_H / 2;
  const LX = LE + 2, VX = ML + TW - 2;
  let ty = SY;

  const totRows: [string, string, boolean][] = [
    ['PAYMENT METHOD', data.paymentMethod.toUpperCase(), false],
    ['PAYMENT STATUS', 'PAID', true],
  ];
  set(7);
  for (const [lbl, val, bold] of totRows) {
    vl(LE, ty, ty + TRH); vl(ML + TW, ty, ty + TRH);
    doc.text(lbl, LX, ty + 3.8);
    set(7, bold); doc.text(val, VX, ty + 3.8, { align: 'right' });
    set(7);
    hl(ty + TRH, LE, ML + TW);
    ty += TRH;
  }
  vl(LE, SY, ty);

  // bottom row: T&C | signatory | grand total
  const BW = TW / 3;
  const B2 = ML + BW, B3 = ML + BW * 2;
  const BY = Math.max(SY + SUMMARY_H, ty);
  hl(BY);
  vl(B2, BY, BY + BOT_H); vl(B3, BY, BY + BOT_H);
  hl(BY + BOT_H);

  set(5.5, true); doc.text('Terms & Conditions', ML + 2, BY + 5);
  set(5.5);
  doc.text('Lab results are confidential.', ML + 2, BY + 11, { maxWidth: BW - 4 });
  doc.text('Payment is non-refundable.', ML + 2, BY + 17, { maxWidth: BW - 4 });

  const sigCX = B2 + BW / 2;
  set(7, true); doc.text('For ' + C.name, sigCX, BY + 5, { align: 'center' });
  set(7);       doc.text('Authorised Signatory', sigCX, BY + 22, { align: 'center' });

  const gtCX = B3 + BW / 2;
  set(9, true);  doc.text('Grand Total', gtCX, BY + 9,  { align: 'center' });
  set(11, true); doc.text(rupee(data.totalAmount), gtCX, BY + 18, { align: 'center' });

  set(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text('Computer Generated Receipt', PW / 2, PH - 1.5, { align: 'center' });

  return doc;
}
