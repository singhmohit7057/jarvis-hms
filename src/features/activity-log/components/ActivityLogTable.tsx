// #must: DataTable column definitions for activity log — timestamps, user, action, entity, details
import type { ColumnDef } from '@tanstack/react-table';
import type { ActivityLog } from '@/types';
import { Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/formatters';
import { Button } from '@/components/ui';
import { Eye } from 'lucide-react';

type ActionType = 'create' | 'update' | 'delete' | string;

function getActionBadgeVariant(action: ActionType): 'success' | 'info' | 'danger' | 'default' {
  if (action === 'create') return 'success';
  if (action === 'update') return 'info';
  if (action === 'delete') return 'danger';
  return 'default';
}

function formatAction(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
}

export function buildActivityLogColumns(
  onViewDetails: (log: ActivityLog) => void
): ColumnDef<ActivityLog, unknown>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {formatDateTime(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ getValue }) => {
        const action = getValue() as string;
        return (
          <Badge variant={getActionBadgeVariant(action)}>
            {formatAction(action)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'entityType',
      header: 'Entity Type',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
          {(getValue() as string).replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300 max-w-xs block truncate">
          {getValue() as string}
        </span>
      ),
    },
    {
      id: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const log = row.original;
        if (!log.metadata || Object.keys(log.metadata).length === 0) {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(log);
            }}
            className="gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        );
      },
    },
  ];
}
