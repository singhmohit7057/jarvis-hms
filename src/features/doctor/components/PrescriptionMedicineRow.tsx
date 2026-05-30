// #must: Single medicine row in the prescription editor with all fields
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import type { ConsultationFormData } from '../schemas/prescription.schema';

const FREQUENCY_OPTIONS = [
  { value: '1-0-0', label: '1-0-0 (Morning)' },
  { value: '0-1-0', label: '0-1-0 (Afternoon)' },
  { value: '0-0-1', label: '0-0-1 (Night)' },
  { value: '1-0-1', label: '1-0-1 (Morning & Night)' },
  { value: '1-1-0', label: '1-1-0 (Morning & Afternoon)' },
  { value: '0-1-1', label: '0-1-1 (Afternoon & Night)' },
  { value: '1-1-1', label: '1-1-1 (Thrice daily)' },
  { value: 'SOS', label: 'SOS (As needed)' },
];

const TIMING_OPTIONS = [
  { value: '', label: 'Select timing' },
  { value: 'Before food', label: 'Before food' },
  { value: 'After food', label: 'After food' },
  { value: 'With food', label: 'With food' },
  { value: 'Empty stomach', label: 'Empty stomach' },
];

interface PrescriptionMedicineRowProps {
  index: number;
  control: Control<ConsultationFormData>;
  errors?: FieldErrors<ConsultationFormData>;
  onRemove: () => void;
  canRemove: boolean;
}

export function PrescriptionMedicineRow({
  index,
  control,
  errors,
  onRemove,
  canRemove,
}: PrescriptionMedicineRowProps) {
  const itemErrors = errors?.prescription?.items?.[index];

  return (
    <div className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700">
      {/* Medicine Name */}
      <div className="col-span-12 sm:col-span-3">
        <Controller
          control={control}
          name={`prescription.items.${index}.medicineName`}
          render={({ field }) => (
            <Input
              label={index === 0 ? 'Medicine' : undefined}
              placeholder="Medicine name"
              error={itemErrors?.medicineName?.message}
              {...field}
            />
          )}
        />
      </div>

      {/* Dosage */}
      <div className="col-span-6 sm:col-span-1">
        <Controller
          control={control}
          name={`prescription.items.${index}.dosage`}
          render={({ field }) => (
            <Input
              label={index === 0 ? 'Dose' : undefined}
              placeholder="500mg"
              error={itemErrors?.dosage?.message}
              {...field}
            />
          )}
        />
      </div>

      {/* Frequency */}
      <div className="col-span-6 sm:col-span-2">
        <Controller
          control={control}
          name={`prescription.items.${index}.frequency`}
          render={({ field }) => (
            <div>
              {index === 0 && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Frequency
                </label>
              )}
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
                {...field}
              >
                <option value="">Select</option>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {itemErrors?.frequency?.message && (
                <p className="mt-1 text-xs text-red-500">{itemErrors.frequency.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Duration */}
      <div className="col-span-6 sm:col-span-2">
        <Controller
          control={control}
          name={`prescription.items.${index}.duration`}
          render={({ field }) => (
            <Input
              label={index === 0 ? 'Duration' : undefined}
              placeholder="5 days"
              error={itemErrors?.duration?.message}
              {...field}
            />
          )}
        />
      </div>

      {/* Timing */}
      <div className="col-span-6 sm:col-span-2">
        <Controller
          control={control}
          name={`prescription.items.${index}.timing`}
          render={({ field }) => (
            <div>
              {index === 0 && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Timing
                </label>
              )}
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
                {...field}
              >
                {TIMING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      </div>

      {/* Instructions + Remove */}
      <div className="col-span-10 sm:col-span-1">
        <Controller
          control={control}
          name={`prescription.items.${index}.instructions`}
          render={({ field }) => (
            <Input
              label={index === 0 ? 'Notes' : undefined}
              placeholder="e.g. with warm water"
              {...field}
            />
          )}
        />
      </div>

      <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
          title="Remove medicine"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
