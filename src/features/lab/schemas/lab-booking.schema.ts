// #must: Zod validation schemas for lab booking creation and result entry
import { z } from 'zod';
import { PAYMENT_METHODS } from '@/config/constants';

export const labBookingSchema = z.object({
  patientId: z.string().uuid('Invalid patient selection'),
  testIds: z.array(z.string().uuid()).min(1, 'At least one test must be selected'),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Payment method is required' }),
  }),
  notes: z.string().optional(),
});

export const labResultSchema = z.object({
  parameter: z.string().min(1, 'Parameter is required'),
  value: z.string().min(1, 'Value is required'),
  unit: z.string().min(1, 'Unit is required'),
  normalRange: z.string().min(1, 'Normal range is required'),
  flag: z.enum(['normal', 'high', 'low', 'critical']),
});

export type LabBookingFormData = z.infer<typeof labBookingSchema>;
export type LabResultFormData = z.infer<typeof labResultSchema>;
