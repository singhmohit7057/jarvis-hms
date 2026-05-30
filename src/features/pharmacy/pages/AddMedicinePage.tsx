// #must: Form page for adding/editing a medicine with react-hook-form + zod validation
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { useInventory } from '../hooks/useInventory';
import { MedicineForm } from '../components/MedicineForm';
import type { MedicineWithBatchFormData, MedicineFormData } from '../schemas/medicine.schema';

export function AddMedicinePage() {
  const navigate = useNavigate();
  const { addMedicine, addBatch } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: MedicineWithBatchFormData | MedicineFormData) => {
    setIsSubmitting(true);
    try {
      const medicineId = await addMedicine({
        name: data.name,
        genericName: data.genericName,
        company: data.company,
        category: data.category,
        composition: data.composition,
        hsnCode: data.hsnCode,
        gstPercentage: data.gstPercentage,
        unit: data.unit,
      });

      // Add initial batch if provided
      if ('batch' in data && data.batch) {
        await addBatch(medicineId, {
          batchNumber: data.batch.batchNumber,
          expiryDate: data.batch.expiryDate,
          mrp: data.batch.mrp,
          purchasePrice: data.batch.purchasePrice,
          sellingPrice: data.batch.sellingPrice,
          quantityInStock: data.batch.quantityInStock,
        });
      }

      toast.success('Medicine added successfully');
      navigate(ROUTES.PHARMACY_INVENTORY);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add medicine';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Medicine"
        subtitle="Add a new medicine to inventory with initial batch"
        breadcrumbs={[
          { label: 'Pharmacy', path: ROUTES.PHARMACY_INVENTORY },
          { label: 'Inventory', path: ROUTES.PHARMACY_INVENTORY },
          { label: 'Add Medicine' },
        ]}
        actions={
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.PHARMACY_INVENTORY)}
          >
            Back
          </Button>
        }
      />

      <MedicineForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
