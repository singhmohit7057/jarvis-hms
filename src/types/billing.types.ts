// #must: Billing and invoice type definitions

import type { Sale } from './pharmacy.types';
import type { PAYMENT_METHODS } from '@/config/constants';

export type BillingPaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ServiceType = 'consultation' | 'lab' | 'medicine';

export interface Invoice extends Sale {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicGst: string;
  generatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNo: string;
  patientId?: string;
  customerName: string;
  serviceType: ServiceType;
  serviceDetails: string;
  amount: number;
  paymentMethod: BillingPaymentMethod;
  receivedBy: string;
  createdAt: string;
}
