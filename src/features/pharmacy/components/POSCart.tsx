// #must: Right-side cart panel with customer section, items list, bill summary, and payment trigger
import { useState } from 'react';
import { ShoppingCart, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { useCart } from '../hooks/useCart';
import { POSCartItem } from './POSCartItem';
import { POSBillSummary } from './POSBillSummary';
import { POSPaymentModal } from './POSPaymentModal';

export function POSCart() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<'walkin' | 'existing'>('walkin');

  const items = useCart((s) => s.items);
  const customer = useCart((s) => s.customer);
  const setCustomer = useCart((s) => s.setCustomer);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  return (
    <div className="flex flex-col h-full">
      {/* Customer Section */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setCustomerMode('walkin')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              customerMode === 'walkin'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
            )}
          >
            <User className="h-3.5 w-3.5" />
            Walk-in
          </button>
          <button
            onClick={() => setCustomerMode('existing')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              customerMode === 'existing'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Existing Patient
          </button>
        </div>

        {customerMode === 'walkin' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Customer Name"
              value={customer?.name ?? ''}
              onChange={(e) =>
                setCustomer({ name: e.target.value, phone: customer?.phone ?? '' })
              }
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Phone (optional)"
              value={customer?.phone ?? ''}
              onChange={(e) =>
                setCustomer({ name: customer?.name ?? '', phone: e.target.value })
              }
              maxLength={10}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {customerMode === 'existing' && (
          <input
            type="text"
            placeholder="Search patient by name or phone..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            description="Search and add medicines from the left panel"
          />
        ) : (
          items.map((item) => (
            <POSCartItem
              key={item.id}
              item={item}
              maxStock={item.maxStock}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      {/* Bill Summary */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
          <POSBillSummary />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setIsPaymentOpen(true)}
            disabled={items.length === 0}
          >
            Proceed to Pay
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      <POSPaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </div>
  );
}
