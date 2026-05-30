// #must: Doctor module type definitions — doctors, appointments, consultations, prescriptions

import type { APPOINTMENT_STATUS, PAYMENT_STATUS } from '@/config/constants';
import type { Patient } from './patient.types';

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  registrationNo: string;
  phone: string;
  email?: string;
  consultationFee: number;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  isActive: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  doctorId: string;
  patient?: Patient;
  doctor?: Doctor;
  date: string;
  time: string;
  fee: number;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Vitals {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
  height: string;
  spo2: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  vitals: Vitals;
  symptoms: string;
  diagnosis: string;
  notes: string;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  appointmentId: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  patient?: Patient;
  doctor?: Doctor;
  diagnosis: string;
  advice: string;
  followupDate?: string;
  items: PrescriptionItem[];
  createdAt: string;
}
