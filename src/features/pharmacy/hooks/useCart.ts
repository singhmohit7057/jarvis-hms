// #must: Zustand store for POS cart with persist middleware for session survival
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Medicine, MedicineBatch, CartItem, GSTBreakdown } from '@/types';
import type { GSTPercentage } from '@/types';
import { calculateGST, calculateCartGST } from '@/lib/gst';

interface CartCustomer {
  patientId?: string;
  name: string;
  phone: string;
}

interface CartDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

interface CartStore {
  items: CartItem[];
  customer: CartCustomer | null;
  discount: CartDiscount;
  paymentMethod: 'cash' | 'upi' | 'card';
  paidAmount: number;

  // Computed selectors
  getSubtotal: () => number;
  getGSTBreakdown: () => GSTBreakdown[];
  getGSTTotal: () => number;
  getDiscountAmount: () => number;
  getGrandTotal: () => number;
  getChangeAmount: () => number;

  // Actions
  addItem: (medicine: Medicine, batch: MedicineBatch) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCustomer: (customer: CartCustomer | null) => void;
  setDiscount: (discount: CartDiscount) => void;
  setPaymentMethod: (method: 'cash' | 'upi' | 'card') => void;
  setPaidAmount: (amount: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      discount: { type: 'fixed', value: 0 },
      paymentMethod: 'cash',
      paidAmount: 0,

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },

      getGSTBreakdown: () => {
        const { items } = get();
        if (items.length === 0) return [];
        const result = calculateCartGST(items);
        return result.gstBreakdown;
      },

      getGSTTotal: () => {
        const { items } = get();
        if (items.length === 0) return 0;
        const result = calculateCartGST(items);
        return result.gstTotal;
      },

      getDiscountAmount: () => {
        const { discount } = get();
        const subtotal = get().getSubtotal();
        const gstTotal = get().getGSTTotal();
        const totalBeforeDiscount = subtotal + gstTotal;

        if (discount.type === 'percentage') {
          return Math.round((totalBeforeDiscount * discount.value) / 100 * 100) / 100;
        }
        return Math.min(discount.value, totalBeforeDiscount);
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const gstTotal = get().getGSTTotal();
        const discountAmount = get().getDiscountAmount();
        return Math.round((subtotal + gstTotal - discountAmount) * 100) / 100;
      },

      getChangeAmount: () => {
        const { paidAmount } = get();
        const grandTotal = get().getGrandTotal();
        const change = paidAmount - grandTotal;
        return change > 0 ? Math.round(change * 100) / 100 : 0;
      },

      addItem: (medicine: Medicine, batch: MedicineBatch) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.medicineId === medicine.id && item.batchId === batch.id
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            const existing = updated[existingIndex];
            const newQty = existing.quantity + 1;

            if (newQty > batch.quantityInStock) return state;

            const gstResult = calculateGST(batch.sellingPrice * newQty, medicine.gstPercentage);

            updated[existingIndex] = {
              ...existing,
              quantity: newQty,
              gstAmount: gstResult.totalGst,
              totalPrice: gstResult.totalWithGst,
            };

            return { items: updated };
          }

          if (batch.quantityInStock < 1) return state;

          const gstResult = calculateGST(batch.sellingPrice, medicine.gstPercentage);

          const newItem: CartItem = {
            id: `${medicine.id}-${batch.id}-${Date.now()}`,
            medicineId: medicine.id,
            batchId: batch.id,
            medicineName: medicine.name,
            batchNumber: batch.batchNumber,
            quantity: 1,
            unitPrice: batch.sellingPrice,
            gstPercentage: medicine.gstPercentage as GSTPercentage,
            hsnCode: medicine.hsnCode,
            gstAmount: gstResult.totalGst,
            totalPrice: gstResult.totalWithGst,
            maxStock: batch.quantityInStock,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity < 1) return;

        const item = get().items.find((i) => i.id === itemId);
        if (item && quantity > item.maxStock) return;

        set((state) => {
          const updated = state.items.map((item) => {
            if (item.id !== itemId) return item;

            const gstResult = calculateGST(item.unitPrice * quantity, item.gstPercentage);

            return {
              ...item,
              quantity,
              gstAmount: gstResult.totalGst,
              totalPrice: gstResult.totalWithGst,
            };
          });

          return { items: updated };
        });
      },

      setCustomer: (customer: CartCustomer | null) => {
        set({ customer });
      },

      setDiscount: (discount: CartDiscount) => {
        set({ discount });
      },

      setPaymentMethod: (method: 'cash' | 'upi' | 'card') => {
        set({ paymentMethod: method });
      },

      setPaidAmount: (amount: number) => {
        set({ paidAmount: amount });
      },

      clearCart: () => {
        set({
          items: [],
          customer: null,
          discount: { type: 'fixed', value: 0 },
          paymentMethod: 'cash',
          paidAmount: 0,
        });
      },
    }),
    {
      name: 'jarvis-pharmacy-cart',
      partialize: (state) => ({
        items: state.items,
        customer: state.customer,
        discount: state.discount,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);
