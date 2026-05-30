// #must: Vertical timeline view of today's appointments with color-coded status
import { cn } from '@/lib/utils';
import { Clock, User } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import type { Appointment } from '@/types';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSlotClick?: (appointment: Appointment) => void;
}

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    case 'in_progress':
      return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10';
    case 'completed':
      return 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10';
    case 'cancelled':
      return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
    default:
      return 'border-l-gray-300 bg-gray-50/50 dark:bg-gray-900/10';
  }
}

export function AppointmentCalendar({ appointments, onSlotClick }: AppointmentCalendarProps) {
  const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
        No appointments scheduled for today
      </div>
    );
  }

  return (
    <div className="relative space-y-1">
      {/* Timeline line */}
      <div className="absolute left-[18px] top-4 bottom-4 w-px bg-gray-200 dark:bg-slate-700" />

      {sorted.map((apt) => (
        <div
          key={apt.id}
          onClick={() => onSlotClick?.(apt)}
          className={cn(
            'relative ml-9 pl-4 pr-3 py-3 rounded-lg border-l-4 cursor-pointer',
            'transition-all hover:shadow-sm',
            getStatusColor(apt.status)
          )}
        >
          {/* Timeline dot */}
          <div
            className={cn(
              'absolute -left-[22px] top-4 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800',
              apt.status === 'completed' ? 'bg-green-500' :
              apt.status === 'in_progress' ? 'bg-amber-500' :
              apt.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-500'
            )}
          />

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {formatTime12h(apt.time)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {apt.patient?.name ?? 'Unknown Patient'}
                </span>
              </div>
            </div>
            <StatusBadge status={apt.status} type="appointment" />
          </div>
        </div>
      ))}
    </div>
  );
}
