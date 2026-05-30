// #must: Card wrapper for charts with title, subtitle, and action slot
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  /** Card title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Action element in top-right (e.g., date range picker) */
  action?: ReactNode;
  /** Chart content (Recharts component etc.) */
  children: ReactNode;
  /** Chart container height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  height = 300,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
      </div>

      {/* Chart body */}
      <div className="px-6 pb-5" style={{ height }}>
        {children}
      </div>
    </div>
  );
}
