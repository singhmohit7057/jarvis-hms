
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { useInventory } from '../hooks/useInventory';
import { MedicineForm } from '../components/MedicineForm';
import type { MedicineFormData } from '../schemas/medicine.schema';

export function AddMedicinePage() {
  const navigate = useNavigate();
  const { addMedicine } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: MedicineFormData) => {
    setIsSubmitting(true);
    try {
      await addMedicine({
        name: data.name,
        genericName: data.genericName,
        company: data.company,
        category: data.category,
        composition: data.composition,
        packSize: data.packSize,
        looseSell: data.looseSell,
        hsnCode: data.hsnCode,
        gstPercentage: data.gstPercentage,
        reorderLevel: data.reorderLevel,
        rackLocation: data.rackLocation,
      });
      toast.success('Medicine added successfully');
      navigate(ROUTES.PHARMACY_INVENTORY);
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Failed to add medicine';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Medicine"
        subtitle="Register a new medicine (name, category, GST, pack size etc.)"
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

      <MedicineForm
        onSubmit={handleSubmit as Parameters<typeof MedicineForm>[0]['onSubmit']}
        isLoading={isSubmitting}
        isEditMode={false}
        submitLabel="Add Medicine"
      />
    </div>
  );
}
