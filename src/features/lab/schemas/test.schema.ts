// #must: Zod validation schemas for lab test catalog management
import { z } from 'zod';

export const testParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  unit: z.string().min(1, 'Unit is required'),
  normalRange: z.string().min(1, 'Normal range is required (e.g. "4.0-11.0")'),
});

export const labTestSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  testCode: z
    .string()
    .min(1, 'Test code is required')
    .transform((val) => val.toUpperCase()),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be a positive number'),
  sampleType: z.string().min(1, 'Sample type is required'),
  parameters: z
    .array(testParameterSchema)
    .min(1, 'At least one parameter is required'),
});

export type TestParameterFormData = z.infer<typeof testParameterSchema>;
export type LabTestFormData = z.infer<typeof labTestSchema>;
