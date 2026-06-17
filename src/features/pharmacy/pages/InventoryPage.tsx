
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/config/routes';
import { useInventory } from '../hooks/useInventory';
import type { MedicineWithBatches } from '../hooks/useInventory';
import { InventoryTable } from '../components/InventoryTable';
import { MedicineForm } from '../components/MedicineForm';
import { AddBatchModal } from '../components/AddBatchModal';
import type { MedicineBatchFormData, MedicineFormData, MedicineWithBatchFormData } from '../schemas/medicine.schema';

const TABS = [
  { id: 'all', label: 'All Medicines' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'expired', label: 'Expired' },
  { id: 'near_expiry', label: 'Near Expiry' },
];

export function InventoryPage() {
  const navigate = useNavigate();
  const {
    medicines,
    isLoading,
    fetchMedicines,
    deleteMedicine,
    addBatch,
    updateMedicine,
    lowStock,
    expired,
    nearExpiry,
  } = useInventory();

  const [activeTab, setActiveTab] = useState('all');
  const [editTarget, setEditTarget] = useState<MedicineWithBatches | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [addBatchTarget, setAddBatchTarget] = useState<MedicineWithBatches | null>(null);

  const getFilteredData = useCallback((): MedicineWithBatches[] => {
    switch (activeTab) {
      case 'low_stock':
        return lowStock();
      case 'expired':
        return expired();
      case 'near_expiry':
        return nearExpiry(30);
      default:
        return medicines;
    }
  }, [activeTab, medicines, lowStock, expired, nearExpiry]);

  const handleEdit = (medicine: MedicineWithBatches) => {
    setEditTarget(medicine);
  };

  const handleEditSubmit = async (data: MedicineWithBatchFormData | MedicineFormData) => {
    if (!editTarget) return;
    setIsEditSubmitting(true);
    try {
      await updateMedicine(editTarget.id, data as MedicineFormData);
      toast.success('Medicine updated successfully');
      setEditTarget(null);
      await fetchMedicines();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update medicine';
      toast.error(message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleAddBatch = (medicine: MedicineWithBatches) => {
    setAddBatchTarget(medicine);
  };

  const handleAddBatchSubmit = async (medicineId: string, data: MedicineBatchFormData) => {
    try {
      await addBatch(medicineId, data);
      toast.success('Batch added successfully');
      setAddBatchTarget(null);
      fetchMedicines();
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to add batch';
      toast.error(message);
    }
  };

  const handleDelete = async (medicineId: string) => {
    try {
      await deleteMedicine(medicineId);
      toast.success('Medicine deactivated successfully');
      await fetchMedicines();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete medicine';
      toast.error(message);
    }
  };
  return (
    <div>
      <PageHeader
        title="Medicine Inventory"
        subtitle="Manage medicines, batches, and stock levels"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.PHARMACY_ADD_MEDICINE)}
          >
            Add Medicine
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Table */}
      <Card className="mt-4" noPadding>
        <div className="p-4">
          <InventoryTable
            data={getFilteredData()}
            isLoading={isLoading}
            onEdit={handleEdit}
            onAddBatch={handleAddBatch}
            onDelete={handleDelete}
          />
        </div>
      </Card>

      {/* Add New Batch Modal */}
      {addBatchTarget && (
        <AddBatchModal
          medicine={addBatchTarget}
          onSubmit={handleAddBatchSubmit}
          onClose={() => setAddBatchTarget(null)}
        />
      )}

      {/* Edit Medicine Modal */}
      {editTarget && (
        <Modal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          title={`Edit Medicine — ${editTarget.name}`}
          size="xl"
        >
          <MedicineForm
            isEditMode
            defaultValues={{
              name: editTarget.name,
              genericName: editTarget.genericName ?? '',
              category: editTarget.category,
              company: editTarget.company ?? '',
              composition: editTarget.composition ?? '',
              packSize: editTarget.packSize ?? 1,
              looseSell: editTarget.looseSell ?? false,
              hsnCode: editTarget.hsnCode ?? '',
              gstPercentage: editTarget.gstPercentage ?? 0,
              reorderLevel: editTarget.reorderLevel ?? 0,
              rackLocation: editTarget.rackLocation ?? '',
            }}
            onSubmit={handleEditSubmit}
            isLoading={isEditSubmitting}
          />
        </Modal>
      )}
    </div>
  );
}
