import { useState, useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Package, AlertTriangle, XCircle, BarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/data/StatCard';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { MEDICINE_CATEGORIES } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { ReportChart } from '../components/ReportChart';
import { ReportTable } from '../components/ReportTable';
import type { MedicineCategory } from '@/types';

interface StockRow {
  medicineId: string;
  name: string;
  category: string;
  hsnCode: string;
  totalStock: number;
  purchaseValue: number;
  sellingValue: number;
  mrpValue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface RawMedicine {
  id: string;
  name: string;
  category: MedicineCategory;
  hsn_code: string;
  is_active: boolean;
  reorder_level: number;
  medicine_batches: Array<{
    quantity_in_stock: number;
    purchase_price: number;
    selling_price: number;
    mrp: number;
  }>;
}

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6'];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...MEDICINE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export function StockReportPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const { data: rawMedicines, isLoading } = useSupabaseQuery<RawMedicine>(
    useCallback(async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, category, hsn_code, is_active, reorder_level, medicine_batches(quantity_in_stock, purchase_price, selling_price, mrp)')
        .eq('is_active', true)
        .order('name', { ascending: true });

      return { data: (data ?? []) as RawMedicine[], error };
    }, [])
  );

  const allRows = useMemo<StockRow[]>(() => {
    return rawMedicines.map((med) => {
      const batches = med.medicine_batches ?? [];
      const totalStock = batches.reduce((s, b) => s + (b.quantity_in_stock ?? 0), 0);
      const purchaseValue = batches.reduce((s, b) => s + (b.quantity_in_stock ?? 0) * (b.purchase_price ?? 0), 0);
      const sellingValue = batches.reduce((s, b) => s + (b.quantity_in_stock ?? 0) * (b.selling_price ?? 0), 0);
      const mrpValue = batches.reduce((s, b) => s + (b.quantity_in_stock ?? 0) * (b.mrp ?? 0), 0);

      let status: StockRow['status'] = 'In Stock';
      if (totalStock === 0) status = 'Out of Stock';
      else if (totalStock <= (med.reorder_level ?? 0)) status = 'Low Stock';

      return {
        medicineId: med.id,
        name: med.name,
        category: med.category,
        hsnCode: med.hsn_code,
        totalStock,
        purchaseValue,
        sellingValue,
        mrpValue,
        status,
      };
    });
  }, [rawMedicines]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (selectedCategory && row.category !== selectedCategory) return false;
      if (showLowStockOnly && row.status === 'In Stock') return false;
      return true;
    });
  }, [allRows, selectedCategory, showLowStockOnly]);

  // Stats
  const totalMedicines = allRows.length;
  const totalPurchaseValue = allRows.reduce((s, r) => s + r.purchaseValue, 0);
  const totalSellingValue = allRows.reduce((s, r) => s + r.sellingValue, 0);
  const lowStockCount = allRows.filter((r) => r.status === 'Low Stock').length;
  const outOfStockCount = allRows.filter((r) => r.status === 'Out of Stock').length;

  // Category distribution for pie chart
  const categoryMap = allRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.totalStock;
    return acc;
  }, {});

  const pieData = Object.entries(categoryMap)
    .filter(([, qty]) => qty > 0)
    .map(([name, value]) => ({ name, value }));

  // For pie charts ReportChart only needs one dataKey entry; colors cycle per Cell
  const pieKeys = [{ key: 'value', color: PIE_COLORS[0], label: 'Stock' }];

  const columns: ColumnDef<StockRow, unknown>[] = [
    { accessorKey: 'name', header: 'Medicine' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'hsnCode', header: 'HSN Code' },
    {
      accessorKey: 'totalStock',
      header: 'Total Stock',
      cell: ({ row }) => row.original.totalStock.toLocaleString('en-IN'),
    },
    {
      accessorKey: 'purchaseValue',
      header: 'Purchase Value',
      cell: ({ row }) => formatCurrency(row.original.purchaseValue),
    },
    {
      accessorKey: 'sellingValue',
      header: 'Selling Value',
      cell: ({ row }) => formatCurrency(row.original.sellingValue),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const variant =
          s === 'Out of Stock' ? 'danger' : s === 'Low Stock' ? 'warning' : 'success';
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
  ];

  const exportColumns = [
    { header: 'Medicine', key: 'name' },
    { header: 'Category', key: 'category' },
    { header: 'HSN Code', key: 'hsnCode' },
    { header: 'Total Stock', key: 'totalStock' },
    { header: 'Purchase Value', key: 'purchaseValue' },
    { header: 'Selling Value', key: 'sellingValue' },
    { header: 'Status', key: 'status' },
  ];

  const extraFilters = (
    <>
      <div className="w-48">
        <Select
          label="Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          options={CATEGORY_OPTIONS}
        />
      </div>
      <div className="flex items-center gap-2 pt-5">
        <input
          id="low-stock-toggle"
          type="checkbox"
          checked={showLowStockOnly}
          onChange={(e) => setShowLowStockOnly(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          htmlFor="low-stock-toggle"
          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap"
        >
          Low Stock Only
        </label>
      </div>
    </>
  );

  return (
    <div>
      <PageHeader
        title="Stock Report"
        subtitle="Inventory levels, values, and category distribution"
        breadcrumbs={[
          { label: 'Reports', path: ROUTES.REPORTS },
          { label: 'Stock Report' },
        ]}
      />

      {/* Filters */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 dark:bg-slate-800 dark:border-slate-700 mb-6">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          {extraFilters}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Medicines"
          value={totalMedicines.toLocaleString('en-IN')}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Purchase Value"
          value={formatCurrency(totalPurchaseValue)}
          icon={BarChart2}
          color="success"
        />
        <StatCard
          title="Selling Value"
          value={formatCurrency(totalSellingValue)}
          icon={BarChart2}
          color="primary"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount.toLocaleString('en-IN')}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount.toLocaleString('en-IN')}
          icon={XCircle}
          color="danger"
        />
      </div>

      {/* Pie Chart */}
      <div className="mb-6">
        <ReportChart
          type="pie"
          data={pieData}
          dataKeys={pieKeys}
          xAxisKey="name"
          title="Stock Distribution by Category"
          height={320}
        />
      </div>

      {/* Report Table */}
      <ReportTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
        data={filteredRows as unknown as Record<string, unknown>[]}
        title="Medicine Stock Detail"
        filename="stock-report"
        exportColumns={exportColumns}
        isLoading={isLoading}
        searchable
        summary={[
          { label: 'Showing', value: `${filteredRows.length} medicines` },
          { label: 'Purchase Value', value: formatCurrency(filteredRows.reduce((s, r) => s + r.purchaseValue, 0)) },
          { label: 'Selling Value', value: formatCurrency(filteredRows.reduce((s, r) => s + r.sellingValue, 0)) },
        ]}
      />
    </div>
  );
}
