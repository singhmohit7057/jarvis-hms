
import { useMemo } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/formatters';
import type { MedicineWithBatches } from '../hooks/useInventory';

interface ExpiryAlertListProps {
  medicines: MedicineWithBatches[];
  days?: number;
}

interface ExpiryItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantityInStock: number;
  remainingDays: number;
}

export function ExpiryAlertList({ medicines, days = 30 }: ExpiryAlertListProps) {
  const expiringItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + days);

    const items: ExpiryItem[] = [];

    for (const med of medicines) {
      for (const batch of med.batches) {
        if (batch.quantityInStock <= 0) continue;
        const expDate = new Date(batch.expiryDate);
        if (expDate >= today && expDate <= threshold) {
          const diffTime = expDate.getTime() - today.getTime();
          const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          items.push({
            medicineId: med.id,
            medicineName: med.name,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantityInStock: batch.quantityInStock,
            remainingDays,
          });
        }
      }
    }

    return items.sort((a, b) => a.remainingDays - b.remainingDays);
  }, [medicines, days]);

  const getVariant = (remainingDays: number): 'danger' | 'warning' => {
    if (remainingDays <= 0) return 'danger';
    if (remainingDays <= 7) return 'danger';
    return 'warning';
  };

  const getLabel = (remainingDays: number): string => {
    if (remainingDays <= 0) return 'Expired';
    if (remainingDays === 1) return '1 day left';
    return `${remainingDays} days left`;
  };

  if (expiringItems.length === 0) {
    return (
      <Card title="Expiry Alerts">
        <EmptyState
          icon={Clock}
          title="No expiry alerts"
          description={`No medicines expiring within ${days} days`}
        />
      </Card>
    );
  }

  return (
    <Card
      title="Expiry Alerts"
      subtitle={`${expiringItems.length} batch${expiringItems.length > 1 ? 'es' : ''} expiring soon`}
    >
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {expiringItems.map((item, index) => (
          <div
            key={`${item.medicineId}-${item.batchNumber}-${index}`}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`h-4 w-4 mt-0.5 ${
                  item.remainingDays <= 0
                    ? 'text-red-500'
                    : item.remainingDays <= 7
                      ? 'text-red-400'
                      : 'text-amber-500'
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.medicineName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Batch: {item.batchNumber} | Qty: {item.quantityInStock} | Exp: {formatDate(item.expiryDate)}
                </p>
              </div>
            </div>
            <Badge variant={getVariant(item.remainingDays)} size="sm">
              {getLabel(item.remainingDays)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
