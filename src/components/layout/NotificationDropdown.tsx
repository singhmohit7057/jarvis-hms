// #must: Bell icon with notification list dropdown — placeholder notifications for now
import { useState, useRef, useEffect } from 'react';
import { Bell, Package, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: typeof Bell;
  read: boolean;
}

// Placeholder notifications
const PLACEHOLDER_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Low Stock Alert',
    message: 'Paracetamol 500mg is running low (12 units left)',
    time: '5 min ago',
    icon: Package,
    read: false,
  },
  {
    id: '2',
    title: 'Expiry Warning',
    message: '8 medicines expiring within 30 days',
    time: '1 hour ago',
    icon: AlertTriangle,
    read: false,
  },
  {
    id: '3',
    title: 'Appointment Reminder',
    message: 'Dr. Sharma has 3 appointments in next hour',
    time: '2 hours ago',
    icon: Calendar,
    read: true,
  },
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = PLACEHOLDER_NOTIFICATIONS.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg dark:bg-slate-800 dark:border-slate-700 animate-scale-in origin-top-right z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
            {PLACEHOLDER_NOTIFICATIONS.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                  )}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-700 shrink-0">
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {notification.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700">
            <button className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
