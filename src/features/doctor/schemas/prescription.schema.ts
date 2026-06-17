
import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicineName: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  timing: z.string().optional(),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  diagnosis: z.string().optional(),
  advice: z.string().optional(),
  followupDate: z.string().optional(),
  items: z.array(prescriptionItemSchema).optional(),
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
