// #must: Full inventory management page with tabs, search, and medicine table
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
import { StockAdjustForm } from '../components/StockAdjustForm';
import type { MedicineBatch } from '@/types';

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
    updateBatch,
    lowStock,
    expired,
    nearExpiry,
  } = useInventory();

  const [activeTab, setActiveTab] = useState('all');
  const [batchTarget, setBatchTarget] = useState<{
    medicine: MedicineWithBatches;
    batch: MedicineBatch | null;
  } | null>(null);

  const getFilteredData = useCallback((): MedicineWithBatches[] => {
    switch (activeTab) {
      case 'low_stock':
        return lowStock(10);
      case 'expired':
        return expired();
      case 'near_expiry':
        return nearExpiry(30);
      default:
        return medicines;
    }
  }, [activeTab, medicines, lowStock, expired, nearExpiry]);

  const handleEdit = (medicine: MedicineWithBatches) => {
    navigate(`${ROUTES.PHARMACY_INVENTORY}/edit/${medicine.id}`);
  };

  const handleAddBatch = (medicine: MedicineWithBatches) => {
    if (medicine.batches.length === 1) {
      // Only one batch — skip selection and go straight to the adjust form
      setBatchTarget({ medicine, batch: medicine.batches[0] });
    } else {
      // Multiple batches — show selection step first
      setBatchTarget({ medicine, batch: null });
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

  const handleBatchSubmit = async (batchId: string, newQuantity: number) => {
    try {
      await updateBatch(batchId, { quantityInStock: newQuantity });
      toast.success('Stock adjusted successfully');
      setBatchTarget(null);
      await fetchMedicines();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to adjust stock';
      toast.error(message);
    }
  };

  const handleBatchSelect = (batch: MedicineBatch) => {
    if (batchTarget) {
      setBatchTarget({ medicine: batchTarget.medicine, batch });
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

      {/* Batch Selection Modal — shown when medicine has multiple batches and none selected yet */}
      {batchTarget && batchTarget.batch === null && (
        <Modal
          isOpen
          onClose={() => setBatchTarget(null)}
          title={`Select Batch — ${batchTarget.medicine.name}`}
          size="md"
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              This medicine has multiple batches. Select the batch you want to adjust.
            </p>
            {batchTarget.medicine.batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => handleBatchSelect(batch)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {batch.batchNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Expiry: {batch.expiryDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {batch.quantityInStock} units
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Stock Adjust Modal — shown once a specific batch is selected */}
      {batchTarget && batchTarget.batch !== null && (
        <StockAdjustForm
          batch={batchTarget.batch}
          onSubmit={handleBatchSubmit}
          onClose={() => setBatchTarget(null)}
        />
      )}
    </div>
  );
}
