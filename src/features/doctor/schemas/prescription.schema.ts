// #must: Zod validation schemas for consultation and prescription forms
import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  timing: z.string().optional(),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  advice: z.string().optional(),
  followupDate: z.string().optional(),
  items: z
    .array(prescriptionItemSchema)
    .min(1, 'At least one medicine is required'),
});

export const vitalsSchema = z.object({
  bp: z.string().optional(),
  pulse: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  spo2: z.string().optional(),
});

export const consultationSchema = z.object({
  symptoms: z.string().min(1, 'Symptoms are required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().optional(),
  vitals: vitalsSchema,
  prescription: prescriptionSchema,
});

export type PrescriptionItemFormData = z.infer<typeof prescriptionItemSchema>;
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;
export type VitalsFormData = z.infer<typeof vitalsSchema>;
export type ConsultationFormData = z.infer<typeof consultationSchema>;
