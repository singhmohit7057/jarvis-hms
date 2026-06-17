
import { useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { PrescriptionMedicineRow } from './PrescriptionMedicineRow';
import type { ConsultationFormData } from '../schemas/prescription.schema';

interface PrescriptionEditorProps {
  control: Control<ConsultationFormData>;
  errors?: FieldErrors<ConsultationFormData>;
}

const EMPTY_ITEM = {
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  timing: '',
  instructions: '',
};

export function PrescriptionEditor({ control, errors }: PrescriptionEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prescription.items',
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Prescription
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(EMPTY_ITEM)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Medicine
        </Button>
      </div>

      {errors?.prescription?.items?.message && (
        <p className="text-xs text-red-500">{errors.prescription.items.message}</p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <PrescriptionMedicineRow
            key={field.id}
            index={index}
            control={control}
            errors={errors}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
          No medicines added. Click &quot;Add Medicine&quot; to start.
        </div>
      )}
    </div>
  );
}
