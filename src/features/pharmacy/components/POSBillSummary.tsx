
import { useState, useMemo } from 'react';
import { Percent, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { calculateCartGST } from '@/lib/gst';
import { cn } from '@/lib/utils';
import { useCart } from '../hooks/useCart';

export function POSBillSummary() {
  const items = useCart((s) => s.items);
  const discount = useCart((s) => s.discount);
  const setDiscount = useCart((s) => s.setDiscount);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );

  const { gstTotal } = useMemo(
    () => items.length > 0 ? calculateCartGST(items) : { gstBreakdown: [], gstTotal: 0 },
    [items]
  );

  const discountAmount = useMemo(() => {
    if (discount.type === 'percentage') {
      return Math.round(subtotal * discount.value / 100 * 100) / 100;
    }
    return Math.min(discount.value, subtotal + gstTotal);
  }, [subtotal, gstTotal, discount]);

  const exactTotal = useMemo(
    () => subtotal - discountAmount,
    [subtotal, discountAmount]
  );

  const grandTotal = useMemo(() => Math.round(exactTotal), [exactTotal]);

  const roundOff = useMemo(() => grandTotal - exactTotal, [grandTotal, exactTotal]);

  const [showDiscount, setShowDiscount] = useState(discount.value > 0);

  return (
    <div className="space-y-2 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
      </div>

      {/* Discount */}
      <div className="py-2 border-t border-gray-100 dark:border-slate-700">
        {!showDiscount ? (
          <button
            onClick={() => setShowDiscount(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add Discount
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                <button
                  onClick={() => setDiscount({ ...discount, type: 'percentage' })}
                  className={cn(
                    'p-2 text-xs transition-colors',
                    discount.type === 'percentage'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                  )}
                >
                  <Percent className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDiscount({ ...discount, type: 'fixed' })}
                  className={cn(
                    'p-2 text-xs transition-colors',
                    discount.type === 'fixed'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                  )}
                >
                  <IndianRupee className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount.value || ''}
                onChange={(e) =>
                  setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })
                }
                placeholder={discount.type === 'percentage' ? '0%' : '0.00'}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">
                  Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Round Off */}
      {roundOff !== 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Round Off</span>
          <span className="text-gray-500 dark:text-gray-400">
            {roundOff > 0 ? '+' : ''}{formatCurrency(roundOff)}
          </span>
        </div>
      )}

      {/* Grand Total */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200 dark:border-slate-600">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Grand Total</span>
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
}
