import type { GENDER_OPTIONS } from '@/config/constants';

export type Gender = (typeof GENDER_OPTIONS)[number];

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  address: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'patientId' | 'createdAt'>;
