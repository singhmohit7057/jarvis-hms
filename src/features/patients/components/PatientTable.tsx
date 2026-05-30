// #must: DataTable column definitions for patient list with ID badge and action buttons
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatPhone } from '@/lib/formatters';
import type { Patient } from '@/types';

interface PatientTableActions {
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
}

export function getPatientColumns({ onView, onEdit }: PatientTableActions): ColumnDef<Patient, unknown>[] {
  return [
    {
      accessorKey: 'patientId',
      header: 'Patient ID',
      cell: ({ row }) => (
        <Badge variant="info" size="sm">
          {row.original.patientId}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'age',
      header: 'Age',
      cell: ({ row }) => <span>{row.original.age} yrs</span>,
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => formatPhone(row.original.phone),
    },
    {
      accessorKey: 'bloodGroup',
      header: 'Blood Group',
      cell: ({ row }) => row.original.bloodGroup || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
            aria-label="View patient"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
            aria-label="Edit patient"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
