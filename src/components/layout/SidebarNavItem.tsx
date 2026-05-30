// #must: Single sidebar navigation item with icon, label, active state, and collapsed mode
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export interface SidebarNavItemProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Whether this item is currently active */
  isActive: boolean;
  /** Whether the sidebar is in collapsed (icon-only) mode */
  isCollapsed: boolean;
}

export function SidebarNavItem({ icon: Icon, label, path, isActive, isCollapsed }: SidebarNavItemProps) {
  const content = (
    <Link
      to={path}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-blue-600 dark:text-blue-400')} />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  // In collapsed mode, wrap with tooltip for accessibility
  if (isCollapsed) {
    return (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
