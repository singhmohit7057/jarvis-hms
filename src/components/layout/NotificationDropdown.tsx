
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, AlertTriangle, Calendar, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/config/routes';

interface LiveNotification {
  id: string;
  title: string;
  message: string;
  icon: typeof Bell;
  iconColor: string;
  route: string;
  count: number;
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchNotifications(): Promise<LiveNotification[]> {
  const today = toLocalDate(new Date());
  const in30Days = toLocalDate(new Date(new Date().setDate(new Date().getDate() + 30)));

  const [lowStock, nearExpiry, todayAppts, pendingLab] = await Promise.all([
    supabase
      .from('medicine_batches')
      .select('id, quantity_in_stock, medicines(reorder_level)')
      .gt('quantity_in_stock', 0),
    supabase
      .from('medicine_batches')
      .select('id', { count: 'exact', head: true })
      .lte('expiry_date', in30Days)
      .gte('expiry_date', today)
      .gt('quantity_in_stock', 0),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('date', today)
      .in('status', ['scheduled', 'in_progress']),
    supabase
      .from('lab_bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['booked', 'sample_collected', 'processing']),
  ]);

  const items: LiveNotification[] = [];

  type BatchRow = { id: string; quantity_in_stock: number; medicines: { reorder_level: number } | null };
  const lowStockItems = ((lowStock.data ?? []) as unknown as BatchRow[]).filter(
    (b) => b.quantity_in_stock <= (b.medicines?.reorder_level ?? 0)
  );
  if (lowStockItems.length > 0) {
    items.push({
      id: 'low_stock',
      title: 'Low Stock Alert',
      message: `${lowStockItems.length} medicine batch${lowStockItems.length > 1 ? 'es' : ''} at or below reorder level`,
      icon: Package,
      iconColor: 'text-amber-500',
      route: ROUTES.PHARMACY_INVENTORY,
      count: lowStockItems.length,
    });
  }

  if ((nearExpiry.count ?? 0) > 0) {
    items.push({
      id: 'near_expiry',
      title: 'Expiry Warning',
      message: `${nearExpiry.count} medicine${(nearExpiry.count ?? 0) > 1 ? 's' : ''} expiring within 30 days`,
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      route: ROUTES.REPORTS_EXPIRY,
      count: nearExpiry.count ?? 0,
    });
  }

  if ((todayAppts.count ?? 0) > 0) {
    items.push({
      id: 'appointments',
      title: "Today's Appointments",
      message: `${todayAppts.count} appointment${(todayAppts.count ?? 0) > 1 ? 's' : ''} pending today`,
      icon: Calendar,
      iconColor: 'text-blue-500',
      route: ROUTES.APPOINTMENTS,
      count: todayAppts.count ?? 0,
    });
  }

  if ((pendingLab.count ?? 0) > 0) {
    items.push({
      id: 'pending_lab',
      title: 'Lab Reports Pending',
      message: `${pendingLab.count} lab booking${(pendingLab.count ?? 0) > 1 ? 's' : ''} awaiting processing`,
      icon: FlaskConical,
      iconColor: 'text-purple-500',
      route: ROUTES.LAB_BOOKINGS,
      count: pendingLab.count ?? 0,
    });
  }

  return items;
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    const items = await fetchNotifications();
    setNotifications(items);
    setIsLoading(false);
  };

  // Load on mount
  useEffect(() => {
    void loadNotifications();
  }, []);

  // Reload when opening
  const handleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) void loadNotifications();
  };

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

  const totalCount = notifications.length;

  return (
    <div ref={containerRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg dark:bg-slate-800 dark:border-slate-700 animate-scale-in origin-top-right z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{totalCount} active</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">All clear — no alerts</div>
            ) : (
              notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => { setIsOpen(false); navigate(n.route); }}
                    className="w-full flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div className={cn('flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-700 shrink-0')}>
                      <Icon className={cn('h-4 w-4', n.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
