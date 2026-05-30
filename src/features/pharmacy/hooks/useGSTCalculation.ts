// #must: Reactive hook that computes GST breakdown for given cart items
import { useMemo } from 'react';
import type { CartItem, GSTBreakdown } from '@/types';
import { calculateCartGST } from '@/lib/gst';

interface GSTCalculationResult {
  subtotal: number;
  gstBreakdown: GSTBreakdown[];
  gstTotal: number;
  grandTotal: number;
}

export function useGSTCalculation(items: CartItem[]): GSTCalculationResult {
  return useMemo(() => {
    if (items.length === 0) {
      return {
        subtotal: 0,
        gstBreakdown: [],
        gstTotal: 0,
        grandTotal: 0,
      };
    }

    const result = calculateCartGST(items);

    return {
      subtotal: result.subtotal,
      gstBreakdown: result.gstBreakdown,
      gstTotal: result.gstTotal,
      grandTotal: result.grandTotal,
    };
  }, [items]);
}
