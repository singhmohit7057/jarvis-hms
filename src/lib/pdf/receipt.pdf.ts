
import { jsPDF } from 'jspdf';
import { CLINIC_INFO } from '@/config/constants';
import { supabase } from '@/lib/supabase';

// jsPDF built-in helvetica cannot render ₹ — use Rs.
function rupee(amount: number): string {
  return 'Rs.' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

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

interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export async function fetchReceiptClinic(): Promise<ClinicInfo> {
  const { data } = await supabase
    .from('clinic_settings')
    .select('clinic_name, address, phone, email, gst_number')
    .limit(1)
    .maybeSingle();
  if (data) {
    return {
      name:      data.clinic_name ?? CLINIC_INFO.name,
      address:   data.address     ?? CLINIC_INFO.address,
      phone:     data.phone       ?? CLINIC_INFO.phone,
      email:     data.email       ?? CLINIC_INFO.email,
      gstNumber: data.gst_number  ?? CLINIC_INFO.gstNumber,
    };
  }
  return { ...CLINIC_INFO };
}

export function generateReceiptPDF(data: ReceiptData, clinic?: ClinicInfo): jsPDF {
  const C = clinic ?? { ...CLINIC_INFO };

  // A5 landscape — same as invoice
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
  const PH = 148;
  const PW = 210;
  const ML = 6;
  const MT = 5;
  const TW = PW - ML * 2;

  // ── helpers ────────────────────────────────────────────────────────────────
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
    doc.setFillColor(230, 230, 230);
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, 'FD');
    doc.setFillColor(255, 255, 255);
  };
  const outerBox = () => {
    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.rect(ML, MT, TW, PH - MT * 2, 'S');
  };

  outerBox();
  let y = MT;

  // ── PAYMENT RECEIPT banner ─────────────────────────────────────────────────
  const BANNER_H = 7;
  grayFill(ML, y, TW, BANNER_H);
  set(11, true);
  doc.text('PAYMENT RECEIPT', PW / 2, y + 4.8, { align: 'center' });
  hl(y + BANNER_H);
  y += BANNER_H;

  // ── header: left = clinic | right = receipt meta + patient ────────────────
  const HDR_H = 30;
  const MID = ML + TW / 2;
  vl(MID, y, y + HDR_H);

  // left — clinic
  set(10, true);
  doc.text(C.name.toUpperCase(), ML + 2, y + 6);
  set(7);
  doc.text('Address : ' + C.address, ML + 2, y + 12);
  doc.text('Phone   : ' + C.phone,   ML + 2, y + 17);
  doc.text('Email   : ' + C.email,   ML + 2, y + 22);
  if (C.gstNumber) doc.text('GSTIN   : ' + C.gstNumber, ML + 2, y + 27);

  // right — receipt meta + patient
  const RX = MID + 2;
  const RR = ML + TW - 2;
  set(7);
  doc.text('Receipt No', RX, y + 6);
  set(7, true); doc.text(data.receiptNo, RR, y + 6, { align: 'right' });
  set(7);
  doc.text('Date', RX, y + 11); doc.text(fmtDate(data.date), RR, y + 11, { align: 'right' });
  doc.text('Time', RX, y + 16); doc.text(fmtTime(data.date), RR, y + 16, { align: 'right' });

  set(7, true);
  doc.text('PATIENT NAME:', RX, y + 22);
  set(7);
  doc.text(data.patientName.toUpperCase(), RX + 24, y + 22);
  if (data.patientPhone) {
    doc.text('Mobile: ' + data.patientPhone, RX, y + 27);
  }

  y += HDR_H;
  hl(y);

  // ── service table ──────────────────────────────────────────────────────────
  // cols: Service Type | Details / Description | Amount | Payment Method
  const C_PCT  = [0.18, 0.42, 0.22, 0.18] as const;
  const C_LBL  = ['Service', 'Details', 'Amount', 'Payment Method'];
  const cW = C_PCT.map(p => p * TW);
  const cX: number[] = [];
  { let x = ML; for (const w of cW) { cX.push(x); x += w; } cX.push(ML + TW); }

  const THH = 5.5;
  const RH  = 6.5;

  grayFill(ML, y, TW, THH);
  set(5.5, true);
  for (let i = 0; i < C_LBL.length; i++) {
    vl(cX[i], y, y + THH);
    doc.text(C_LBL[i], cX[i] + 0.8, y + 3.8);
  }
  vl(cX[C_LBL.length], y, y + THH);
  hl(y + THH);
  y += THH;

  // single data row
  set(6);
  const rowVals = [data.serviceType, data.serviceDetails, rupee(data.amount), data.paymentMethod.toUpperCase()];
  for (let i = 0; i < rowVals.length; i++) {
    vl(cX[i], y, y + RH);
    doc.text(rowVals[i], cX[i] + 0.8, y + 4, { maxWidth: cW[i] - 1.5 });
  }
  vl(cX[rowVals.length], y, y + RH);
  hl(y + RH);
  y += RH;

  // ── summary section — pinned to bottom ────────────────────────────────────
  const SUMMARY_H = 22;
  const BOT_H     = 24;
  const SY = Math.max(y + 2, PH - MT - BOT_H - SUMMARY_H);

  if (SY > y + 1) hl(SY);

  // left: received by + terms
  const LW = TW * 0.56;
  const LE = ML + LW;

  set(7);
  doc.text('Received By : ' + data.receivedBy, ML + 2, SY + 5);

  // right: amount box
  const TRH = 5.5;
  const LX  = LE + 2;
  const VX  = ML + TW - 2;
  let ty = SY;

  const totRows: [string, string][] = [
    ['SERVICE AMOUNT', rupee(data.amount)],
    ['PAYMENT METHOD', data.paymentMethod.toUpperCase()],
    ['PAYMENT STATUS', 'PAID'],
  ];

  set(7);
  for (const [lbl, val] of totRows) {
    vl(LE, ty, ty + TRH);
    vl(ML + TW, ty, ty + TRH);
    doc.text(lbl, LX, ty + 3.8);
    set(7, false); doc.text(val, VX, ty + 3.8, { align: 'right' });
    hl(ty + TRH, LE, ML + TW);
    ty += TRH;
  }

  const sumEnd = Math.max(SY + SUMMARY_H, ty);
  vl(LE, SY, sumEnd);
  hl(sumEnd, ML, ML + TW);

  // ── bottom row: T&C | Authorised Signatory | Grand Total ──────────────────
  const BW = TW / 3;
  const B2 = ML + BW;
  const B3 = ML + BW * 2;
  const BY = sumEnd;

  vl(B2, BY, BY + BOT_H);
  vl(B3, BY, BY + BOT_H);
  hl(BY + BOT_H);

  // T&C
  set(5.5, true); doc.text('Terms & Conditions', ML + 2, BY + 5);
  set(5.5);
  doc.text('Payment is non-refundable once processed.', ML + 2, BY + 11, { maxWidth: BW - 4 });
  doc.text('All disputes subject to local jurisdiction only.', ML + 2, BY + 17, { maxWidth: BW - 4 });

  // Signatory
  const sigCX = B2 + BW / 2;
  set(7, true); doc.text('For ' + C.name, sigCX, BY + 5, { align: 'center' });
  set(7);       doc.text('Authorised Signatory', sigCX, BY + 22, { align: 'center' });

  // Grand Total
  const gtCX = B3 + BW / 2;
  set(9, true);  doc.text('Grand Total', gtCX, BY + 9,  { align: 'center' });
  set(11, true); doc.text(rupee(data.amount), gtCX, BY + 18, { align: 'center' });

  // footer
  set(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text('Computer Generated Receipt', PW / 2, PH - 1.5, { align: 'center' });

  return doc;
}
