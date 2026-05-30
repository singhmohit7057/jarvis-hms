// #must: Zod validation schemas for sale customer and payment forms
import { z } from 'zod';
import { PAYMENT_METHODS } from '@/config/constants';

export const customerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerPhone: z
    .string()
    .refine((val) => val === '' || /^[6-9]\d{9}$/.test(val), {
      message: 'Phone must be a valid 10-digit Indian mobile number',
    })
    .default(''),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const paymentSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  paidAmount: z.coerce.number().positive('Paid amount must be greater than 0'),
  discountType: z.enum(['percentage', 'fixed']).default('fixed'),
  discountValue: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
