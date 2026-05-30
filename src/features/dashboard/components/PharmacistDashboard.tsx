// #must: Pharmacist dashboard — sales stats, revenue chart, low stock + near expiry tables

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

export function PharmacistDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = getLast7Days()[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: todaySales, isLoading: salesLoading } = useSupabaseQuery<{ grand_total: number }>(
    async () =>
      supabase
        .from('sales')
        .select('grand_total')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { count: salesTotalCount, isLoading: countLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { count: lowStockCount, isLoading: stockLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id', { count: 'exact', head: true })
        .lt('quantity_in_stock', 10),
    []
  );

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
        .gte('created_at', `${sevenDaysAgo}T00:00:00`)
        .order('created_at', { ascending: true }),
    [sevenDaysAgo]
  );

  const days = useMemo(() => getLast7Days(), []);

  const revenueChartData = useMemo(() => {
    return days.map((date) => ({
      date,
      revenue: chartSales
        .filter((s) => (s.created_at as string).startsWith(date))
        .reduce((sum, s) => sum + (s.grand_total ?? 0), 0),
    }));
  }, [chartSales, days]);

  // Low stock table
  const { data: lowStockData, isLoading: lowStockLoading } = useSupabaseQuery<LowStockRow>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id, medicine_name, batch_number, quantity_in_stock, expiry_date')
        .lt('quantity_in_stock', 10)
        .order('quantity_in_stock', { ascending: true })
        .limit(10),
    []
  );

  // Near expiry table
  const { data: nearExpiryData, isLoading: nearExpiryLoading } = useSupabaseQuery<NearExpiryRow>(
    async () =>
      supabase
        .from('medicine_batches')
        .select('id, medicine_name, batch_number, quantity_in_stock, expiry_date')
        .lte('expiry_date', thirtyDaysLater)
        .gte('expiry_date', today)
        .gt('quantity_in_stock', 0)
        .order('expiry_date', { ascending: true })
        .limit(10),
    [today, thirtyDaysLater]
  );

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
