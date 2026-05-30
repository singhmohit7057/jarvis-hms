// #must: Add/Edit user form with react-hook-form — name, email, phone, role, active status
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/forms/FormField';
import { Button, Alert } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { USER_ROLES } from '@/config/constants';

const addUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email').max(150),
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit phone number')
    .max(15)
    .regex(/^[\d\s+\-()]+$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  role: z.enum(['super_admin', 'pharmacist', 'doctor', 'lab_staff', 'receptionist'] as const, { required_error: 'Role is required' }),
  is_active: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

export type UserFormValues = z.infer<typeof addUserSchema>;

export interface UserFormProps {
  onSubmit: (values: UserFormValues) => Promise<void>;
  defaultValues?: Partial<UserFormValues>;
  isLoading?: boolean;
  mode: 'add' | 'edit';
}

const roleOptions: SelectOption[] = [
  { label: 'Super Admin', value: USER_ROLES.SUPER_ADMIN },
  { label: 'Pharmacist', value: USER_ROLES.PHARMACIST },
  { label: 'Doctor', value: USER_ROLES.DOCTOR },
  { label: 'Lab Staff', value: USER_ROLES.LAB_STAFF },
  { label: 'Receptionist', value: USER_ROLES.RECEPTIONIST },
];

const activeOptions: SelectOption[] = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

export function UserForm({ onSubmit, defaultValues, isLoading = false, mode }: UserFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors: _errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      role: defaultValues?.role ?? USER_ROLES.RECEPTIONIST,
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const handleFormSubmit = async (values: UserFormValues) => {
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {mode === 'add' && (
        <Alert variant="info">
          <p className="text-sm font-medium mb-1">Before adding a profile:</p>
          <p className="text-sm">
            Go to your{' '}
            <strong>Supabase Dashboard → Authentication → Users → Invite User</strong>, create the
            auth account first, then fill in their profile details below.
          </p>
        </Alert>
      )}

      <FormField
        control={control}
        name="name"
        label="Full Name"
        placeholder="e.g. Dr. Ravi Sharma"
      />

      <FormField
        control={control}
        name="email"
        label="Email Address"
        type="email"
        placeholder="user@clinic.com"
        disabled={mode === 'edit'}
      />

      <FormField
        control={control}
        name="phone"
        label="Phone Number"
        placeholder="+91 98765 43210 (optional)"
      />

      <FormField
        control={control}
        name="role"
        label="Role"
        type="select"
        options={roleOptions}
        placeholder="Select role"
      />

      {mode === 'edit' && (
        <FormField
          control={control}
          name="is_active"
          label="Status"
          type="select"
          options={activeOptions}
          placeholder="Select status"
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {mode === 'add' ? 'Add Profile' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
