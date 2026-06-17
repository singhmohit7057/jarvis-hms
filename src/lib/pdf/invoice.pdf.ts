
import { jsPDF } from 'jspdf';
import type { Sale, SaleItem } from '@/types';
import { calculateCartGST } from '@/lib/gst';
import { CLINIC_INFO } from '@/config/constants';
import { supabase } from '@/lib/supabase';
import { numberToWords } from './shared.pdf';

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export async function fetchClinicSettings(): Promise<ClinicSettings> {
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

// jsPDF's built-in Helvetica cannot render the ₹ glyph — use "Rs." prefix
function rupee(amount: number): string {
  return 'Rs.' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

// Format expiry date as MM/YY
function fmtExpiry(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

export function generateInvoicePDF(sale: Sale & { items: SaleItem[] }, clinic?: ClinicSettings): jsPDF {
  const C = clinic ?? { ...CLINIC_INFO };
  // Half A4 = 210mm wide × 148mm tall
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });

  const PH = 148;   // page height
  const PW = 210;   // page width
  const ML = 6;     // margin left/right
  const MT = 5;     // margin top
  const TW = PW - ML * 2;

  // ── draw helpers ────────────────────────────────────────────────────────────
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

  // ── TAX INVOICE banner ─────────────────────────────────────────────────────
  const BANNER_H = 7;
  grayFill(ML, y, TW, BANNER_H);
  set(11, true);
  doc.text('TAX INVOICE', PW / 2, y + 4.8, { align: 'center' });
  hl(y + BANNER_H);
  y += BANNER_H;

  // ── header: left=clinic | right=invoice+patient ────────────────────────────
  const HDR_H = 33;
  const MID = ML + TW / 2;
  vl(MID, y, y + HDR_H);

  // left — clinic
  set(10, true);
  doc.text(C.name.toUpperCase(), ML + 2, y + 6);
  set(7);
  doc.text('Address : ' + C.address, ML + 2, y + 12);
  doc.text('Phone   : ' + C.phone, ML + 2, y + 18);
  doc.text('Email   : ' + C.email, ML + 2, y + 23);
  if (C.gstNumber) doc.text('GSTIN   : ' + C.gstNumber, ML + 2, y + 30);

  // right — meta + patient
  const RX = MID + 2;
  const RR = ML + TW - 2;
  const invDate = new Date(sale.createdAt);
  const dateStr = invDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = invDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Invoice meta rows — label left, value right
  const metaLabelX = RX;
  const metaValX   = RR;
  set(7);
  doc.text('Inv No', metaLabelX, y + 6);
  set(7, true); doc.text(sale.invoiceNumber, metaValX, y + 6, { align: 'right' });
  set(7);
  doc.text('Date',  metaLabelX, y + 11); doc.text(dateStr, metaValX, y + 11, { align: 'right' });
  doc.text('Time',  metaLabelX, y + 16); doc.text(timeStr, metaValX, y + 16, { align: 'right' });

  // Patient name — label + value on same line, left-aligned
  set(7, true);
  doc.text('PATIENT NAME:', RX, y + 22);
  set(7);
  doc.text((sale.customerName || 'Walk-in').toUpperCase(), RX + 24, y + 22);

  // Mobile + Doctor on next line
  const infoY = y + 27;
  if (sale.customerPhone) {
    doc.text('Mobile: ' + sale.customerPhone, RX, infoY);
  }
  if (sale.doctorName) {
    set(7, true);
    doc.text('Doctor Name :', RX, infoY + (sale.customerPhone ? 5 : 0));
    set(7);
    doc.text(sale.doctorName.toUpperCase(), RX + 24, infoY + (sale.customerPhone ? 5 : 0));
  }

  y += HDR_H;
  hl(y);

  // ── items table ────────────────────────────────────────────────────────────
  // col widths as % of TW — total = 1.0
  const C_PCT = [0.04, 0.20, 0.05, 0.07, 0.08, 0.06, 0.08, 0.06, 0.06, 0.05, 0.09, 0.09] as const;
  const C_LBL = ['Qty','Item Description','MFG','HSN','Batch','Exp.','MRP','SGST','CGST','Dis%','Amount','Net Amt'];
  const cW = C_PCT.map(p => p * TW);
  const cX: number[] = [];
  { let x = ML; for (const w of cW) { cX.push(x); x += w; } cX.push(ML + TW); }

  const THH = 5.5;
  const RH  = 5.5;

  grayFill(ML, y, TW, THH);
  set(5.5, true);
  for (let i = 0; i < C_LBL.length; i++) {
    vl(cX[i], y, y + THH);
    doc.text(C_LBL[i], cX[i] + 0.8, y + 3.8, { maxWidth: cW[i] - 1 });
  }
  vl(cX[C_LBL.length], y, y + THH);
  hl(y + THH);
  y += THH;

  set(6);
  for (const item of sale.items) {
    if (y + RH > PH - MT - 2) {
      doc.addPage();
      outerBox();
      y = MT + 2;
    }
    const mrpTotal  = item.unitPrice * item.quantity;
    // GST is included in MRP — extract from MRP
    const divisor   = 1 + item.gstPercentage / 100;
    const taxable   = mrpTotal / divisor;
    const gstAmt    = mrpTotal - taxable;        // total GST in this line
    const sgst      = gstAmt / 2;
    const cgst      = gstAmt / 2;
    // discount share proportional to this item's MRP weight
    const discShare = sale.subtotal > 0 ? (mrpTotal / sale.subtotal) * sale.discountAmount : 0;
    const netAmt    = Math.round((mrpTotal - discShare) * 100) / 100;
    const discPct   = sale.discountType === 'percentage' && sale.discountValue > 0
      ? String(sale.discountValue) : '0';

    const vals = [
      String(item.quantity),
      item.medicineName,
      '—',
      item.hsnCode || '—',
      item.batchNumber || '—',
      fmtExpiry(item.expiryDate),
      mrpTotal.toFixed(2),
      sgst.toFixed(2),
      cgst.toFixed(2),
      discPct,
      netAmt.toFixed(2),
      netAmt.toFixed(2),
    ];

    for (let i = 0; i < vals.length; i++) {
      vl(cX[i], y, y + RH);
      const isNum = i >= 6;
      if (isNum) doc.text(vals[i], cX[i + 1] - 0.8, y + 3.8, { align: 'right' });
      else       doc.text(vals[i], cX[i] + 0.8, y + 3.8, { maxWidth: cW[i] - 1.5 });
    }
    vl(cX[vals.length], y, y + RH);
    hl(y + RH);
    y += RH;
  }

  // ── summary section — pinned to bottom of page ────────────────────────────
  // GRH(5) × (header + 2 slabs + total) = 20, words ≈ 7, right panel 4×5.5 = 22 → sumH ≈ 27
  const SUMMARY_H = 27;
  const BOT_H_CALC = 26;
  const SY = Math.max(y, PH - MT - BOT_H_CALC - SUMMARY_H);
  // draw a light dashed separator line between items and summary if there's a gap
  if (SY > y + 1) hl(SY, ML, ML + TW);
  const LW = TW * 0.56;
  const LE = ML + LW;
  const RE = ML + TW;

  // ── GST class table (left) ─────────────────────────────────────────────────
  const G_PCT = [0.19, 0.18, 0.18, 0.11, 0.11, 0.18] as const;
  const G_LBL = ['CLASS','SUB TOTAL','DISCOUNT','CGST','SGST','TOTAL'];
  const gW = G_PCT.map(p => p * LW);
  const gX: number[] = [];
  { let x = ML; for (const w of gW) { gX.push(x); x += w; } gX.push(LE); }
  const GRH = 5;

  grayFill(ML, SY, LW, GRH);
  set(5.5, true);
  for (let i = 0; i < G_LBL.length; i++) {
    vl(gX[i], SY, SY + GRH);
    doc.text(G_LBL[i], gX[i] + 0.8, SY + 3.5);
  }
  vl(gX[G_LBL.length], SY, SY + GRH);
  hl(SY + GRH, ML, LE);

  let gy = SY + GRH;
  set(6);

  const cartForGST = sale.items.map(it => ({
    id: it.id, medicineId: it.medicineId, batchId: it.batchId,
    medicineName: it.medicineName, batchNumber: it.batchNumber,
    quantity: it.quantity, unitPrice: it.unitPrice,
    gstPercentage: it.gstPercentage, hsnCode: it.hsnCode,
    gstAmount: it.gstAmount, totalPrice: it.totalPrice, maxStock: 0,
    packSize: 1, looseSell: false, expiryDate: it.expiryDate,
  }));
  const { gstBreakdown } = calculateCartGST(cartForGST);
  const slabs = [...gstBreakdown];
  while (slabs.length < 2) slabs.push(null as never);

  for (const slab of slabs) {
    for (let i = 0; i < gX.length - 1; i++) {
      vl(gX[i], gy, gy + GRH);
      if (slab) {
        const v = [
          `GST ${slab.percentage}%`,
          slab.taxableAmount.toFixed(2),
          sale.discountAmount > 0 ? sale.discountAmount.toFixed(2) : '',
          slab.cgst.toFixed(2),
          slab.sgst.toFixed(2),
          slab.totalGst.toFixed(2),
        ];
        if (i > 0) doc.text(v[i], gX[i + 1] - 0.8, gy + 3.5, { align: 'right' });
        else       doc.text(v[i], gX[i] + 0.8, gy + 3.5);
      }
    }
    vl(gX[gX.length - 1], gy, gy + GRH);
    hl(gy + GRH, ML, LE);
    gy += GRH;
  }

  // TOTAL row
  set(6, true);
  const totTax  = gstBreakdown.reduce((s, r) => s + r.taxableAmount, 0);
  const totCgst = gstBreakdown.reduce((s, r) => s + r.cgst, 0);
  const totSgst = gstBreakdown.reduce((s, r) => s + r.sgst, 0);
  const totGst  = gstBreakdown.reduce((s, r) => s + r.totalGst, 0);
  const totDisc = sale.discountAmount;
  const totV    = ['TOTAL', totTax.toFixed(2), totDisc.toFixed(2), totCgst.toFixed(2), totSgst.toFixed(2), totGst.toFixed(2)];
  for (let i = 0; i < gX.length - 1; i++) {
    vl(gX[i], gy, gy + GRH);
    if (i > 0) doc.text(totV[i], gX[i + 1] - 0.8, gy + 3.5, { align: 'right' });
    else       doc.text(totV[i], gX[i] + 0.8, gy + 3.5);
  }
  vl(gX[gX.length - 1], gy, gy + GRH);
  hl(gy + GRH, ML, LE);
  gy += GRH;

  // Amount in words
  doc.setTextColor(0, 0, 0); set(6); doc.setFont('helvetica', 'italic');
  const wordLines = doc.splitTextToSize('Rs. ' + numberToWords(sale.grandTotal), LW - 4);
  doc.text(wordLines, ML + 1.5, gy + 3.5);
  const wordH = Math.max(wordLines.length * 4 + 2, 7);
  hl(gy + wordH, ML, LE);
  gy += wordH;

  const termsEnd = gy;

  // ── totals box (right) ─────────────────────────────────────────────────────
  const TRH = 5.5;
  const LX  = LE + 2;
  const VX  = RE - 2;
  let ty = SY;

  // GST is included in MRP — grand total = subtotal - discount, rounded to nearest rupee
  const exactTotal = sale.subtotal - sale.discountAmount;
  const roundOff   = sale.grandTotal - exactTotal;
  const roundStr   = roundOff === 0 ? 'Rs.0.00'
    : (roundOff > 0 ? '+' : '-') + 'Rs.' + Math.abs(roundOff).toFixed(2);

  const totRows: [string, string][] = [
    ['MRP TOTAL',     rupee(sale.subtotal)],
    ['LESS DISCOUNT', sale.discountAmount > 0 ? '-' + rupee(sale.discountAmount) : 'Rs.0.00'],
    ['GST (incl.)',   rupee(sale.gstTotal)],
    ['ROUND OFF',     roundStr],
  ];

  const payStr = sale.paymentMethod === 'cash'
    ? 'Cash: ' + rupee(sale.paidAmount) + '  Change: ' + rupee(sale.changeAmount)
    : 'Paid via ' + sale.paymentMethod.toUpperCase();

  const allTotRows: [string, string][] = [
    ...totRows,
    ['PAYMENT', payStr],
  ];

  set(7);
  for (const [lbl, val] of allTotRows) {
    vl(LE, ty, ty + TRH);
    vl(RE, ty, ty + TRH);
    doc.text(lbl, LX, ty + 3.8);
    doc.text(val, VX, ty + 3.8, { align: 'right' });
    hl(ty + TRH, LE, RE);
    ty += TRH;
  }

  // Left-right divider full height
  const sumEnd = Math.max(termsEnd, ty);
  vl(LE, SY, sumEnd);
  hl(sumEnd, ML, ML + TW);

  // ── Bottom row: T&C | Authorised Signatory | Grand Total ──────────────────
  const BOT_H = BOT_H_CALC;
  const BW    = TW / 3;
  const B1    = ML;          // T&C column
  const B2    = ML + BW;     // Sign column
  const B3    = ML + BW * 2; // Grand Total column
  const BY    = sumEnd;

  // column dividers
  vl(B2, BY, BY + BOT_H);
  vl(B3, BY, BY + BOT_H);
  hl(BY + BOT_H);

  // T&C
  set(5.5, true); doc.setTextColor(0, 0, 0);
  doc.text('Terms & Conditions', B1 + 2, BY + 5);
  set(5.5); doc.setTextColor(0, 0, 0);
  doc.text('Medicine return within a week with proper bill.', B1 + 2, BY + 11, { maxWidth: BW - 4 });
  doc.text('All disputes subject to local jurisdiction only.', B1 + 2, BY + 17, { maxWidth: BW - 4 });

  // Signatory
  const sigCX = B2 + BW / 2;
  set(7, true);
  doc.text('For ' + C.name, sigCX, BY + 5, { align: 'center' });
  set(7);
  doc.text('Authorised Signatory', sigCX, BY + 22, { align: 'center' });

  // Grand Total
  const gtCX = B3 + BW / 2;
  set(9, true);
  doc.text('Grand Total', gtCX, BY + 9, { align: 'center' });
  set(11, true);
  doc.text(rupee(sale.grandTotal), gtCX, BY + 18, { align: 'center' });

  // Footer — below the outer box
  set(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Computer Generated Invoice', PW / 2, PH - 1.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return doc;
}
