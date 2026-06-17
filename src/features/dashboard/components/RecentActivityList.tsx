import {
  UserPlus,
  ShoppingCart,
  Calendar,
  FlaskConical,
  FilePen,
  Trash2,
  Edit,
  LogIn,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import type { ActivityLog } from '@/types';

export interface RecentActivityListProps {
  limit?: number;
  userId?: string;
}

function getIcon(action: string, entityType: string) {
  const a = (action ?? '').toUpperCase();
  const e = (entityType ?? '').toLowerCase();

  if (e === 'patient') return UserPlus;
  if (e === 'sale' || e === 'pharmacy') return ShoppingCart;
  if (e === 'appointment') return Calendar;
  if (e === 'lab' || e === 'lab_booking') return FlaskConical;
  if (e === 'consultation' || e === 'prescription') return FilePen;
  if (a === 'DELETE') return Trash2;
  if (a === 'UPDATE') return Edit;
  if (a === 'LOGIN') return LogIn;
  return Activity;
}

function getIconColor(action: string): string {
  switch (action.toUpperCase()) {
    case 'CREATE': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    case 'UPDATE': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'DELETE': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    case 'LOGIN': return 'text-violet-500 bg-violet-50 dark:bg-violet-900/20';
    default: return 'text-gray-500 bg-gray-100 dark:bg-slate-700';
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

type ActivityLogRow = Record<string, unknown>;

export function RecentActivityList({ limit = 10, userId }: RecentActivityListProps) {
  const { data, isLoading } = useSupabaseQuery<ActivityLogRow>(
    async () => {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      return query;
    },
    [limit, userId]
  );

  // Map snake_case from DB to our ActivityLog type
  const mapped: ActivityLog[] = data.map((row) => ({
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    userName: (row.user_name ?? row.userName) as string,
    action: row.action as string,
    entityType: (row.entity_type ?? row.entityType) as string,
    entityId: (row.entity_id ?? row.entityId) as string,
    description: row.description as string,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: (row.created_at ?? row.createdAt) as string,
  }));

  return (
    <Card title="Recent Activity">
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="md" className="text-blue-500" />
        </div>
      ) : mapped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Activity className="h-8 w-8 mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <ul className="space-y-1 -mx-6 -mb-6">
          {mapped.map((log) => {
            const IconComponent = getIcon(log.action, log.entityType);
            const colorClass = getIconColor(log.action);
            return (
              <li
                key={log.id}
                className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${colorClass}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                    {log.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{log.userName}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                  {relativeTime(log.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
