
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
  packSize: z.coerce.number().int().min(1, 'Pack size must be at least 1').default(1),
  looseSell: z.boolean().default(false),
  hsnCode: z.string().max(20).default(''),
  gstPercentage: z.coerce.number().refine(
    (v) => (GST_SLABS as readonly number[]).includes(v),
    { message: 'Select a valid GST slab' }
  ).default(0),
  reorderLevel: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative').default(0),
  rackLocation: z.string().max(50).default(''),
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
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  quantityInStock: z.coerce.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
});

export type MedicineBatchFormData = z.infer<typeof medicineBatchSchema>;

export const medicineWithBatchSchema = medicineSchema.extend({
  batch: medicineBatchSchema,
});

export type MedicineWithBatchFormData = z.infer<typeof medicineWithBatchSchema>;
