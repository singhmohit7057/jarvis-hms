
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Stethoscope } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NAVIGATION, type NavGroup } from '@/config/navigation';
import { SidebarNavItem } from './SidebarNavItem';
import { useClinicStore } from '@/store/clinicStore';

export interface SidebarProps {
  /** Whether sidebar is collapsed (icon-only) */
  isCollapsed: boolean;
  /** Current user role for filtering navigation items */
  userRole: string;
}

/**
 * Resolve an icon name string to a Lucide icon component.
 */
function getIconComponent(iconName: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] || LucideIcons.Circle;
}

export function Sidebar({ isCollapsed, userRole }: SidebarProps) {
  const location = useLocation();
  const clinicName = useClinicStore((s) => s.clinicName);
  const logoUrl = useClinicStore((s) => s.logoUrl);

  // Filter navigation based on user role
  const filteredNavigation: NavGroup[] = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.allowedRoles.includes(userRole as never)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-sidebar overflow-hidden flex flex-col',
        'dark:bg-slate-800 dark:border-slate-700',
        isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-100 dark:border-slate-700 shrink-0', isCollapsed && 'justify-center')}>
        {logoUrl ? (
          <img src={logoUrl} alt="Clinic logo" className="h-8 w-8 object-contain shrink-0 rounded" />
        ) : (
          <Stethoscope className="h-7 w-7 text-blue-600 dark:text-blue-400 shrink-0" />
        )}
        {!isCollapsed && (
          <span className="ml-2.5 text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {clinicName.slice(0, 12)}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredNavigation.map((group) => (
          <div key={group.group}>
            {/* Group label — hidden when collapsed */}
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.group}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  icon={getIconComponent(item.icon)}
                  label={item.title}
                  path={item.path}
                  isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
