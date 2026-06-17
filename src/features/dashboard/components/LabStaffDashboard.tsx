import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FlaskConical, TestTube, FileWarning, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/data/StatCard';
import { ChartCard } from '@/components/data/ChartCard';
import { DataTable } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import type { LabStatus } from '@/types';

const LAB_STATUS_COLORS: Record<string, string> = {
  booked: '#3b82f6',
  sample_collected: '#f59e0b',
  processing: '#8b5cf6',
  completed: '#10b981',
  delivered: '#6b7280',
};

const NEXT_STATUS: Partial<Record<LabStatus, LabStatus>> = {
  booked: 'sample_collected',
  sample_collected: 'processing',
  processing: 'completed',
  completed: 'delivered',
};

const NEXT_STATUS_LABEL: Partial<Record<LabStatus, string>> = {
  booked: 'Collect Sample',
  sample_collected: 'Start Processing',
  processing: 'Mark Complete',
  completed: 'Mark Delivered',
};

interface PendingBookingRow {
  id: string;
  booking_number: string;
  patient_name: string;
  total_amount: number;
  status: LabStatus;
  created_at: string;
}

type RawLabRow = Record<string, unknown>;

export function LabStaffDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const toast = useToast();

  const { count: todayCount, isLoading: todayLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  const { count: samplePending, isLoading: sampleLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'booked'),
    []
  );

  const { count: reportPending, isLoading: reportLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sample_collected', 'processing']),
    []
  );

  const { count: completedToday, isLoading: completedLoading } = useSupabaseQuery<unknown>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ['completed', 'delivered'])
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),
    [today]
  );

  // All bookings for status distribution pie
  const { data: allBookings } = useSupabaseQuery<{ status: string }>(
    async () => supabase.from('lab_bookings').select('status'),
    []
  );

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    allBookings.forEach((b) => {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allBookings]);

  // Pending bookings table
  const {
    data: pendingRaw,
    isLoading: pendingLoading,
    refetch,
  } = useSupabaseQuery<RawLabRow>(
    async () =>
      supabase
        .from('lab_bookings')
        .select(`
          id,
          booking_number,
          total_amount,
          status,
          created_at,
          patients ( name )
        `)
        .in('status', ['booked', 'sample_collected', 'processing'])
        .order('created_at', { ascending: true })
        .limit(20),
    []
  );

  const pendingData: PendingBookingRow[] = pendingRaw.map((row) => {
    const patients = row.patients as { name: string } | null;
    return {
      id: row.id as string,
      booking_number: row.booking_number as string,
      patient_name: patients?.name ?? 'Unknown',
      total_amount: row.total_amount as number,
      status: row.status as LabStatus,
      created_at: row.created_at as string,
    };
  });

  const handleAdvanceStatus = async (row: PendingBookingRow) => {
    const next = NEXT_STATUS[row.status];
    if (!next) return;
    const { error } = await supabase
      .from('lab_bookings')
      .update({ status: next })
      .eq('id', row.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${next.replace('_', ' ')}`);
      refetch();
    }
  };

  const columns: ColumnDef<PendingBookingRow, unknown>[] = [
    { accessorKey: 'booking_number', header: 'Booking #' },
    { accessorKey: 'patient_name', header: 'Patient' },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.total_amount),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} type="lab" />,
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const label = NEXT_STATUS_LABEL[row.original.status];
        if (!label) return null;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleAdvanceStatus(row.original);
            }}
          >
            {label}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Bookings"
          value={todayLoading ? '...' : todayCount}
          icon={FlaskConical}
          color="primary"
        />
        <StatCard
          title="Samples Pending"
          value={sampleLoading ? '...' : samplePending}
          icon={TestTube}
          color="warning"
        />
        <StatCard
          title="Reports Pending"
          value={reportLoading ? '...' : reportPending}
          icon={FileWarning}
          color="danger"
        />
        <StatCard
          title="Completed Today"
          value={completedLoading ? '...' : completedToday}
          icon={CheckCircle}
          color="success"
        />
      </div>

      {/* Pie chart + pending table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Booking Status Distribution" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={LAB_STATUS_COLORS[entry.name] ?? '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [String(value ?? ''), String(name ?? '').replace('_', ' ')] as [string, string]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => value.replace('_', ' ')}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card title="Pending Bookings" noPadding>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={pendingData}
              isLoading={pendingLoading}
              pagination={false}
              emptyMessage="No pending bookings"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
