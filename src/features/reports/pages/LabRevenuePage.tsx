import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DollarSign,
  FlaskConical,
  TrendingUp,
  FileText,
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

interface DailyRow {
  date: string;
  bookings: number;
  tests: number;
  revenue: number;
  pendingReports: number;
}

interface TestRow {
  testName: string;
  category: string;
  timesBooked: number;
  revenue: number;
  percentOfTotal: number;
}

interface RawBooking {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  lab_booking_tests: Array<{
    test_name: string;
    price: number;
    lab_tests: { category: string } | null;
  }>;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function LabRevenuePage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState<ReportFilterValues>({
    startDate: firstOfMonth,
    endDate: today,
  });

  const { data: rawBookings, isLoading } = useSupabaseQuery<RawBooking>(
    async () => {
      const start = toDateStr(filters.startDate);
      const end = toDateStr(filters.endDate);

      const { data, error } = await supabase
        .from('lab_bookings')
        .select(
          'id, created_at, total_amount, status, payment_status, lab_booking_tests(test_name, price, lab_tests(category))'
        )
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)
        .order('created_at', { ascending: true });

      return { data: (data ?? []) as unknown as RawBooking[], error };
    },
    [filters]
  );

  // Aggregate daily rows
  const dailyRows = useMemo<DailyRow[]>(() => {
    const map: Record<string, DailyRow> = {};

    rawBookings.forEach((booking) => {
      const date = booking.created_at.split('T')[0];
      if (!map[date]) {
        map[date] = { date, bookings: 0, tests: 0, revenue: 0, pendingReports: 0 };
      }
      map[date].bookings += 1;
      map[date].tests += booking.lab_booking_tests?.length ?? 0;
      map[date].revenue += booking.total_amount ?? 0;
      if (booking.status !== 'completed' && booking.status !== 'delivered') {
        map[date].pendingReports += 1;
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [rawBookings]);

  // Aggregate test rows
  const testRows = useMemo<TestRow[]>(() => {
    const map: Record<string, { timesBooked: number; revenue: number; category: string }> = {};

    rawBookings.forEach((booking) => {
      (booking.lab_booking_tests ?? []).forEach((bt) => {
        const name = bt.test_name;
        if (!map[name]) {
          map[name] = {
            timesBooked: 0,
            revenue: 0,
            category: bt.lab_tests?.category ?? 'General',
          };
        }
        map[name].timesBooked += 1;
        map[name].revenue += bt.price ?? 0;
      });
    });

    const totalRevenue = Object.values(map).reduce((s, v) => s + v.revenue, 0);

    return Object.entries(map)
      .map(([testName, v]) => ({
        testName,
        category: v.category,
        timesBooked: v.timesBooked,
        revenue: v.revenue,
        percentOfTotal: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [rawBookings]);

  // Stats
  const totalRevenue = dailyRows.reduce((s, r) => s + r.revenue, 0);
  const totalBookings = dailyRows.reduce((s, r) => s + r.bookings, 0);
  const totalTests = dailyRows.reduce((s, r) => s + r.tests, 0);
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Category pie data
  const categoryMap = rawBookings.reduce<Record<string, number>>((acc, booking) => {
    (booking.lab_booking_tests ?? []).forEach((bt) => {
      const cat = bt.lab_tests?.category ?? 'General';
      acc[cat] = (acc[cat] ?? 0) + (bt.price ?? 0);
    });
    return acc;
  }, {});

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  // For pie charts, only one dataKey entry is used; Cell colors cycle automatically
  const pieKeys = [{ key: 'value', color: '#3b82f6', label: 'Revenue' }];

  // Bar chart data
  const barData = dailyRows.map((r) => ({
    date: formatDate(r.date),
    Revenue: Math.round(r.revenue),
  }));

  // Columns
  const dailyColumns: ColumnDef<DailyRow, unknown>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'bookings',
      header: 'Bookings',
      cell: ({ row }) => row.original.bookings,
    },
    {
      accessorKey: 'tests',
      header: 'Tests',
      cell: ({ row }) => row.original.tests,
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.revenue)}</span>
      ),
    },
    {
      accessorKey: 'pendingReports',
      header: 'Pending Reports',
      cell: ({ row }) =>
        row.original.pendingReports > 0 ? (
          <span className="text-amber-600 font-medium dark:text-amber-400">
            {row.original.pendingReports}
          </span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400">0</span>
        ),
    },
  ];

  const testColumns: ColumnDef<TestRow, unknown>[] = [
    { accessorKey: 'testName', header: 'Test Name' },
    { accessorKey: 'category', header: 'Category' },
    {
      accessorKey: 'timesBooked',
      header: 'Times Booked',
      cell: ({ row }) => row.original.timesBooked.toLocaleString('en-IN'),
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => formatCurrency(row.original.revenue),
    },
    {
      accessorKey: 'percentOfTotal',
      header: '% of Total',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-24 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(row.original.percentOfTotal, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 w-10">
            {row.original.percentOfTotal.toFixed(1)}%
          </span>
        </div>
      ),
    },
  ];

  const dailyExportColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Bookings', key: 'bookings' },
    { header: 'Tests', key: 'tests' },
    { header: 'Revenue', key: 'revenue' },
    { header: 'Pending Reports', key: 'pendingReports' },
  ];

  const testExportColumns = [
    { header: 'Test Name', key: 'testName' },
    { header: 'Category', key: 'category' },
    { header: 'Times Booked', key: 'timesBooked' },
    { header: 'Revenue', key: 'revenue' },
    { header: '% of Total', key: 'percentOfTotal' },
  ];

  return (
    <div>
      <PageHeader
        title="Lab Revenue Report"
        subtitle="Lab booking revenue, test performance, and daily breakdown"
        breadcrumbs={[
          { label: 'Reports', path: ROUTES.REPORTS },
          { label: 'Lab Revenue' },
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
          title="Total Bookings"
          value={totalBookings.toLocaleString('en-IN')}
          icon={FileText}
          color="success"
        />
        <StatCard
          title="Avg Booking Value"
          value={formatCurrency(avgBookingValue)}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Tests Conducted"
          value={totalTests.toLocaleString('en-IN')}
          icon={FlaskConical}
          color="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {pieData.length > 0 && (
          <ReportChart
            type="pie"
            data={pieData}
            dataKeys={pieKeys}
            xAxisKey="name"
            title="Revenue by Test Category"
            height={300}
          />
        )}
        <ReportChart
          type="bar"
          data={barData}
          dataKeys={[{ key: 'Revenue', color: '#3b82f6', label: 'Revenue (₹)' }]}
          xAxisKey="date"
          title="Daily Revenue"
          height={300}
        />
      </div>

      {/* Daily Table */}
      <div className="mb-6">
        <ReportTable
          columns={dailyColumns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
          data={dailyRows as unknown as Record<string, unknown>[]}
          title="Daily Revenue Breakdown"
          filename={`lab-revenue-daily-${toDateStr(filters.startDate)}-to-${toDateStr(filters.endDate)}`}
          exportColumns={dailyExportColumns}
          isLoading={isLoading}
          summary={[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
            { label: 'Total Bookings', value: totalBookings.toString() },
          ]}
        />
      </div>

      {/* Test Breakdown Table */}
      <ReportTable
        columns={testColumns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
        data={testRows as unknown as Record<string, unknown>[]}
        title="Test-wise Revenue Breakdown"
        filename={`lab-test-revenue-${toDateStr(filters.startDate)}-to-${toDateStr(filters.endDate)}`}
        exportColumns={testExportColumns}
        isLoading={isLoading}
        searchable
        summary={[
          { label: 'Unique Tests', value: testRows.length.toString() },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
        ]}
      />
    </div>
  );
}
