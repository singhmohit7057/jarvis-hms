
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import { PhoneInput } from '@/components/forms/PhoneInput';
import {
  patientSchema,
  BLOOD_GROUP_OPTIONS,
  GENDER_SELECT_OPTIONS,
} from '../schemas/patient.schema';
import type { PatientSchemaType } from '../schemas/patient.schema';

interface PatientFormProps {
  onSubmit: (data: PatientSchemaType) => void;
  defaultValues?: Partial<PatientSchemaType>;
  isLoading?: boolean;
  onClose?: () => void;
}

export function PatientForm({ onSubmit, defaultValues, isLoading = false, onClose }: PatientFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<PatientSchemaType>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      age: undefined as unknown as number,
      gender: '' as unknown as PatientSchemaType['gender'],
      phone: '',
      email: '',
      address: '',
      bloodGroup: '',
      allergies: '',
      medicalHistory: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Row 1: Name (spans 2) + Age + Gender */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2">
          <FormField control={control} name="name" label="Full Name *" placeholder="Enter patient name" />
        </div>
        <FormField control={control} name="age" label="Age *" type="number" placeholder="e.g., 35" />
        <FormField control={control} name="gender" label="Gender *" type="select" options={GENDER_SELECT_OPTIONS} placeholder="Select" />
      </div>

      {/* Row 2: Phone + Email + Blood Group */}
      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput label="Phone Number *" value={field.value} onChange={field.onChange} error={errors.phone?.message} />
          )}
        />
        <FormField control={control} name="email" label="Email" type="email" placeholder="patient@email.com" />
        <FormField control={control} name="bloodGroup" label="Blood Group" type="select" options={BLOOD_GROUP_OPTIONS} placeholder="Select" />
      </div>

      {/* Row 3: Address (spans 2) + Allergies */}
      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="address" label="Address" placeholder="Enter address" />
        <FormField control={control} name="allergies" label="Allergies" placeholder="Known allergies..." />
      </div>

      {/* Row 4: Medical History (full width) */}
      <FormField control={control} name="medicalHistory" label="Medical History" placeholder="Past medical conditions..." />

      {/* Emergency Contact */}
      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="emergencyContactName" label="Emergency Contact Name" placeholder="Emergency contact name" />
        <Controller
          control={control}
          name="emergencyContactPhone"
          render={({ field }) => (
            <PhoneInput label="Emergency Contact Phone" value={field.value ?? ''} onChange={field.onChange} error={errors.emergencyContactPhone?.message} />
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update Patient' : 'Register Patient'}
        </Button>
      </div>
    </form>
  );
}
