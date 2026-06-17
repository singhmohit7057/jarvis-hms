import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import { DatePickerField } from '@/components/forms/DatePickerField';
import { medicineBatchSchema, type MedicineBatchFormData } from '../schemas/medicine.schema';
import type { MedicineWithBatches } from '../hooks/useInventory';

interface AddBatchModalProps {
  medicine: MedicineWithBatches;
  onSubmit: (medicineId: string, data: MedicineBatchFormData) => Promise<void>;
  onClose: () => void;
}

export function AddBatchModal({ medicine, onSubmit, onClose }: AddBatchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<MedicineBatchFormData>({
    resolver: zodResolver(medicineBatchSchema),
    defaultValues: {
      batchNumber: '',
      expiryDate: '',
      mrp: '' as unknown as number,
      purchasePrice: '' as unknown as number,
      quantityInStock: '' as unknown as number,
    },
  });

  const onFormSubmit = async (data: MedicineBatchFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(medicine.id, data);
      // onClose is called by the parent after successful submit
    } catch {
      // error already toasted by parent handler
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Add Batch — ${medicine.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onFormSubmit)} isLoading={isSubmitting}>
            Add Batch
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="batchNumber"
            label="Batch Number *"
            placeholder="e.g., BTH-2024-001"
          />
          <Controller
            control={control}
            name="expiryDate"
            render={({ field, fieldState: { error } }) => (
              <DatePickerField
                label="Expiry Date *"
                selected={field.value ? new Date(field.value) : null}
                onChange={(date) => {
                  if (date) {
                    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    field.onChange(lastDay.toISOString().split('T')[0]);
                  } else {
                    field.onChange('');
                  }
                }}
                minDate={new Date()}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                placeholder="MM/YYYY"
                error={error?.message}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={control}
            name="mrp"
            label="MRP *"
            type="number"
            placeholder="0.00"
          />
          <FormField
            control={control}
            name="purchasePrice"
            label="Purchase Price"
            type="number"
            placeholder="0.00"
          />
          <FormField
            control={control}
            name="quantityInStock"
            label="Qty (strips/packs) *"
            type="number"
            placeholder="e.g., 10"
          />
        </div>
      </div>
    </Modal>
  );
}
