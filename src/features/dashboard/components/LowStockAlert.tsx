// #must: Low stock alert card — fetches medicine batches with quantity < 10, shows name/stock/expiry

import { AlertTriangle, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';

interface LowStockRow {
  id: string;
  medicine_name: string;
  batch_number: string;
  quantity_in_stock: number;
  expiry_date: string;
}

export interface LowStockAlertProps {
  limit?: number;
}

export function LowStockAlert({ limit = 5 }: LowStockAlertProps) {
  const { data, isLoading } = useSupabaseQuery<LowStockRow>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id, medicine_name, batch_number, quantity_in_stock, expiry_date')
        .lt('quantity_in_stock', 10)
        .gt('quantity_in_stock', -1)
        .order('quantity_in_stock', { ascending: true })
        .limit(limit),
    [limit]
  );

  return (
    <Card
      title="Low Stock Alert"
      action={
        <Link
          to={ROUTES.PHARMACY_INVENTORY}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          View All
        </Link>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Spinner size="md" className="text-blue-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
          <PackageOpen className="h-8 w-8 mb-2" />
          <p className="text-sm">All medicines are well-stocked</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700 -mx-6 -mb-6">
          {data.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.medicine_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Batch: {item.batch_number} · Exp: {formatDate(item.expiry_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                {item.quantity_in_stock < 5 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    item.quantity_in_stock < 5
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {item.quantity_in_stock}
                </span>
                <span className="text-xs text-gray-400">left</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
