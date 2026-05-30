// #must: Super admin dashboard — 6 stat cards, revenue + sales/appointment charts, activity + quick actions

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  IndianRupee,
  Pill,
  CalendarCheck,
  FlaskConical,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { StatCard } from '@/components/data/StatCard';
import { ChartCard } from '@/components/data/ChartCard';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { formatCurrency } from '@/lib/formatters';
import { RevenueChart } from './RevenueChart';
import { RecentActivityList } from './RecentActivityList';
import { QuickActions } from './QuickActions';

interface DayStat {
  date: string;
  revenue: number;
  appointments: number;
  sales: number;
}

// Custom tooltip typed loosely to avoid recharts internal type path issues
function SalesAppointmentsTooltip({ active, payload, label }: { active?: boolean; payload?: {name?: string; color?: string; value?: number | string}[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-semibold">{String(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

export function SuperAdminDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = getLast7Days()[0];

  // --- Stat card queries ---

  const { data: revenueData, isLoading: revLoading } = useSupabaseQuery<{ grand_total: number }>(
    async () =>
      supabase
        .from('sales')
        .select('grand_total')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { count: salesCount, isLoading: salesLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { count: apptCount, isLoading: apptLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('date', today),
    [today]
  );

  const { count: labCount, isLoading: labLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
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

  const { count: pendingLabCount, isLoading: pendingLabLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ['booked', 'sample_collected', 'processing']),
    []
  );

  // --- Chart queries ---

  const { data: chartSales } = useSupabaseQuery<{ created_at: string; grand_total: number }>(
    async () =>
      supabase
        .from('sales')
        .select('created_at, grand_total')
        .gte('created_at', `${sevenDaysAgo}T00:00:00`)
        .order('created_at', { ascending: true }),
    [sevenDaysAgo]
  );

  const { data: chartAppts } = useSupabaseQuery<{ date: string }>(
    async () =>
      supabase
        .from('appointments')
        .select('date')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true }),
    [sevenDaysAgo]
  );

  // Build 7-day chart data — memoised so deps stay stable
  const days = useMemo(() => getLast7Days(), []);

  const revenueChartData = useMemo(() => {
    return days.map((date) => {
      const revenue = chartSales
        .filter((s) => (s.created_at as string).startsWith(date))
        .reduce((sum, s) => sum + (s.grand_total ?? 0), 0);
      return { date, revenue };
    });
  }, [chartSales, days]);

  const combinedChartData: DayStat[] = useMemo(() => {
    return days.map((date) => {
      const revenue = chartSales
        .filter((s) => (s.created_at as string).startsWith(date))
        .reduce((sum, s) => sum + (s.grand_total ?? 0), 0);
      const salesCount_ = chartSales.filter((s) => (s.created_at as string).startsWith(date)).length;
      const appointments = chartAppts.filter((a) => a.date === date).length;
      const label = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      return { date: label, revenue, appointments, sales: salesCount_ };
    });
  }, [chartSales, chartAppts, days]);

  const todayRevenue = revenueData.reduce((sum, r) => sum + (r.grand_total ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Today's Revenue"
          value={revLoading ? '...' : formatCurrency(todayRevenue)}
          icon={IndianRupee}
          color="primary"
        />
        <StatCard
          title="Medicine Sales"
          value={salesLoading ? '...' : salesCount}
          icon={Pill}
          color="success"
        />
        <StatCard
          title="Appointments"
          value={apptLoading ? '...' : apptCount}
          icon={CalendarCheck}
          color="primary"
        />
        <StatCard
          title="Lab Tests"
          value={labLoading ? '...' : labCount}
          icon={FlaskConical}
          color="success"
        />
        <StatCard
          title="Low Stock"
          value={stockLoading ? '...' : lowStockCount}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Pending Lab Reports"
          value={pendingLabLoading ? '...' : pendingLabCount}
          icon={FileWarning}
          color="danger"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueChartData} title="Revenue Trend" height={280} />

        <ChartCard title="Sales vs Appointments" subtitle="Last 7 days" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={combinedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<SalesAppointmentsTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="appointments" name="Appointments" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityList limit={10} />
        <QuickActions role="super_admin" />
      </div>
    </div>
  );
}
