import type { MEDICINE_CATEGORIES, PAYMENT_METHODS, GST_SLABS } from '@/config/constants';

export type MedicineCategory = (typeof MEDICINE_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type GSTPercentage = (typeof GST_SLABS)[number];

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  company: string;
  category: MedicineCategory;
  composition: string;
  hsnCode: string;
  gstPercentage: GSTPercentage;
  packSize: number;
  looseSell: boolean;
  reorderLevel: number;
  rackLocation: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  quantityInStock: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  medicineId: string;
  batchId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  packSize: number;
  looseSell: boolean;
  gstPercentage: GSTPercentage;
  hsnCode: string;
  expiryDate: string;
  gstAmount: number;
  totalPrice: number;
  maxStock: number;
}

export interface GSTBreakdown {
  percentage: GSTPercentage;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalGst: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  patientId?: string;
  customerName: string;
  customerPhone: string;
  doctorName?: string;
  items: SaleItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  billedBy: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  batchId: string;
  medicineName: string;
  hsnCode: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: GSTPercentage;
  gstAmount: number;
  totalPrice: number;
}
