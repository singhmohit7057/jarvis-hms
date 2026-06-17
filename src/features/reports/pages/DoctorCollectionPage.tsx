import { useState, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DollarSign,
  CalendarCheck,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/data/StatCard';
import { Select } from '@/components/ui/Select';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ROUTES } from '@/config/routes';
import { ReportFilters } from '../components/ReportFilters';
import { ReportChart } from '../components/ReportChart';
import { ReportTable } from '../components/ReportTable';
import type { ReportFilterValues } from '../components/ReportFilters';

interface DoctorRow {
  doctorId: string;
  doctorName: string;
  specialization: string;
  appointments: number;
  completed: number;
  cancelled: number;
  collection: number;
  avgFee: number;
}

interface DailyRow {
  date: string;
  appointments: number;
  completed: number;
  collection: number;
}

interface RawDoctor {
  id: string;
  name: string;
  specialization: string;
}

interface RawAppointment {
  id: string;
  doctor_id: string;
  date: string;
  fee: number;
  status: string;
  payment_status: string;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function DoctorCollectionPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState<ReportFilterValues>({
    startDate: firstOfMonth,
    endDate: today,
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const { data: doctors } = useSupabaseQuery<RawDoctor>(
    useCallback(async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization')
        .eq('is_active', true)
        .order('name');
      return { data: (data ?? []) as RawDoctor[], error };
    }, [])
  );

  const { data: rawAppointments, isLoading } = useSupabaseQuery<RawAppointment>(
    async () => {
      const start = toDateStr(filters.startDate);
      const end = toDateStr(filters.endDate);

      let query = supabase
        .from('appointments')
        .select('id, doctor_id, date, fee, status, payment_status')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (selectedDoctorId) {
        query = query.eq('doctor_id', selectedDoctorId);
      }

      const { data, error } = await query;
      return { data: (data ?? []) as RawAppointment[], error };
    },
    [filters, selectedDoctorId]
  );

  const doctorOptions = [
    { value: '', label: 'All Doctors' },
    ...doctors.map((d) => ({ value: d.id, label: d.name })),
  ];

  const doctorMap = useMemo(() => {
    return doctors.reduce<Record<string, RawDoctor>>((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {});
  }, [doctors]);

  // Aggregate by doctor
  const doctorRows = useMemo<DoctorRow[]>(() => {
    const map: Record<string, DoctorRow> = {};

    rawAppointments.forEach((appt) => {
      const doc = doctorMap[appt.doctor_id];
      if (!doc) return;

      if (!map[appt.doctor_id]) {
        map[appt.doctor_id] = {
          doctorId: appt.doctor_id,
          doctorName: doc.name,
          specialization: doc.specialization,
          appointments: 0,
          completed: 0,
          cancelled: 0,
          collection: 0,
          avgFee: 0,
        };
      }

      const row = map[appt.doctor_id];
      row.appointments += 1;
      if (appt.status === 'completed' && appt.payment_status === 'paid') {
        row.completed += 1;
        row.collection += appt.fee ?? 0;
      }
      if (appt.status === 'cancelled') {
        row.cancelled += 1;
      }
    });

    return Object.values(map).map((row) => ({
      ...row,
      avgFee: row.completed > 0 ? row.collection / row.completed : 0,
    }));
  }, [rawAppointments, doctorMap]);

  // Daily breakdown (only when a specific doctor is selected)
  const dailyRows = useMemo<DailyRow[]>(() => {
    if (!selectedDoctorId) return [];

    const map: Record<string, DailyRow> = {};

    rawAppointments.forEach((appt) => {
      const date = appt.date.split('T')[0];
      if (!map[date]) {
        map[date] = { date, appointments: 0, completed: 0, collection: 0 };
      }
      map[date].appointments += 1;
      if (appt.status === 'completed' && appt.payment_status === 'paid') {
        map[date].completed += 1;
        map[date].collection += appt.fee ?? 0;
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [rawAppointments, selectedDoctorId]);

  // Summaries
  const totalCollection = doctorRows.reduce((s, r) => s + r.collection, 0);
  const totalAppointments = doctorRows.reduce((s, r) => s + r.appointments, 0);
  const totalCompleted = doctorRows.reduce((s, r) => s + r.completed, 0);
  const overallAvgFee = totalCompleted > 0 ? totalCollection / totalCompleted : 0;

  // Bar chart data
  const barData = doctorRows.map((r) => ({
    name: r.doctorName,
    Collection: Math.round(r.collection),
  }));

  const doctorColumns: ColumnDef<DoctorRow, unknown>[] = [
    { accessorKey: 'doctorName', header: 'Doctor' },
    { accessorKey: 'specialization', header: 'Specialization' },
    {
      accessorKey: 'appointments',
      header: 'Appointments',
      cell: ({ row }) => row.original.appointments.toLocaleString('en-IN'),
    },
    {
      accessorKey: 'completed',
      header: 'Completed',
      cell: ({ row }) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {row.original.completed}
        </span>
      ),
    },
    {
      accessorKey: 'cancelled',
      header: 'Cancelled',
      cell: ({ row }) => (
        <span className="text-red-500 dark:text-red-400">{row.original.cancelled}</span>
      ),
    },
    {
      accessorKey: 'collection',
      header: 'Collection',
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.collection)}</span>
      ),
    },
    {
      accessorKey: 'avgFee',
      header: 'Avg Fee',
      cell: ({ row }) => formatCurrency(row.original.avgFee),
    },
  ];

  const dailyColumns: ColumnDef<DailyRow, unknown>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'appointments',
      header: 'Appointments',
      cell: ({ row }) => row.original.appointments,
    },
    {
      accessorKey: 'completed',
      header: 'Completed',
      cell: ({ row }) => row.original.completed,
    },
    {
      accessorKey: 'collection',
      header: 'Collection',
      cell: ({ row }) => formatCurrency(row.original.collection),
    },
  ];

  const exportColumns = [
    { header: 'Doctor', key: 'doctorName' },
    { header: 'Specialization', key: 'specialization' },
    { header: 'Appointments', key: 'appointments' },
    { header: 'Completed', key: 'completed' },
    { header: 'Cancelled', key: 'cancelled' },
    { header: 'Collection', key: 'collection' },
    { header: 'Avg Fee', key: 'avgFee' },
  ];

  const dailyExportColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Appointments', key: 'appointments' },
    { header: 'Completed', key: 'completed' },
    { header: 'Collection', key: 'collection' },
  ];

  const extraFilters = (
    <div className="w-56">
      <Select
        label="Doctor"
        value={selectedDoctorId}
        onChange={(e) => setSelectedDoctorId(e.target.value)}
        options={doctorOptions}
        placeholder="All Doctors"
      />
    </div>
  );

  const selectedDoctor = selectedDoctorId
    ? doctors.find((d) => d.id === selectedDoctorId)
    : null;

  return (
    <div>
      <PageHeader
        title="Doctor Collection Report"
        subtitle="Appointment revenue and collection by doctor"
        breadcrumbs={[
          { label: 'Reports', path: ROUTES.REPORTS },
          { label: 'Doctor Collection' },
        ]}
      />

      <ReportFilters onFilter={setFilters} extraFilters={extraFilters} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Collection"
          value={formatCurrency(totalCollection)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Total Appointments"
          value={totalAppointments.toLocaleString('en-IN')}
          icon={CalendarCheck}
          color="success"
        />
        <StatCard
          title="Average Fee"
          value={formatCurrency(overallAvgFee)}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Completed Count"
          value={totalCompleted.toLocaleString('en-IN')}
          icon={CheckCircle}
          color="success"
        />
      </div>

      {/* Bar Chart */}
      {barData.length > 0 && (
        <div className="mb-6">
          <ReportChart
            type="bar"
            data={barData}
            dataKeys={[{ key: 'Collection', color: '#3b82f6', label: 'Collection (₹)' }]}
            xAxisKey="name"
            title="Collection per Doctor"
            height={320}
          />
        </div>
      )}

      {/* Doctor Summary Table */}
      <ReportTable
        columns={doctorColumns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
        data={doctorRows as unknown as Record<string, unknown>[]}
        title="Doctor-wise Collection"
        filename={`doctor-collection-${toDateStr(filters.startDate)}-to-${toDateStr(filters.endDate)}`}
        exportColumns={exportColumns}
        isLoading={isLoading}
        summary={[
          { label: 'Total Collection', value: formatCurrency(totalCollection) },
          { label: 'Total Appointments', value: totalAppointments.toString() },
          { label: 'Completed', value: totalCompleted.toString() },
        ]}
      />

      {/* Daily Breakdown for selected doctor */}
      {selectedDoctor && dailyRows.length > 0 && (
        <div className="mt-6">
          <ReportTable
            columns={dailyColumns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
            data={dailyRows as unknown as Record<string, unknown>[]}
            title={`Daily Breakdown — ${selectedDoctor.name}`}
            filename={`daily-collection-${selectedDoctor.name.replace(/\s+/g, '-').toLowerCase()}`}
            exportColumns={dailyExportColumns}
            isLoading={isLoading}
            summary={[
              {
                label: 'Total',
                value: formatCurrency(dailyRows.reduce((s, r) => s + r.collection, 0)),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
