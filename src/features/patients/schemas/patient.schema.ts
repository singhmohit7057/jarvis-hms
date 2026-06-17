
import { z } from 'zod';
import { GENDER_OPTIONS } from '@/config/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const patientSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters'),
  age: z.coerce
    .number()
    .int('Age must be a whole number')
    .min(1, 'Age must be at least 1')
    .max(150, 'Age must be 150 or less'),
  gender: z.enum(GENDER_OPTIONS),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  bloodGroup: z
    .enum(BLOOD_GROUPS)
    .optional()
    .or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  medicalHistory: z.string().optional().or(z.literal('')),
  emergencyContactName: z.string().optional().or(z.literal('')),
  emergencyContactPhone: z
    .string()
    .regex(/^\d{10}$/, 'Emergency contact phone must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
});

export type PatientSchemaType = z.infer<typeof patientSchema>;

export const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((bg) => ({
  label: bg,
  value: bg,
}));

export const GENDER_SELECT_OPTIONS = GENDER_OPTIONS.map((g) => ({
  label: g,
  value: g,
}));
