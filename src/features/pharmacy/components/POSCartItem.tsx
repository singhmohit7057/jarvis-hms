
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import type { CartItem } from '@/types';

interface POSCartItemProps {
  item: CartItem;
  maxStock: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function POSCartItem({ item, maxStock, onUpdateQuantity, onRemove }: POSCartItemProps) {
  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < maxStock) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const ps = Math.max(item.packSize ?? 1, 1);
  const showPieceBreakdown = item.looseSell && ps > 1;
  const strips = showPieceBreakdown ? Math.floor(item.quantity / ps) : null;
  const remainder = showPieceBreakdown ? item.quantity % ps : null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700/50">
      {/* Medicine Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {item.medicineName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {item.batchNumber}
          </span>
          {showPieceBreakdown && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {strips! > 0 && remainder! > 0
                ? `${strips} strip + ${remainder} pc`
                : strips! > 0
                ? `${strips} strip${strips! > 1 ? 's' : ''}`
                : `${remainder} pc`}
            </span>
          )}
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDecrement}
          disabled={item.quantity <= 1}
          className="p-1 rounded-md bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-500 transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
          {item.quantity}
        </span>
        <button
          onClick={handleIncrement}
          disabled={item.quantity >= maxStock}
          className="p-1 rounded-md bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Price */}
      <div className="text-right min-w-[80px]">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(item.unitPrice * item.quantity)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatCurrency(item.unitPrice)}/{item.looseSell ? 'pc' : 'unit'} × {item.quantity}
        </p>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
