// #must: Column definitions and row rendering for appointments DataTable
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/data/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Eye, Play, XCircle } from 'lucide-react';
import type { Appointment } from '@/types';

interface AppointmentListProps {
  onView: (appointment: Appointment) => void;
  onStartConsultation: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function useAppointmentColumns({
  onView,
  onStartConsultation,
  onCancel,
}: AppointmentListProps) {
  const columns = useMemo<ColumnDef<Appointment, unknown>[]>(
    () => [
      {
        accessorKey: 'appointmentNo',
        header: 'Apt #',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.patient?.name ?? 'Unknown',
        id: 'patientName',
        header: 'Patient',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.doctor?.name ?? 'Unknown',
        id: 'doctorName',
        header: 'Doctor',
        cell: ({ getValue }) => (
          <span className="text-gray-700 dark:text-gray-300">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        accessorKey: 'time',
        header: 'Time',
        cell: ({ getValue }) => formatTime12h(getValue() as string),
      },
      {
        accessorKey: 'fee',
        header: 'Fee',
        cell: ({ getValue }) => formatCurrency(getValue() as number),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as string} type="payment" />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as string} type="appointment" />
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const apt = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(apt);
                }}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {apt.status === 'scheduled' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartConsultation(apt);
                    }}
                    title="Start Consultation"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(apt);
                    }}
                    title="Cancel"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onStartConsultation, onCancel]
  );

  return columns;
}
