// #must: Patient registration/edit form — react-hook-form + zod, two-column layout
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showEmergency, setShowEmergency] = useState(
    !!(defaultValues?.emergencyContactName || defaultValues?.emergencyContactPhone)
  );

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Main fields — two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="name"
            label="Full Name"
            placeholder="Enter patient name"
          />
          <FormField
            control={control}
            name="age"
            label="Age"
            type="number"
            placeholder="Enter age"
          />
          <FormField
            control={control}
            name="gender"
            label="Gender"
            type="select"
            options={GENDER_SELECT_OPTIONS}
            placeholder="Select gender"
          />
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                label="Phone Number"
                value={field.value}
                onChange={field.onChange}
                error={errors.phone?.message}
              />
            )}
          />
          <FormField
            control={control}
            name="email"
            label="Email (Optional)"
            type="email"
            placeholder="patient@email.com"
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="address"
            label="Address (Optional)"
            type="textarea"
            placeholder="Enter address"
          />
          <FormField
            control={control}
            name="bloodGroup"
            label="Blood Group (Optional)"
            type="select"
            options={BLOOD_GROUP_OPTIONS}
            placeholder="Select blood group"
          />
          <FormField
            control={control}
            name="allergies"
            label="Allergies (Optional)"
            type="textarea"
            placeholder="Known allergies..."
          />
          <FormField
            control={control}
            name="medicalHistory"
            label="Medical History (Optional)"
            type="textarea"
            placeholder="Past medical conditions..."
          />
        </div>
      </div>

      {/* Emergency Contact — collapsible section */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
        <button
          type="button"
          onClick={() => setShowEmergency(!showEmergency)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <span>Emergency Contact (Optional)</span>
          {showEmergency ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showEmergency && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="emergencyContactName"
              label="Contact Name"
              placeholder="Emergency contact name"
            />
            <Controller
              control={control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <PhoneInput
                  label="Contact Phone"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.emergencyContactPhone?.message}
                />
              )}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update Patient' : 'Register Patient'}
        </Button>
      </div>
    </form>
  );
}
