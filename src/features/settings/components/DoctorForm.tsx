
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/forms/FormField';
import type { SelectOption } from '@/components/ui/Select';
import { PhoneInput } from '@/components/forms/PhoneInput';
import {
  doctorSchema,
  SPECIALIZATION_OPTIONS,
  DAYS_OF_WEEK,
} from '../schemas/doctor.schema';
import type { DoctorSchemaType } from '../schemas/doctor.schema';

interface DoctorFormProps {
  onSubmit: (data: DoctorSchemaType) => void;
  defaultValues?: Partial<DoctorSchemaType>;
  isLoading?: boolean;
  onClose?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function DoctorForm({ onSubmit, defaultValues, isLoading = false, onClose }: DoctorFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<DoctorSchemaType>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: '',
      specialization: '' as unknown as DoctorSchemaType['specialization'],
      qualification: '',
      registration_no: '',
      phone: '',
      email: '',
      consultation_fee: undefined as unknown as number,
      available_time_start: '',
      available_time_end: '',
      available_days: [],
      is_active: true,
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
            label="Name"
            placeholder="Enter doctor name"
          />
          <FormField
            control={control}
            name="specialization"
            label="Specialization"
            type="select"
            options={SPECIALIZATION_OPTIONS as unknown as SelectOption[]}
            placeholder="Select specialization"
          />
          <FormField
            control={control}
            name="qualification"
            label="Qualification"
            placeholder="e.g. MBBS, MD"
          />
          <FormField
            control={control}
            name="registration_no"
            label="Registration No (Optional)"
            placeholder="Medical council registration no"
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
            placeholder="doctor@hospital.com"
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="consultation_fee"
            label="Consultation Fee (₹)"
            type="number"
            placeholder="Enter fee amount"
          />

          {/* Available From */}
          <Controller
            control={control}
            name="available_time_start"
            render={({ field, fieldState: { error } }) => (
              <Input
                label="Available From"
                type="time"
                error={error?.message}
                {...field}
              />
            )}
          />

          {/* Available To */}
          <Controller
            control={control}
            name="available_time_end"
            render={({ field, fieldState: { error } }) => (
              <Input
                label="Available To"
                type="time"
                error={error?.message}
                {...field}
              />
            )}
          />

          {/* Available Days — checkboxes */}
          <Controller
            control={control}
            name="available_days"
            render={({ field, fieldState: { error } }) => (
              <div className="w-full">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Available Days
                </span>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const checked = Array.isArray(field.value) && field.value.includes(day);
                    return (
                      <label
                        key={day}
                        className="flex items-center gap-1.5 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = Array.isArray(field.value) ? field.value : [];
                            if (e.target.checked) {
                              field.onChange([...current, day]);
                            } else {
                              field.onChange(current.filter((d) => d !== day));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                      </label>
                    );
                  })}
                </div>
                {error && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error.message}</p>
                )}
              </div>
            )}
          />

          {/* is_active — only shown when editing */}
          {defaultValues && (
            <FormField
              control={control}
              name="is_active"
              label="Status"
              type="select"
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update Doctor' : 'Add Doctor'}
        </Button>
      </div>
    </form>
  );
}
