// #must: Symptoms, diagnosis, and notes textarea section for consultation form
import { Controller, type Control } from 'react-hook-form';
import { Textarea } from '@/components/ui/Textarea';
import type { ConsultationFormData } from '../schemas/prescription.schema';

interface DiagnosisNotesProps {
  control: Control<ConsultationFormData>;
}

export function DiagnosisNotes({ control }: DiagnosisNotesProps) {
  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="symptoms"
        render={({ field, fieldState: { error } }) => (
          <Textarea
            label="Symptoms / Chief Complaints"
            placeholder="e.g. Fever for 3 days, headache, body ache..."
            error={error?.message}
            rows={3}
            {...field}
          />
        )}
      />

      <Controller
        control={control}
        name="diagnosis"
        render={({ field, fieldState: { error } }) => (
          <Textarea
            label="Diagnosis"
            placeholder="e.g. Viral fever, Upper respiratory tract infection..."
            error={error?.message}
            rows={2}
            {...field}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Textarea
            label="Clinical Notes (optional)"
            placeholder="Any additional observations or notes..."
            rows={2}
            {...field}
            value={field.value ?? ''}
          />
        )}
      />
    </div>
  );
}
