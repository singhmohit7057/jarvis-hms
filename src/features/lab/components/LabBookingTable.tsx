// #must: DataTable column definitions and rendering for lab bookings list
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
  onPrintReceipt: (booking: LabBooking) => void;
  getNextStatus: (current: LabStatus) => LabStatus | null;
}

const NEXT_STATUS_LABELS: Record<LabStatus, string> = {
  booked: 'Collect Sample',
  sample_collected: 'Start Processing',
  processing: 'Mark Complete',
  completed: 'Mark Delivered',
  delivered: '',
};

export function LabBookingTable({
  bookings,
  isLoading,
  onUpdateStatus,
  onViewDetails,
  onEnterReport,
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
          const canEnterReport =
            booking.status === 'processing' || booking.status === 'completed';

          return (
            <div className="flex items-center gap-1.5">
              {nextStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3 w-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(booking);
                  }}
                >
                  {NEXT_STATUS_LABELS[booking.status]}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(booking);
                }}
                title="View Details"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {canEnterReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterReport(booking);
                  }}
                  title="Enter Report"
                >
                  <FileText className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintReceipt(booking);
                }}
                title="Print Receipt"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onUpdateStatus, onViewDetails, onEnterReport, onPrintReceipt, getNextStatus]
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
