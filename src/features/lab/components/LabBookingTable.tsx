
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { ArrowRight, Eye, FileText, Printer } from 'lucide-react';
import type { LabBooking, LabStatus } from '@/types';

interface LabBookingTableProps {
  bookings: LabBooking[];
  isLoading: boolean;
  onUpdateStatus: (booking: LabBooking) => void;
  onViewDetails: (booking: LabBooking) => void;
  onEnterReport: (booking: LabBooking) => void;
  onPrintReport: (booking: LabBooking) => void;
  onPrintReceipt: (booking: LabBooking) => void;
  getNextStatus: (current: LabStatus) => LabStatus | null;
}

const NEXT_STATUS_LABELS: Record<LabStatus, string> = {
  booked: 'Collect Sample',
  sample_collected: 'Start Processing',
  processing: 'Make Report',
  completed: 'Mark Delivered',
  delivered: '',
};

export function LabBookingTable({
  bookings,
  isLoading,
  onUpdateStatus,
  onViewDetails,
  onEnterReport,
  onPrintReport,
  onPrintReceipt,
  getNextStatus,
}: LabBookingTableProps) {
  const columns = useMemo<ColumnDef<LabBooking, unknown>[]>(
    () => [
      {
        accessorKey: 'bookingNumber',
        header: 'Booking #',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">
            {row.original.bookingNumber}
          </span>
        ),
      },
      {
        accessorKey: 'patient',
        header: 'Patient',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {row.original.patient?.name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.patient?.patientId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'tests',
        header: 'Tests',
        cell: ({ row }) => {
          const testsList = row.original.tests;
          return (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {testsList.length} test{testsList.length > 1 ? 's' : ''}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {testsList.map((t) => t.testName).join(', ')}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => (
          <StatusBadge status={row.original.paymentStatus} type="payment" />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status.replace(/_/g, ' ')} type="lab" />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const booking = row.original;
          const nextStatus = getNextStatus(booking.status);

          const canEditReport = booking.status === 'completed';
          const canViewReport = booking.status === 'completed' || booking.status === 'delivered';

          return (
            <div className="flex items-center gap-1 whitespace-nowrap">
              {nextStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3 w-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (booking.status === 'processing') {
                      onEnterReport(booking);
                    } else {
                      onUpdateStatus(booking);
                    }
                  }}
                >
                  {NEXT_STATUS_LABELS[booking.status]}
                </Button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(booking); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">View</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onPrintReceipt(booking); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Receipt</span>
              </button>
              {canViewReport && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPrintReport(booking); }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Report</span>
                </button>
              )}
              {canEditReport && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEnterReport(booking); }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Edit</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onUpdateStatus, onViewDetails, onEnterReport, onPrintReport, onPrintReceipt, getNextStatus]
  );

  return (
    <DataTable
      columns={columns}
      data={bookings}
      isLoading={isLoading}
      searchable
      searchPlaceholder="Search bookings by number, patient..."
      pagination
      pageSize={10}
      emptyMessage="No lab bookings found"
    />
  );
}
