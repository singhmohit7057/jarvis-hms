// #must: Activity log viewer — filterable table of all system actions with metadata detail modal
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { Modal, Card, Input, Button, Spinner } from '@/components/ui';
import { buildActivityLogColumns } from '../components/ActivityLogTable';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks';
import type { ActivityLog } from '@/types';
import { formatDateTime } from '@/lib/formatters';
import { Download } from 'lucide-react';

interface ActivityLogRow {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function mapRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? '',
    description: row.description,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

export function ActivityLogPage() {
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const { data: rows, isLoading } = useSupabaseQuery<ActivityLogRow>(
    async () =>
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    []
  );

  const allLogs: ActivityLog[] = useMemo(() => rows.map(mapRow), [rows]);

  // Collect unique user names for dropdown
  const userOptions = useMemo(() => {
    const names = Array.from(new Set(allLogs.map((l) => l.userName))).sort();
    return names;
  }, [allLogs]);

  // Apply filters client-side
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (filterFrom) {
        const logDate = new Date(log.createdAt);
        const from = new Date(filterFrom);
        from.setHours(0, 0, 0, 0);
        if (logDate < from) return false;
      }
      if (filterTo) {
        const logDate = new Date(log.createdAt);
        const to = new Date(filterTo);
        to.setHours(23, 59, 59, 999);
        if (logDate > to) return false;
      }
      if (filterUser && log.userName !== filterUser) return false;
      if (filterAction && log.action.toLowerCase() !== filterAction.toLowerCase()) return false;
      return true;
    });
  }, [allLogs, filterFrom, filterTo, filterUser, filterAction]);

  const handleExportExcel = () => {
    const sheetData = filteredLogs.map((log) => ({
      Timestamp: formatDateTime(log.createdAt),
      User: log.userName,
      Action: log.action,
      'Entity Type': log.entityType,
      'Entity ID': log.entityId || '',
      Description: log.description,
      Metadata: log.metadata ? JSON.stringify(log.metadata) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Log');

    const filename = `activity-log-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const columns = buildActivityLogColumns((log) => setSelectedLog(log));

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Track all system actions and changes"
        actions={
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="gap-2"
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              User
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {userOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Action Type
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(filterFrom || filterTo || filterUser || filterAction) && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterFrom('');
                setFilterTo('');
                setFilterUser('');
                setFilterAction('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredLogs}
          searchable
          searchPlaceholder="Search by user, action, description…"
          emptyMessage="No activity records found"
          pageSize={20}
        />
      )}

      {/* Metadata detail modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Activity Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Timestamp</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDateTime(selectedLog.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">User</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedLog.userName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Action</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {selectedLog.action}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Entity Type</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {selectedLog.entityType.replace(/_/g, ' ')}
                </p>
              </div>
              {selectedLog.entityId && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Entity ID</p>
                  <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                    {selectedLog.entityId}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Description</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedLog.description}</p>
              </div>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
                <pre className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-64 font-mono leading-relaxed">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
