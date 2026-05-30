// #must: Zod validation schemas for medicine and medicine batch forms
import { z } from 'zod';
import { MEDICINE_CATEGORIES, GST_SLABS } from '@/config/constants';

export const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').max(200),
  genericName: z.string().max(200).default(''),
  company: z.string().max(200).default(''),
  category: z.enum(MEDICINE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  composition: z.string().max(500).default(''),
  hsnCode: z.string().min(1, 'HSN code is required').max(20),
  gstPercentage: z.coerce
    .number()
    .refine((val): val is (typeof GST_SLABS)[number] => GST_SLABS.includes(val as (typeof GST_SLABS)[number]), {
      message: 'Please select a valid GST slab',
    }),
  unit: z.string().min(1).max(50).default('Strip'),
});

export type MedicineFormData = z.infer<typeof medicineSchema>;

export const medicineBatchSchema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required').max(100),
  expiryDate: z.string().min(1, 'Expiry date is required').refine(
    (val) => {
      const expiry = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry > today;
    },
    { message: 'Expiry date must be in the future' }
  ),
  mrp: z.coerce.number().positive('MRP must be greater than 0'),
  purchasePrice: z.coerce.number().positive('Purchase price must be greater than 0'),
  sellingPrice: z.coerce.number().positive('Selling price must be greater than 0'),
  quantityInStock: z.coerce.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative'),
});

export type MedicineBatchFormData = z.infer<typeof medicineBatchSchema>;

export const medicineWithBatchSchema = medicineSchema.extend({
  batch: medicineBatchSchema,
});

export type MedicineWithBatchFormData = z.infer<typeof medicineWithBatchSchema>;
