
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui';

const clinicInfoSchema = z.object({
  clinicName: z.string().min(1, 'Clinic name is required').max(100),
  email: z.string().email('Enter a valid email').max(150),
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .max(15)
    .regex(/^[\d\s+\-()]+$/, 'Enter a valid phone number'),
  address: z.string().min(1, 'Address is required').max(500),
  gstNumber: z
    .string()
    .max(15)
    .regex(/^[A-Z0-9]*$/, 'GST number must be alphanumeric')
    .optional()
    .or(z.literal('')),
});

export type ClinicInfoFormValues = z.infer<typeof clinicInfoSchema>;

export interface ClinicInfoFormProps {
  onSubmit: (values: ClinicInfoFormValues) => Promise<void>;
  defaultValues?: Partial<ClinicInfoFormValues>;
  isLoading?: boolean;
}

export function ClinicInfoForm({ onSubmit, defaultValues, isLoading = false }: ClinicInfoFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors: _errors },
  } = useForm<ClinicInfoFormValues>({
    resolver: zodResolver(clinicInfoSchema),
    defaultValues: {
      clinicName: defaultValues?.clinicName ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      gstNumber: defaultValues?.gstNumber ?? '',
    },
  });

  // Re-populate when async defaultValues arrive
  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="clinicName"
          label="Clinic Name"
          placeholder="e.g. Jarvis Healthcare"
        />
        <FormField
          control={control}
          name="email"
          label="Contact Email"
          type="email"
          placeholder="clinic@example.com"
        />
        <FormField
          control={control}
          name="phone"
          label="Phone Number"
          placeholder="+91 98765 43210"
        />
        <FormField
          control={control}
          name="gstNumber"
          label="GST Number"
          placeholder="22AAAAA0000A1Z5 (optional)"
        />
      </div>

      <FormField
        control={control}
        name="address"
        label="Address"
        type="textarea"
        placeholder="Full clinic address including city, state, and PIN code"
      />

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
