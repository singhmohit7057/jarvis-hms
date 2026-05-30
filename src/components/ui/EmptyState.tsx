// #must: Centered empty state placeholder with icon, text, and optional action button
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Primary heading */
  title: string;
  /** Supporting description */
  description: string;
  /** Optional action element (e.g., a Button) */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-slate-700 mb-4">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
