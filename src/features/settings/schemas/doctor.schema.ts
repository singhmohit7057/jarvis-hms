// #must: Zod validation schema for doctor management form
import { z } from 'zod';

export const SPECIALIZATION_OPTIONS = [
  { value: 'general_medicine', label: 'General Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'ent', label: 'ENT' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'urology', label: 'Urology' },
  { value: 'dentistry', label: 'Dentistry' },
  { value: 'other', label: 'Other' },
] as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const doctorSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters'),

  specialization: z
    .string()
    .min(1, 'Specialization is required'),

  qualification: z
    .string()
    .min(1, 'Qualification is required'),

  registration_no: z
    .string()
    .optional(),

  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),

  email: z
    .union([z.string().email('Enter a valid email address'), z.literal('')])
    .optional(),

  consultation_fee: z
    .coerce
    .number()
    .min(0, 'Consultation fee cannot be negative'),

  available_days: z
    .array(z.string())
    .optional()
    .default([]),

  available_time_start: z
    .string()
    .regex(timeRegex, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),

  available_time_end: z
    .string()
    .regex(timeRegex, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),

  is_active: z
    .boolean()
    .default(true),
});

export type DoctorSchemaType = z.infer<typeof doctorSchema>;
