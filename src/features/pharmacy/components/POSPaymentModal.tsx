
import { useState, useMemo } from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCart } from '../hooks/useCart';
import { generateInvoicePDF, fetchClinicSettings } from '@/lib/pdf/invoice.pdf';
import type { Sale, SaleItem } from '@/types';

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethods = [
  { id: 'cash' as const, label: 'Cash', icon: Banknote },
  { id: 'upi' as const, label: 'UPI', icon: Smartphone },
  { id: 'card' as const, label: 'Card', icon: CreditCard },
];

export function POSPaymentModal({ isOpen, onClose }: POSPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const user = useAuthStore((s) => s.user);

  const items = useCart((s) => s.items);
  const customer = useCart((s) => s.customer);
  const discount = useCart((s) => s.discount);
  const paymentMethod = useCart((s) => s.paymentMethod);
  const paidAmount = useCart((s) => s.paidAmount);
  const setPaymentMethod = useCart((s) => s.setPaymentMethod);
  const setPaidAmount = useCart((s) => s.setPaidAmount);
  const clearCart = useCart((s) => s.clearCart);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const gstTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.gstAmount, 0),
    [items]
  );
  const discountAmount = useMemo(() => {
    if (discount.type === 'percentage') {
      return Math.round(subtotal * discount.value / 100 * 100) / 100;
    }
    return Math.min(discount.value, subtotal + gstTotal);
  }, [subtotal, gstTotal, discount]);
  const grandTotal = useMemo(
    () => Math.round(subtotal - discountAmount),
    [subtotal, discountAmount]
  );
  const changeAmount = useMemo(
    () => paidAmount > grandTotal ? Math.round((paidAmount - grandTotal) * 100) / 100 : 0,
    [paidAmount, grandTotal]
  );

  const handleCompleteSale = async () => {
    if (paymentMethod === 'cash' && paidAmount < grandTotal) {
      toast.error('Paid amount cannot be less than the total');
      return;
    }

    setIsProcessing(true);
    try {
      // Generate invoice number — year + last-6 digits of ms timestamp + 4-char crypto random suffix
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(Date.now()).slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      // Build sale record
      const salePayload = {
        invoice_number: invoiceNumber,
        patient_id: customer?.patientId ?? null,
        customer_name: customer?.name || 'Walk-in Customer',
        customer_phone: customer?.phone || '',
        doctor_name: customer?.doctorName || '',
        subtotal,
        discount_type: discount.type,
        discount_value: discount.value,
        discount_amount: discountAmount,
        gst_total: gstTotal,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        paid_amount: paymentMethod === 'cash' ? paidAmount : grandTotal,
        change_amount: paymentMethod === 'cash' ? changeAmount : 0,
        billed_by: user?.id ?? '',
      };

      // Single atomic RPC: inserts sales row, sale_items rows, and decrements stock
      // inside one database transaction — all succeed or all roll back together.
      const saleItems = items.map((item) => ({
        medicine_id: item.medicineId,
        batch_id: item.batchId,
        medicine_name: item.medicineName,
        hsn_code: item.hsnCode,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        gst_percentage: item.gstPercentage,
        gst_amount: item.gstAmount,
        total_price: item.totalPrice,
      }));

      const { data: saleData, error: saleError } = await supabase.rpc('complete_sale', {
        p_sale: salePayload,
        p_items: saleItems,
      });

      if (saleError) throw saleError;

      // Log activity — user_name, entity_type, entity_id are NOT NULL in schema
      await supabase.from('activity_logs').insert({
        user_id: user?.id ?? '',
        user_name: user?.name ?? 'Staff',
        entity_type: 'sale',
        entity_id: saleData.id,
        action: 'SALE_COMPLETED',
        description: `Invoice ${invoiceNumber} - ${formatCurrency(grandTotal)}`,
        metadata: { sale_id: saleData.id, invoice_number: invoiceNumber },
      });

      // Generate PDF
      const sale: Sale & { items: SaleItem[] } = {
        id: saleData.id,
        invoiceNumber,
        patientId: customer?.patientId,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        doctorName: customer?.doctorName || '',
        items: items.map((item) => ({
          id: '',
          saleId: saleData.id,
          medicineId: item.medicineId,
          batchId: item.batchId,
          medicineName: item.medicineName,
          hsnCode: item.hsnCode,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstPercentage: item.gstPercentage,
          gstAmount: item.gstAmount,
          totalPrice: item.totalPrice,
        })),
        subtotal,
        discountType: discount.type,
        discountValue: discount.value,
        discountAmount,
        gstTotal,
        grandTotal,
        paymentMethod,
        paidAmount: paymentMethod === 'cash' ? paidAmount : grandTotal,
        changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
        billedBy: user?.name ?? 'Staff',
        createdAt: new Date().toISOString(),
      };

      try {
        const clinic = await fetchClinicSettings();
        const pdf = generateInvoicePDF(sale, clinic);
        pdf.save(`${invoiceNumber}.pdf`);
      } catch {
        // PDF generation is non-critical
        toast.warning('Sale completed but PDF generation failed');
      }

      // Clear cart and close
      clearCart();
      onClose();
      toast.success(`Sale completed! Invoice: ${invoiceNumber}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Failed to complete sale';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="md">
      <div className="space-y-3">
        {/* Grand Total Display */}
        <div className="text-center py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs text-blue-600 dark:text-blue-400">Amount to Pay</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(grandTotal)}
          </p>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setPaymentMethod(id);
                  if (id !== 'cash') setPaidAmount(grandTotal);
                }}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-all',
                  paymentMethod === id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                )}
              >
                <Icon className={cn('h-4 w-4', paymentMethod === id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')} />
                <span className={cn('text-sm font-medium', paymentMethod === id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300')}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Amount Input */}
        {paymentMethod === 'cash' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Amount Received
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount received"
              className="w-full px-3 py-2 text-base rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {paidAmount >= grandTotal && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                <span className="text-sm text-green-700 dark:text-green-300">Change to Return</span>
                <span className="text-base font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Complete Button */}
        <Button
          variant="success"
          size="md"
          fullWidth
          isLoading={isProcessing}
          disabled={paymentMethod === 'cash' && paidAmount < grandTotal}
          onClick={handleCompleteSale}
          leftIcon={<CheckCircle className="h-4 w-4" />}
        >
          Complete Sale
        </Button>
      </div>
    </Modal>
  );
}
