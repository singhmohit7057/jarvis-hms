// #must: Lab module type definitions — tests, bookings, reports

import type { LAB_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '@/config/constants';
import type { Patient } from './patient.types';

export type LabStatus = (typeof LAB_STATUS)[number];
export type LabPaymentStatus = (typeof PAYMENT_STATUS)[number];
export type LabPaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface LabTestParameter {
  name: string;
  unit: string;
  normalRange: string;
}

export interface LabTest {
  id: string;
  testName: string;
  testCode: string;
  category: string;
  price: number;
  sampleType: string;
  parameters: LabTestParameter[];
  isActive: boolean;
  createdAt: string;
}

export interface LabBookingTest {
  id: string;
  labBookingId: string;
  labTestId: string;
  testName: string;
  price: number;
}

export interface LabBooking {
  id: string;
  bookingNumber: string;
  patientId: string;
  patient?: Patient;
  tests: LabBookingTest[];
  totalAmount: number;
  paymentStatus: LabPaymentStatus;
  paymentMethod?: LabPaymentMethod;
  status: LabStatus;
  collectedBy?: string;
  processedBy?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface LabResultEntry {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  flag: 'normal' | 'low' | 'high' | 'critical';
}

export interface LabReport {
  id: string;
  labBookingId: string;
  labTestId: string;
  testName: string;
  patientId: string;
  results: LabResultEntry[];
  interpretation?: string;
  verifiedBy: string;
  createdAt: string;
}
