import { useState, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/data/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ROUTES } from '@/config/routes';
import { ReportTable } from '../components/ReportTable';

interface ExpiryRow {
  id: string;
  medicine: string;
  batch: string;
  expiryDate: string;
  daysUntilExpiry: number;
  stock: number;
  value: number;
  status: 'Expired' | 'Critical' | 'Warning' | 'OK';
}

interface RawBatch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  purchase_price: number;
  medicines: { name: string } | null;
}

const TABS = [
  { id: 'expired', label: 'Expired' },
  { id: '30', label: 'Expiring in 30 Days' },
  { id: '90', label: 'Expiring in 90 Days' },
];

export function ExpiryReportPage() {
  const [activeTab, setActiveTab] = useState('expired');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in90Days = new Date(today);
  in90Days.setDate(today.getDate() + 90);

  const { data: rawBatches, isLoading } = useSupabaseQuery<RawBatch>(
    useCallback(async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 90);
      const { data, error } = await supabase
        .from('medicine_batches')
        .select('id, batch_number, expiry_date, quantity_in_stock, purchase_price, medicines(name)')
        .lte('expiry_date', cutoff.toISOString().split('T')[0])
        .gt('quantity_in_stock', 0)
        .order('expiry_date', { ascending: true });

      return { data: (data ?? []) as unknown as RawBatch[], error };
    }, [])
  );

  const allRows = useMemo<ExpiryRow[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return rawBatches.map((b) => {
      const expiry = new Date(b.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / msPerDay);

      let status: ExpiryRow['status'] = 'OK';
      if (daysUntilExpiry < 0) status = 'Expired';
      else if (daysUntilExpiry <= 30) status = 'Critical';
      else if (daysUntilExpiry <= 90) status = 'Warning';

      return {
        id: b.id,
        medicine: b.medicines?.name ?? 'Unknown',
        batch: b.batch_number,
        expiryDate: b.expiry_date,
        daysUntilExpiry,
        stock: b.quantity_in_stock,
        value: b.quantity_in_stock * (b.purchase_price ?? 0),
        status,
      };
    });
  }, [rawBatches]);

  const expiredRows = useMemo(() => allRows.filter((r) => r.daysUntilExpiry < 0), [allRows]);
  const expiring30Rows = useMemo(
    () => allRows.filter((r) => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 30),
    [allRows]
  );
  const expiring90Rows = useMemo(
    () => allRows.filter((r) => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 90),
    [allRows]
  );

  const activeRows =
    activeTab === 'expired'
      ? expiredRows
      : activeTab === '30'
      ? expiring30Rows
      : expiring90Rows;

  const columns: ColumnDef<ExpiryRow, unknown>[] = [
    { accessorKey: 'medicine', header: 'Medicine' },
    { accessorKey: 'batch', header: 'Batch' },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => formatDate(row.original.expiryDate),
    },
    {
      accessorKey: 'daysUntilExpiry',
      header: 'Days Until Expiry',
      cell: ({ row }) => {
        const d = row.original.daysUntilExpiry;
        if (d < 0)
          return (
            <span className="text-red-600 font-semibold dark:text-red-400">
              {Math.abs(d)} days ago
            </span>
          );
        return (
          <span className={d <= 30 ? 'text-amber-600 font-medium dark:text-amber-400' : ''}>
            {d} days
          </span>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => row.original.stock.toLocaleString('en-IN'),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => formatCurrency(row.original.value),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const variant =
          s === 'Expired' ? 'danger' : s === 'Critical' ? 'warning' : 'info';
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
  ];

  const exportColumns = [
    { header: 'Medicine', key: 'medicine' },
    { header: 'Batch', key: 'batch' },
    { header: 'Expiry Date', key: 'expiryDate' },
    { header: 'Days Until Expiry', key: 'daysUntilExpiry' },
    { header: 'Stock', key: 'stock' },
    { header: 'Value', key: 'value' },
    { header: 'Status', key: 'status' },
  ];

  const tabLabel =
    activeTab === 'expired'
      ? 'Expired'
      : activeTab === '30'
      ? 'Expiring in 30 Days'
      : 'Expiring in 90 Days';

  const filename = `expiry-report-${activeTab === 'expired' ? 'expired' : `within-${activeTab}-days`}`;

  return (
    <div>
      <PageHeader
        title="Expiry Report"
        subtitle="Track expired and near-expiry medicine batches"
        breadcrumbs={[
          { label: 'Reports', path: ROUTES.REPORTS },
          { label: 'Expiry Report' },
        ]}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Expired Batches"
          value={expiredRows.length}
          icon={XCircle}
          color="danger"
        />
        <StatCard
          title="Expiring in 30 Days"
          value={expiring30Rows.length}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Expiring in 90 Days"
          value={expiring90Rows.length}
          icon={Calendar}
          color="primary"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Table */}
      <ReportTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
        data={activeRows as unknown as Record<string, unknown>[]}
        title={tabLabel}
        filename={filename}
        exportColumns={exportColumns}
        isLoading={isLoading}
        searchable
        summary={[
          { label: 'Batches', value: activeRows.length.toString() },
          {
            label: 'Total Value at Risk',
            value: formatCurrency(activeRows.reduce((s, r) => s + r.value, 0)),
          },
        ]}
      />
    </div>
  );
}
