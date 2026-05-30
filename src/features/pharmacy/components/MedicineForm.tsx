// #must: Medicine form component used by AddMedicinePage for create/edit mode
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MEDICINE_CATEGORIES, GST_SLABS } from '@/config/constants';
import { medicineWithBatchSchema, medicineSchema, type MedicineWithBatchFormData, type MedicineFormData } from '../schemas/medicine.schema';
import type { SelectOption } from '@/components/ui/Select';

interface MedicineFormProps {
  onSubmit: (data: MedicineWithBatchFormData | MedicineFormData) => void;
  defaultValues?: Partial<MedicineFormData>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const categoryOptions: SelectOption[] = MEDICINE_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

const gstOptions: SelectOption[] = GST_SLABS.map((slab) => ({
  value: String(slab),
  label: slab === 0 ? 'Exempt (0%)' : `${slab}%`,
}));

export function MedicineForm({ onSubmit, defaultValues, isLoading = false, isEditMode = false }: MedicineFormProps) {
  const schema = isEditMode ? medicineSchema : medicineWithBatchSchema;

  const { control, handleSubmit } = useForm<MedicineWithBatchFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      genericName: defaultValues?.genericName ?? '',
      company: defaultValues?.company ?? '',
      category: defaultValues?.category ?? 'Tablet',
      composition: defaultValues?.composition ?? '',
      hsnCode: defaultValues?.hsnCode ?? '',
      gstPercentage: defaultValues?.gstPercentage ?? 12,
      unit: defaultValues?.unit ?? 'Strip',
      ...(isEditMode
        ? {}
        : {
            batch: {
              batchNumber: '',
              expiryDate: '',
              mrp: 0,
              purchasePrice: 0,
              sellingPrice: 0,
              quantityInStock: 0,
            },
          }),
    },
  });

  const onFormSubmit = (data: MedicineWithBatchFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Medicine Details */}
      <Card title="Medicine Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="name"
            label="Medicine Name *"
            placeholder="Enter medicine name"
          />
          <FormField
            control={control}
            name="genericName"
            label="Generic Name"
            placeholder="Enter generic name"
          />
          <FormField
            control={control}
            name="company"
            label="Company / Manufacturer"
            placeholder="Enter company name"
          />
          <FormField
            control={control}
            name="category"
            label="Category *"
            type="select"
            options={categoryOptions}
            placeholder="Select category"
          />
          <FormField
            control={control}
            name="composition"
            label="Composition"
            placeholder="e.g., Paracetamol 500mg"
          />
          <FormField
            control={control}
            name="hsnCode"
            label="HSN Code *"
            placeholder="e.g., 3004"
          />
          <FormField
            control={control}
            name="gstPercentage"
            label="GST Percentage *"
            type="select"
            options={gstOptions}
            placeholder="Select GST slab"
          />
          <FormField
            control={control}
            name="unit"
            label="Unit"
            placeholder="e.g., Strip, Bottle, Tube"
          />
        </div>
      </Card>

      {/* Initial Batch (only for new medicine) */}
      {!isEditMode && (
        <Card title="Initial Batch">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="batch.batchNumber"
              label="Batch Number *"
              placeholder="e.g., BTH-2024-001"
            />
            <FormField
              control={control}
              name="batch.expiryDate"
              label="Expiry Date *"
              type="text"
              placeholder="YYYY-MM-DD"
            />
            <FormField
              control={control}
              name="batch.mrp"
              label="MRP *"
              type="number"
              placeholder="0.00"
            />
            <FormField
              control={control}
              name="batch.purchasePrice"
              label="Purchase Price *"
              type="number"
              placeholder="0.00"
            />
            <FormField
              control={control}
              name="batch.sellingPrice"
              label="Selling Price *"
              type="number"
              placeholder="0.00"
            />
            <FormField
              control={control}
              name="batch.quantityInStock"
              label="Quantity in Stock *"
              type="number"
              placeholder="0"
            />
          </div>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isLoading} size="lg">
          {isEditMode ? 'Update Medicine' : 'Add Medicine'}
        </Button>
      </div>
    </form>
  );
}
