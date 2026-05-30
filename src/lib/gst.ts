// #must: GST calculation utilities — CGST/SGST split for intra-state billing

import type { CartItem, GSTBreakdown } from '@/types/pharmacy.types';
import type { GSTPercentage } from '@/types/pharmacy.types';

export interface GSTResult {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  totalWithGst: number;
}

/**
 * Calculate GST for a given amount at a specific slab.
 * Splits into equal CGST and SGST (intra-state).
 */
export function calculateGST(amount: number, gstPercentage: number): GSTResult {
  const taxableAmount = amount;
  const totalGst = (taxableAmount * gstPercentage) / 100;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const totalWithGst = taxableAmount + totalGst;

  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    totalWithGst: Math.round(totalWithGst * 100) / 100,
  };
}

export interface CartGSTResult {
  subtotal: number;
  gstBreakdown: GSTBreakdown[];
  gstTotal: number;
  grandTotal: number;
}

/**
 * Calculate aggregate GST for a cart of items, grouped by slab.
 */
export function calculateCartGST(items: CartItem[]): CartGSTResult {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const slabMap = new Map<GSTPercentage, number>();

  for (const item of items) {
    const taxable = item.unitPrice * item.quantity;
    const current = slabMap.get(item.gstPercentage) ?? 0;
    slabMap.set(item.gstPercentage, current + taxable);
  }

  const gstBreakdown: GSTBreakdown[] = [];
  let gstTotal = 0;

  for (const [percentage, taxableAmount] of slabMap.entries()) {
    const totalGst = (taxableAmount * percentage) / 100;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    gstBreakdown.push({
      percentage,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
    });

    gstTotal += totalGst;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gstBreakdown,
    gstTotal: Math.round(gstTotal * 100) / 100,
    grandTotal: Math.round((subtotal + gstTotal) * 100) / 100,
  };
}

/**
 * Get a human-readable GST slab label.
 * Example: "GST @5% (CGST 2.5% + SGST 2.5%)"
 */
export function getGSTSlabLabel(percentage: number): string {
  if (percentage === 0) return 'GST @0% (Exempt)';
  const half = percentage / 2;
  return `GST @${percentage}% (CGST ${half}% + SGST ${half}%)`;
}
