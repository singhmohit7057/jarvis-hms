// #must: Expandable batch details table for a medicine showing all batches with stock, prices, expiry
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { MedicineBatch } from '@/types';

interface BatchDetailsProps {
  medicineId: string;
}

export function BatchDetails({ medicineId }: BatchDetailsProps) {
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBatches() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('medicine_batches')
          .select('*')
          .eq('medicine_id', medicineId)
          .order('expiry_date', { ascending: true });

        if (error) throw error;

        const mapped: MedicineBatch[] = (data ?? []).map((b) => ({
          id: b.id,
          medicineId: b.medicine_id,
          batchNumber: b.batch_number,
          expiryDate: b.expiry_date,
          mrp: b.mrp,
          purchasePrice: b.purchase_price,
          sellingPrice: b.selling_price,
          quantityInStock: b.quantity_in_stock,
          createdAt: b.created_at,
        }));

        setBatches(mapped);
      } catch {
        setBatches([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBatches();
  }, [medicineId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
        No batches found for this medicine.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            <th className="text-left py-2 pr-4">Batch #</th>
            <th className="text-left py-2 pr-4">Expiry</th>
            <th className="text-right py-2 pr-4">MRP</th>
            <th className="text-right py-2 pr-4">Purchase</th>
            <th className="text-right py-2 pr-4">Selling</th>
            <th className="text-right py-2 pr-4">Stock</th>
            <th className="text-left py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-600">
          {batches.map((batch) => {
            const isExpired = new Date(batch.expiryDate) < new Date();
            const isLowStock = batch.quantityInStock > 0 && batch.quantityInStock <= 10;
            const isOutOfStock = batch.quantityInStock === 0;

            return (
              <tr key={batch.id} className="text-gray-700 dark:text-gray-300">
                <td className="py-2 pr-4 font-mono text-xs">{batch.batchNumber}</td>
                <td className="py-2 pr-4">{formatDate(batch.expiryDate)}</td>
                <td className="py-2 pr-4 text-right">{formatCurrency(batch.mrp)}</td>
                <td className="py-2 pr-4 text-right">{formatCurrency(batch.purchasePrice)}</td>
                <td className="py-2 pr-4 text-right">{formatCurrency(batch.sellingPrice)}</td>
                <td className="py-2 pr-4 text-right font-medium">{batch.quantityInStock}</td>
                <td className="py-2">
                  {isExpired ? (
                    <Badge variant="danger" size="sm">Expired</Badge>
                  ) : isOutOfStock ? (
                    <Badge variant="danger" size="sm">Out of Stock</Badge>
                  ) : isLowStock ? (
                    <Badge variant="warning" size="sm">Low Stock</Badge>
                  ) : (
                    <Badge variant="success" size="sm">Available</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
