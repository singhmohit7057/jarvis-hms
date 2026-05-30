// #must: Receptionist dashboard — registration/appointment/lab stats, quick actions, upcoming appointments

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, FlaskConical, IndianRupee, Clock } from 'lucide-react';
import { StatCard } from '@/components/data/StatCard';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { formatCurrency } from '@/lib/formatters';
import { ROUTES } from '@/config/routes';
import { QuickActions } from './QuickActions';

interface UpcomingAppt {
  id: string;
  time: string;
  status: string;
  patient_name: string;
  doctor_name: string;
}

type RawApptRow = Record<string, unknown>;

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5); // HH:mm

  const { count: patientsToday, isLoading: pLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { count: apptsToday, isLoading: aLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('date', today),
    [today]
  );

  const { count: labToday, isLoading: lLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { data: collectionsData, isLoading: cLoading } = useSupabaseQuery<{ fee: number }>(
    async () =>
      supabase
        .from('appointments')
        .select('fee')
        .eq('date', today)
        .eq('payment_status', 'paid'),
    [today]
  );

  const collectionsTotal = collectionsData.reduce((sum, r) => sum + (r.fee ?? 0), 0);

  // Upcoming appointments (next 5, from now)
  const { data: upcomingRaw, isLoading: upcomingLoading } = useSupabaseQuery<RawApptRow>(
    async () =>
      supabase
        .from('appointments')
        .select(`
          id,
          time,
          status,
          patients ( name ),
          doctors ( name )
        `)
        .eq('date', today)
        .gte('time', nowTime)
        .in('status', ['scheduled', 'in_progress'])
        .order('time', { ascending: true })
        .limit(5),
    [today, nowTime]
  );

  const upcomingAppts: UpcomingAppt[] = useMemo(
    () =>
      upcomingRaw.map((row) => {
        const patients = row.patients as { name: string } | null;
        const doctors = row.doctors as { name: string } | null;
        return {
          id: row.id as string,
          time: row.time as string,
          status: row.status as string,
          patient_name: patients?.name ?? 'Unknown',
          doctor_name: doctors?.name ?? 'Unknown',
        };
      }),
    [upcomingRaw]
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patients Registered"
          value={pLoading ? '...' : patientsToday}
          icon={UserPlus}
          color="primary"
        />
        <StatCard
          title="Appointments Today"
          value={aLoading ? '...' : apptsToday}
          icon={Calendar}
          color="success"
        />
        <StatCard
          title="Lab Bookings Today"
          value={lLoading ? '...' : labToday}
          icon={FlaskConical}
          color="warning"
        />
        <StatCard
          title="Collections Today"
          value={cLoading ? '...' : formatCurrency(collectionsTotal)}
          icon={IndianRupee}
          color="primary"
        />
      </div>

      {/* Upcoming appointments + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Appointments">
          {upcomingLoading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner size="md" className="text-blue-500" />
            </div>
          ) : upcomingAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Clock className="h-8 w-8 mb-2" />
              <p className="text-sm">No upcoming appointments</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700 -mx-6 -mb-6">
              {upcomingAppts.map((appt) => (
                <li
                  key={appt.id}
                  onClick={() => navigate(ROUTES.APPOINTMENTS)}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
                >
                  <div className="w-16 shrink-0 text-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                      {formatTime(appt.time)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {appt.patient_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">Dr. {appt.doctor_name}</p>
                  </div>
                  <StatusBadge status={appt.status} type="appointment" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <QuickActions role="receptionist" />
      </div>
    </div>
  );
}
