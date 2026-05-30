// #must: Sales report page — revenue, GST, and daily trend for a selected date range

import { useState, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/data/StatCard';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ROUTES } from '@/config/routes';
import { ReportFilters } from '../components/ReportFilters';
import { ReportChart } from '../components/ReportChart';
import { ReportTable } from '../components/ReportTable';
import type { ReportFilterValues } from '../components/ReportFilters';

interface SalesRow {
  date: string;
  invoiceCount: number;
  totalRevenue: number;
  gstAmount: number;
  netRevenue: number;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function SalesReportPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState<ReportFilterValues>({
    startDate: firstOfMonth,
    endDate: today,
  });

  const { data: rawSales, isLoading } = useSupabaseQuery(
    useCallback(async () => {
      const start = toDateStr(filters.startDate);
      const end = toDateStr(filters.endDate);

      const { data, error } = await supabase
        .from('sales')
        .select('created_at, grand_total, gst_total, subtotal, discount_amount')
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)
        .order('created_at', { ascending: true });

      return { data: data ?? [], error };
    }, [filters])
  );

  // Aggregate by date
  const salesByDate = rawSales.reduce<Record<string, SalesRow>>((acc, sale) => {
    const date = (sale as { created_at: string }).created_at.split('T')[0];
    const grandTotal = (sale as { grand_total: number }).grand_total ?? 0;
    const gstTotal = (sale as { gst_total: number }).gst_total ?? 0;

    if (!acc[date]) {
      acc[date] = {
        date,
        invoiceCount: 0,
        totalRevenue: 0,
        gstAmount: 0,
        netRevenue: 0,
      };
    }
    acc[date].invoiceCount += 1;
    acc[date].totalRevenue += grandTotal;
    acc[date].gstAmount += gstTotal;
    acc[date].netRevenue += grandTotal - gstTotal;

    return acc;
  }, {});

  const tableData: SalesRow[] = Object.values(salesByDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const chartData = tableData.map((row) => ({
    date: formatDate(row.date),
    Revenue: Math.round(row.totalRevenue),
    'Net Revenue': Math.round(row.netRevenue),
  }));

  const totalRevenue = tableData.reduce((s, r) => s + r.totalRevenue, 0);
  const totalSales = tableData.reduce((s, r) => s + r.invoiceCount, 0);
  const totalGst = tableData.reduce((s, r) => s + r.gstAmount, 0);
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const columns: ColumnDef<SalesRow, unknown>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'invoiceCount',
      header: 'Invoice Count',
      cell: ({ row }) => row.original.invoiceCount.toLocaleString('en-IN'),
    },
    {
      accessorKey: 'totalRevenue',
      header: 'Total Revenue',
      cell: ({ row }) => formatCurrency(row.original.totalRevenue),
    },
    {
      accessorKey: 'gstAmount',
      header: 'GST Amount',
      cell: ({ row }) => formatCurrency(row.original.gstAmount),
    },
    {
      accessorKey: 'netRevenue',
      header: 'Net Revenue',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.netRevenue)}
        </span>
      ),
    },
  ];

  const exportColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Invoice Count', key: 'invoiceCount' },
    { header: 'Total Revenue', key: 'totalRevenue' },
    { header: 'GST Amount', key: 'gstAmount' },
    { header: 'Net Revenue', key: 'netRevenue' },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Report"
        subtitle="Revenue, GST, and daily sales breakdown"
        breadcrumbs={[
          { label: 'Reports', path: ROUTES.REPORTS_SALES },
          { label: 'Sales Report' },
        ]}
      />

      <ReportFilters onFilter={setFilters} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Total Sales"
          value={totalSales.toLocaleString('en-IN')}
          icon={ShoppingCart}
          color="success"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(avgOrderValue)}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Total GST Collected"
          value={formatCurrency(totalGst)}
          icon={Receipt}
          color="danger"
        />
      </div>

      {/* Area Chart */}
      <div className="mb-6">
        <ReportChart
          type="area"
          data={chartData}
          dataKeys={[
            { key: 'Revenue', color: '#3b82f6', label: 'Total Revenue' },
            { key: 'Net Revenue', color: '#10b981', label: 'Net Revenue' },
          ]}
          xAxisKey="date"
          title="Daily Revenue Trend"
          height={300}
        />
      </div>

      {/* Report Table */}
      <ReportTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
        data={tableData as unknown as Record<string, unknown>[]}
        title="Daily Sales Breakdown"
        filename={`sales-report-${toDateStr(filters.startDate)}-to-${toDateStr(filters.endDate)}`}
        exportColumns={exportColumns}
        isLoading={isLoading}
        summary={[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Total GST', value: formatCurrency(totalGst) },
          { label: 'Net Revenue', value: formatCurrency(totalRevenue - totalGst) },
        ]}
      />
    </div>
  );
}
