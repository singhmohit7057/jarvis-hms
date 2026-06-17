
import { z } from 'zod';
import { PAYMENT_METHODS } from '@/config/constants';

export const appointmentSchema = z.object({
  patientId: z.string().uuid('Please select a patient'),
  doctorId: z.string().uuid('Please select a doctor'),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (val) => {
        const selected = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
      },
      { message: 'Date must be today or in the future' }
    ),
  time: z
    .string()
    .min(1, 'Time is required')
    .refine((val) => /^\d{2}:\d{2}$/.test(val), { message: 'Enter time as HH:MM' }),
  fee: z.coerce.number().positive('Fee must be a positive number'),
  paymentMethod: z.enum([...PAYMENT_METHODS] as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  notes: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'waived']).optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
