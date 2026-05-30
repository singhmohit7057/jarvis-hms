// #must: Inventory DataTable with column definitions, row expansion for batches, action buttons
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { MedicineWithBatches } from '../hooks/useInventory';
import { BatchDetails } from './BatchDetails';

interface InventoryTableProps {
  data: MedicineWithBatches[];
  isLoading: boolean;
  onEdit: (medicine: MedicineWithBatches) => void;
  onAddBatch: (medicine: MedicineWithBatches) => void;
  onDelete: (medicineId: string) => void;
}

export function InventoryTable({ data, isLoading, onEdit, onAddBatch, onDelete }: InventoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicineWithBatches | null>(null);

  const columns: ColumnDef<MedicineWithBatches, unknown>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === row.original.id ? null : row.original.id);
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          {expandedId === row.original.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</p>
          {row.original.genericName && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.original.genericName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="info">{row.original.category}</Badge>,
    },
    {
      accessorKey: 'hsnCode',
      header: 'HSN',
    },
    {
      accessorKey: 'company',
      header: 'Company',
    },
    {
      id: 'totalStock',
      header: 'Total Stock',
      cell: ({ row }) => {
        const total = row.original.batches.reduce((sum, b) => sum + b.quantityInStock, 0);
        const variant = total === 0 ? 'danger' : total <= 10 ? 'warning' : 'success';
        return <Badge variant={variant}>{total} {row.original.unit}s</Badge>;
      },
    },
    {
      accessorKey: 'gstPercentage',
      header: 'GST%',
      cell: ({ row }) => `${row.original.gstPercentage}%`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const total = row.original.batches.reduce((sum, b) => sum + b.quantityInStock, 0);
        const hasExpired = row.original.batches.some(
          (b) => new Date(b.expiryDate) < new Date() && b.quantityInStock > 0
        );

        if (total === 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (hasExpired) return <Badge variant="danger">Has Expired</Badge>;
        if (total <= 10) return <Badge variant="warning">Low Stock</Badge>;
        return <Badge variant="success">In Stock</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
            leftIcon={<Edit className="h-3.5 w-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddBatch(row.original);
            }}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Batch
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row.original);
            }}
            leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
          />
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search medicines..."
        pagination
        pageSize={10}
        emptyMessage="No medicines found"
      />

      {/* Expanded batch details */}
      {expandedId && (
        <div className="mt-2 ml-8 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
          <BatchDetails medicineId={expandedId} />
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will deactivate it from inventory.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
