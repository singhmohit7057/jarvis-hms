
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import type { MedicineBatch } from '@/types';

interface StockAdjustFormProps {
  batch: MedicineBatch;
  onSubmit: (batchId: string, newQuantity: number) => void;
  onClose: () => void;
}

const stockAdjustSchema = z.object({
  adjustType: z.enum(['add', 'reduce']),
  quantity: z.coerce.number().int('Must be a whole number').positive('Quantity must be greater than 0'),
  reason: z.string().min(1, 'Please provide a reason for adjustment').max(500),
});

type StockAdjustFormData = z.infer<typeof stockAdjustSchema>;

export function StockAdjustForm({ batch, onSubmit, onClose }: StockAdjustFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch } = useForm<StockAdjustFormData>({
    resolver: zodResolver(stockAdjustSchema),
    defaultValues: {
      adjustType: 'add',
      quantity: 0,
      reason: '',
    },
  });

  const adjustType = watch('adjustType');
  const quantity = watch('quantity');

  const newStock =
    adjustType === 'add'
      ? batch.quantityInStock + (quantity || 0)
      : Math.max(0, batch.quantityInStock - (quantity || 0));

  const onFormSubmit = async (data: StockAdjustFormData) => {
    setIsSubmitting(true);
    try {
      const finalQuantity =
        data.adjustType === 'add'
          ? batch.quantityInStock + data.quantity
          : Math.max(0, batch.quantityInStock - data.quantity);

      onSubmit(batch.id, finalQuantity);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Adjust Stock — Batch ${batch.batchNumber}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onFormSubmit)}
            isLoading={isSubmitting}
          >
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Stock: <span className="font-semibold text-gray-900 dark:text-gray-100">{batch.quantityInStock}</span>
          </p>
        </div>

        <FormField
          control={control}
          name="adjustType"
          label="Adjustment Type"
          type="select"
          options={[
            { value: 'add', label: 'Add Stock' },
            { value: 'reduce', label: 'Reduce Stock' },
          ]}
        />

        <FormField
          control={control}
          name="quantity"
          label="Quantity"
          type="number"
          placeholder="Enter quantity"
        />

        <FormField
          control={control}
          name="reason"
          label="Reason *"
          placeholder="e.g., New purchase, Damaged goods, Expiry removal"
        />

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            New Stock After Adjustment: <span className="font-bold">{newStock}</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
