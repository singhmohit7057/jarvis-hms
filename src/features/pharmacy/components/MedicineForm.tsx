
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/forms/FormField';
import { DatePickerField } from '@/components/forms/DatePickerField';
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
  submitLabel?: string;
}

const categoryOptions: SelectOption[] = MEDICINE_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

const gstOptions: SelectOption[] = GST_SLABS.map((slab) => ({
  value: String(slab),
  label: `${slab}%`,
}));
const ML_CATEGORIES = new Set(['Syrup', 'Drops', 'Injection', 'Inhaler']);
const LOOSE_ELIGIBLE = new Set(['Tablet', 'Capsule', 'Strip', 'Other']);

export function MedicineForm({ onSubmit, defaultValues, isLoading = false, isEditMode = false, submitLabel }: MedicineFormProps) {
  const schema = isEditMode ? medicineSchema : medicineWithBatchSchema;

  const { control, handleSubmit } = useForm<MedicineWithBatchFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      genericName: defaultValues?.genericName ?? '',
      company: defaultValues?.company ?? '',
      category: defaultValues?.category ?? 'Tablet',
      composition: defaultValues?.composition ?? '',
      packSize: (defaultValues as { packSize?: number })?.packSize ?? ('' as unknown as number),
      looseSell: (defaultValues as { looseSell?: boolean })?.looseSell ?? false,
      hsnCode: defaultValues?.hsnCode ?? '',
      gstPercentage: defaultValues?.gstPercentage ?? 0,
      reorderLevel: defaultValues?.reorderLevel ?? ('' as unknown as number),
      rackLocation: defaultValues?.rackLocation ?? '',
      ...(isEditMode
        ? {}
        : {
            batch: {
              batchNumber: '',
              expiryDate: '',
              mrp: '' as unknown as number,
              purchasePrice: '' as unknown as number,
              quantityInStock: '' as unknown as number,
            },
          }),
    },
  });

  const selectedCategory = useWatch({ control, name: 'category' });
  const packSizeLabel = ML_CATEGORIES.has(selectedCategory)
    ? 'Pack Size (ml)'
    : 'Pack Size (units)';
  const showLooseSell = LOOSE_ELIGIBLE.has(selectedCategory);

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
          <div className="md:col-span-2 flex items-end gap-6">
            <div className="w-44 shrink-0">
              <FormField
                control={control}
                name="packSize"
                label={packSizeLabel}
                type="number"
                placeholder={ML_CATEGORIES.has(selectedCategory) ? 'e.g., 120' : 'e.g., 10, 15'}
              />
            </div>
            {showLooseSell && (
              <Controller
                control={control}
                name="looseSell"
                render={({ field }) => (
                  <div className="flex flex-col justify-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 select-none">
                        Loose sell eligible
                      </span>
                    </label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-6">
                      Allow selling individual pieces at POS
                    </p>
                  </div>
                )}
              />
            )}
          </div>
          <FormField
            control={control}
            name="hsnCode"
            label="HSN Code"
            placeholder="e.g., 30049099"
          />
          <FormField
            control={control}
            name="gstPercentage"
            label="GST %"
            type="select"
            options={gstOptions}
            placeholder="Select GST slab"
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
            <Controller
              control={control}
              name="batch.expiryDate"
              render={({ field, fieldState: { error } }) => (
                <DatePickerField
                  label="Expiry Date *"
                  selected={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
                    if (date) {
                      // Set to last day of selected month for expiry
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
              label="Purchase Price"
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

      {/* Stock Settings */}
      <Card title="Stock Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="reorderLevel"
            label="Reorder Level"
            type="number"
            placeholder="e.g., 10"
          />
          <FormField
            control={control}
            name="rackLocation"
            label="Rack / Location"
            placeholder="e.g., A-3, Counter 2"
          />
        </div>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isLoading} size="lg">
          {submitLabel ?? (isEditMode ? 'Update Medicine' : 'Add Medicine')}
        </Button>
      </div>
    </form>
  );
}
