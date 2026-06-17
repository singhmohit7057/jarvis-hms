import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CalendarCheck, CheckCircle, Clock, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/data/StatCard';
import { ChartCard } from '@/components/data/ChartCard';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/formatters';
import { AppointmentsTodayCard } from './AppointmentsTodayCard';

interface AppointmentStatusRow {
  status: string;
  fee: number;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toLocalDateStr(d);
  });
}

function getMonthRange() {
  const now = new Date();
  const start = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = toLocalDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { start, end };
}

export function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const today = toLocalDateStr(new Date());
  const { start: monthStart, end: monthEnd } = getMonthRange();

  // Resolve the doctor profile id for the logged-in user
  const { data: doctorRows } = useSupabaseQuery<{ id: string }>(
    async () =>
      supabase
        .from('doctors')
        .select('id')
        .eq('profile_id', user?.id ?? '')
        .limit(1),
    [user?.id]
  );
  const doctorProfileId = doctorRows[0]?.id ?? null;

  // Fetch today's appointments for this doctor
  const { data: todayAppts, isLoading: todayLoading } = useSupabaseQuery<AppointmentStatusRow>(
    async () => {
      let query = supabase
        .from('appointments')
        .select('status, fee')
        .eq('date', today);
      if (doctorProfileId) {
        query = query.eq('doctor_id', doctorProfileId);
      }
      return query;
    },
    [today, doctorProfileId]
  );

  const totalToday = todayAppts.length;
  const completedToday = todayAppts.filter((a) => a.status === 'completed').length;
  const pendingToday = todayAppts.filter((a) => ['scheduled', 'in_progress'].includes(a.status)).length;

  // Monthly collection (completed appointments fee sum)
  const { data: monthAppts, isLoading: monthLoading } = useSupabaseQuery<{ fee: number; payment_status: string }>(
    async () => {
      let query = supabase
        .from('appointments')
        .select('fee, payment_status')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .eq('status', 'completed');
      if (doctorProfileId) {
        query = query.eq('doctor_id', doctorProfileId);
      }
      return query;
    },
    [monthStart, monthEnd, doctorProfileId]
  );

  const monthCollection = monthAppts
    .filter((a) => a.payment_status === 'paid')
    .reduce((sum, a) => sum + (a.fee ?? 0), 0);

  // Weekly appointments bar chart
  const { data: weekAppts } = useSupabaseQuery<{ date: string }>(
    async () => {
      let query = supabase
        .from('appointments')
        .select('date')
        .gte('date', getLast7Days()[0])
        .lte('date', today);
      if (doctorProfileId) {
        query = query.eq('doctor_id', doctorProfileId);
      }
      return query;
    },
    [today, doctorProfileId]
  );

  const days = useMemo(() => getLast7Days(), []);

  const weekChartData = useMemo(() => {
    return days.map((date) => ({
      day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
      appointments: weekAppts.filter((a) => a.date === date).length,
    }));
  }, [weekAppts, days]);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Appointments" value={todayLoading ? '...' : totalToday} icon={CalendarCheck} color="primary" />
        <StatCard title="Pending" value={todayLoading ? '...' : pendingToday} icon={Clock} color="warning" subtitle="Scheduled + In Progress" />
        <StatCard title="Completed" value={todayLoading ? '...' : completedToday} icon={CheckCircle} color="success" />
        <StatCard title="Month's Collection" value={monthLoading ? '...' : formatCurrency(monthCollection)} icon={IndianRupee} color="primary" />
      </div>

      {/* Today's appointments timeline + weekly chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentsTodayCard doctorId={doctorProfileId ?? undefined} />

        <ChartCard title="Appointments This Week" subtitle="Daily count" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [String(value ?? ''), 'Appointments'] as [string, string]}
              />
              <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
