import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { IndianRupee, ShoppingBag, AlertTriangle, CalendarX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/data/StatCard';
import { DataTable } from '@/components/data/DataTable';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { RevenueChart } from './RevenueChart';

interface LowStockRow {
  id: string;
  medicine_name: string;
  batch_number: string;
  quantity_in_stock: number;
  expiry_date: string;
}

interface NearExpiryRow {
  id: string;
  medicine_name: string;
  batch_number: string;
  quantity_in_stock: number;
  expiry_date: string;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function localStartOf(dateStr: string): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mm = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${dateStr}T00:00:00${sign}${hh}:${mm}`;
}
function localEndOf(dateStr: string): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mm = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${dateStr}T23:59:59${sign}${hh}:${mm}`;
}
function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PharmacistDashboard() {
  const _now = new Date();
  const today = toLocalDate(_now);
  const sevenDaysAgo = getLast7Days()[0];
  const thirtyDaysLater = toLocalDate(new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 30));

  const { data: todaySales, isLoading: salesLoading } = useSupabaseQuery<{ grand_total: number }>(
    async () =>
      supabase
        .from('sales')
        .select('grand_total')
        .gte('created_at', localStartOf(today))
        .lte('created_at', localEndOf(today)),
    [today]
  );

  const { count: salesTotalCount, isLoading: countLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', localStartOf(today))
        .lte('created_at', localEndOf(today)),
    [today]
  );

  const { data: lowStockCountRaw, isLoading: stockLoading } = useSupabaseQuery<{ quantity_in_stock: number; medicines: { reorder_level: number } | null }>(
    async () =>
      (supabase
        .from('medicine_batches')
        .select('quantity_in_stock, medicines(reorder_level)')
        .gte('quantity_in_stock', 0)) as never,
    []
  );
  const lowStockCount = lowStockCountRaw.filter((b) => b.quantity_in_stock <= (b.medicines?.reorder_level ?? 0)).length;

  const { count: nearExpiryCount, isLoading: expiryLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id', { count: 'exact', head: true })
        .lte('expiry_date', thirtyDaysLater)
        .gte('expiry_date', today)
        .gt('quantity_in_stock', 0),
    [today, thirtyDaysLater]
  );

  // Revenue chart
  const { data: chartSales } = useSupabaseQuery<{ created_at: string; grand_total: number }>(
    async () =>
      supabase
        .from('sales')
        .select('created_at, grand_total')
        .gte('created_at', localStartOf(sevenDaysAgo))
        .order('created_at', { ascending: true }),
    [sevenDaysAgo]
  );

  const days = useMemo(() => getLast7Days(), []);

  const revenueChartData = useMemo(() => {
    return days.map((date) => ({
      date,
      revenue: chartSales
        .filter((s) => toLocalDate(new Date(s.created_at)) === date)
        .reduce((sum, s) => sum + (s.grand_total ?? 0), 0),
    }));
  }, [chartSales, days]);

  // Low stock table
  const { data: lowStockRaw, isLoading: lowStockLoading } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id, batch_number, quantity_in_stock, expiry_date, medicines(name, reorder_level)')
        .gte('quantity_in_stock', 0)
        .order('quantity_in_stock', { ascending: true }),
    []
  );
  const lowStockData: LowStockRow[] = lowStockRaw
    .filter((r) => {
      const qty = r.quantity_in_stock as number;
      const reorder = (r.medicines as { reorder_level: number } | null)?.reorder_level ?? 0;
      return qty <= reorder;
    })
    .slice(0, 10)
    .map((r) => ({
    id: r.id as string,
    medicine_name: (r.medicines as { name: string } | null)?.name ?? '—',
    batch_number: r.batch_number as string,
    quantity_in_stock: r.quantity_in_stock as number,
    expiry_date: r.expiry_date as string,
  }));

  // Near expiry table
  const { data: nearExpiryRaw, isLoading: nearExpiryLoading } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id, batch_number, quantity_in_stock, expiry_date, medicines(name)')
        .lte('expiry_date', thirtyDaysLater)
        .gte('expiry_date', today)
        .gt('quantity_in_stock', 0)
        .order('expiry_date', { ascending: true })
        .limit(10),
    [today, thirtyDaysLater]
  );
  const nearExpiryData: NearExpiryRow[] = nearExpiryRaw.map((r) => ({
    id: r.id as string,
    medicine_name: (r.medicines as { name: string } | null)?.name ?? '—',
    batch_number: r.batch_number as string,
    quantity_in_stock: r.quantity_in_stock as number,
    expiry_date: r.expiry_date as string,
  }));

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.grand_total ?? 0), 0);

  const lowStockColumns: ColumnDef<LowStockRow, unknown>[] = [
    { accessorKey: 'medicine_name', header: 'Medicine' },
    { accessorKey: 'batch_number', header: 'Batch' },
    {
      accessorKey: 'quantity_in_stock',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={cn('font-bold tabular-nums', row.original.quantity_in_stock < 5 ? 'text-red-600' : 'text-amber-600')}>
          {row.original.quantity_in_stock}
        </span>
      ),
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry',
      cell: ({ row }) => formatDate(row.original.expiry_date),
    },
  ];

  const nearExpiryColumns: ColumnDef<NearExpiryRow, unknown>[] = [
    { accessorKey: 'medicine_name', header: 'Medicine' },
    { accessorKey: 'batch_number', header: 'Batch' },
    {
      accessorKey: 'quantity_in_stock',
      header: 'Stock',
      cell: ({ row }) => <span className="tabular-nums">{row.original.quantity_in_stock}</span>,
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry Date',
      cell: ({ row }) => (
        <span className="text-amber-600 font-medium">{formatDate(row.original.expiry_date)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={salesLoading ? '...' : formatCurrency(todayRevenue)}
          icon={IndianRupee}
          color="primary"
        />
        <StatCard
          title="Today's Sales"
          value={countLoading ? '...' : salesTotalCount}
          icon={ShoppingBag}
          color="success"
        />
        <StatCard
          title="Low Stock"
          value={stockLoading ? '...' : lowStockCount}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Expiring (30 days)"
          value={expiryLoading ? '...' : nearExpiryCount}
          icon={CalendarX}
          color="danger"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={revenueChartData} title="Sales Revenue — Last 7 Days" height={280} />

      {/* Low stock table */}
      <Card
        title="Low Stock Medicines"
        action={
          <Link
            to={ROUTES.PHARMACY_INVENTORY}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            View All
          </Link>
        }
        noPadding
      >
        <div className="p-4">
          <DataTable
            columns={lowStockColumns}
            data={lowStockData}
            isLoading={lowStockLoading}
            pagination={false}
            emptyMessage="No low-stock medicines"
          />
        </div>
      </Card>

      {/* Near expiry table */}
      <Card
        title="Near Expiry Medicines"
        action={
          <Link
            to={ROUTES.REPORTS_EXPIRY}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            Full Report
          </Link>
        }
        noPadding
      >
        <div className="p-4">
          <DataTable
            columns={nearExpiryColumns}
            data={nearExpiryData}
            isLoading={nearExpiryLoading}
            pagination={false}
            emptyMessage="No medicines expiring in the next 30 days"
          />
        </div>
      </Card>
    </div>
  );
}
