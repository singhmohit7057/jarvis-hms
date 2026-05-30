// #must: Form for creating/editing lab tests with dynamic parameters via useFieldArray
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { labTestSchema } from '../schemas/test.schema';
import type { LabTestFormData } from '../schemas/test.schema';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface TestFormProps {
  onSubmit: (data: LabTestFormData) => void;
  defaultValues?: Partial<LabTestFormData>;
  onClose: () => void;
  isSubmitting?: boolean;
}

const SAMPLE_TYPE_OPTIONS = [
  { value: 'Blood', label: 'Blood' },
  { value: 'Urine', label: 'Urine' },
  { value: 'Serum', label: 'Serum' },
  { value: 'Stool', label: 'Stool' },
  { value: 'Sputum', label: 'Sputum' },
  { value: 'CSF', label: 'CSF' },
  { value: 'Other', label: 'Other' },
];

export function TestForm({ onSubmit, defaultValues, onClose, isSubmitting }: TestFormProps) {
  const { control, handleSubmit, register, formState: { errors } } = useForm<LabTestFormData>({
    resolver: zodResolver(labTestSchema),
    defaultValues: {
      testName: '',
      testCode: '',
      category: '',
      price: 0,
      sampleType: '',
      parameters: [{ name: '', unit: '', normalRange: '' }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parameters',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField control={control} name="testName" label="Test Name" placeholder="e.g. Complete Blood Count" />
        <FormField control={control} name="testCode" label="Test Code" placeholder="e.g. CBC" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField control={control} name="category" label="Category" placeholder="e.g. Hematology" />
        <FormField
          control={control}
          name="sampleType"
          label="Sample Type"
          type="select"
          options={SAMPLE_TYPE_OPTIONS}
          placeholder="Select sample type"
        />
        <FormField control={control} name="price" label="Price (INR)" type="number" placeholder="0" />
      </div>

      {/* Dynamic Parameters */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Parameters
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => append({ name: '', unit: '', normalRange: '' })}
          >
            Add Parameter
          </Button>
        </div>

        {errors.parameters?.root && (
          <p className="mb-2 text-xs text-red-500">{errors.parameters.root.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Parameter Name
                  </label>
                  <input
                    {...register(`parameters.${index}.name`)}
                    placeholder="e.g. Hemoglobin"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {errors.parameters?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.parameters[index].name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Unit
                  </label>
                  <input
                    {...register(`parameters.${index}.unit`)}
                    placeholder="e.g. g/dL"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {errors.parameters?.[index]?.unit && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.parameters[index].unit?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Normal Range
                  </label>
                  <input
                    {...register(`parameters.${index}.normalRange`)}
                    placeholder="e.g. 12.0-17.5"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {errors.parameters?.[index]?.normalRange && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.parameters[index].normalRange?.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="mt-5 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Remove parameter"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {defaultValues?.testName ? 'Update Test' : 'Add Test'}
        </Button>
      </div>
    </form>
  );
}
