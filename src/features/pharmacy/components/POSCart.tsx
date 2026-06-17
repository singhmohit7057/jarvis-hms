
import { useState } from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '../hooks/useCart';
import { POSCartItem } from './POSCartItem';
import { POSBillSummary } from './POSBillSummary';
import { POSPaymentModal } from './POSPaymentModal';
import { generateInvoicePDF, fetchClinicSettings } from '@/lib/pdf/invoice.pdf';
import { calculateCartGST } from '@/lib/gst';

export function POSCart() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const items = useCart((s) => s.items);
  const customer = useCart((s) => s.customer);
  const discount = useCart((s) => s.discount);
  const setCustomer = useCart((s) => s.setCustomer);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const handlePreviewInvoice = async () => {
    setIsPreviewing(true);
    try {
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const { gstTotal } = items.length > 0 ? calculateCartGST(items) : { gstTotal: 0 };
      const discountAmount = discount.type === 'percentage'
        ? Math.round(subtotal * discount.value / 100 * 100) / 100
        : Math.min(discount.value, subtotal);
      const grandTotal = Math.round(subtotal - discountAmount);

      const draftSale = {
        id: 'preview',
        invoiceNumber: 'PREVIEW',
        patientId: customer?.patientId,
        customerName: customer?.name ?? 'Walk-in',
        customerPhone: customer?.phone ?? '',
        doctorName: customer?.doctorName ?? '',
        items: items.map((item, idx) => ({
          id: `item-${idx}`,
          saleId: 'preview',
          medicineId: item.medicineId,
          batchId: item.batchId,
          medicineName: item.medicineName,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstPercentage: item.gstPercentage,
          gstAmount: item.gstAmount,
          totalPrice: item.totalPrice,
          hsnCode: item.hsnCode,
          maxStock: 0,
        })),
        subtotal,
        discountType: discount.type,
        discountValue: discount.value,
        discountAmount,
        gstTotal,
        grandTotal,
        paymentMethod: 'cash' as const,
        paidAmount: grandTotal,
        changeAmount: 0,
        billedBy: 'Staff',
        createdAt: new Date().toISOString(),
      };

      const clinic = await fetchClinicSettings();
      const pdf = generateInvoicePDF(draftSale, clinic);
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      // silent — preview is non-critical
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Customer Section */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            placeholder="Patient Name"
            value={customer?.name ?? ''}
            onChange={(e) =>
              setCustomer({ name: e.target.value, phone: customer?.phone ?? '', doctorName: customer?.doctorName ?? '' })
            }
            className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Contact (optional)"
            value={customer?.phone ?? ''}
            onChange={(e) =>
              setCustomer({ name: customer?.name ?? '', phone: e.target.value, doctorName: customer?.doctorName ?? '' })
            }
            maxLength={10}
            className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Doctor Name"
            value={customer?.doctorName ?? ''}
            onChange={(e) =>
              setCustomer({ name: customer?.name ?? '', phone: customer?.phone ?? '', doctorName: e.target.value })
            }
            className="col-span-2 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
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
        <div className="px-3 py-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
          <POSBillSummary />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePreviewInvoice}
              isLoading={isPreviewing}
              leftIcon={<Eye className="h-4 w-4" />}
              className="flex-1"
            >
              Preview
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsPaymentOpen(true)}
              disabled={items.length === 0}
              className="flex-2"
            >
              Proceed to Pay
            </Button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <POSPaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </div>
  );
}
