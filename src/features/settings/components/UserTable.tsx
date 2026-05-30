// #must: DataTable column definitions for user management with role-colored badges
import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/types';
import type { UserRole } from '@/types';
import { Badge } from '@/components/ui';
import { formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui';
import { Pencil, UserCheck, UserX } from 'lucide-react';

const ROLE_BADGE_VARIANT: Record<UserRole, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  super_admin: 'danger',
  pharmacist: 'info',
  doctor: 'success',
  lab_staff: 'warning',
  receptionist: 'default',
};

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  pharmacist: 'Pharmacist',
  doctor: 'Doctor',
  lab_staff: 'Lab Staff',
  receptionist: 'Receptionist',
};

export function buildUserColumns(
  onEdit: (user: User) => void,
  onToggleActive: (user: User) => void
): ColumnDef<User, unknown>[] {
  return [
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
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {(getValue() as string) || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => {
        const role = getValue() as UserRole;
        return (
          <Badge variant={ROLE_BADGE_VARIANT[role] ?? 'default'}>
            {ROLE_LABEL[role] ?? role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const active = getValue() as boolean;
        return (
          <Badge variant={active ? 'success' : 'default'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
              aria-label="Edit user"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(user);
              }}
              aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
              className={user.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}
            >
              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];
}
