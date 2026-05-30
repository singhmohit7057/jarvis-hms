// #must: Overlay sidebar for mobile — slides in from left with backdrop
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { X, Stethoscope } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NAVIGATION } from '@/config/navigation';
import { SidebarNavItem } from './SidebarNavItem';

export interface MobileNavProps {
  /** Whether the mobile nav is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Current user role for filtering */
  userRole: string;
}

function getIconComponent(iconName: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] || LucideIcons.Circle;
}

export function MobileNav({ isOpen, onClose, userRole }: MobileNavProps) {
  const location = useLocation();

  // Close when route changes
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter navigation by role
  const filteredNavigation = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.allowedRoles.includes(userRole as never)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-fade-in lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[var(--sidebar-width)] bg-white dark:bg-slate-800 shadow-xl flex flex-col lg:hidden',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Jarvis</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {filteredNavigation.map((group) => (
            <div key={group.group}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.path}
                    icon={getIconComponent(item.icon)}
                    label={item.title}
                    path={item.path}
                    isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                    isCollapsed={false}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
