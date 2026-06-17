import { z } from 'zod';
import { GST_SLABS } from '@/config/constants';

/**
 * Indian phone number — exactly 10 digits.
 */
export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits');

/**
 * Valid email address.
 */
export const emailSchema = z
  .string()
  .email('Invalid email address');

/**
 * Valid date string (YYYY-MM-DD or ISO format).
 */
export const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date');

/**
 * Positive number greater than zero.
 */
export const positiveNumberSchema = z
  .number()
  .positive('Value must be greater than 0');

/**
 * GST percentage — must be one of the defined slabs.
 */
export const gstPercentageSchema = z
  .number()
  .refine(
    (val): val is (typeof GST_SLABS)[number] =>
      (GST_SLABS as readonly number[]).includes(val),
    `GST percentage must be one of: ${GST_SLABS.join(', ')}`
  );
