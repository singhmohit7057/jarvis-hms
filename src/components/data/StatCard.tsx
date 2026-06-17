
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  /** Card title / label */
  title: string;
  /** Main displayed value */
  value: string | number;
  /** Lucide icon displayed in colored circle */
  icon: LucideIcon;
  /** Optional trend data */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Color theme for icon background */
  color?: 'primary' | 'success' | 'warning' | 'danger';
  /** Optional small subtitle shown below the title */
  subtitle?: string;
}

const colorConfig: Record<NonNullable<StatCardProps['color']>, { bg: string; icon: string }> = {
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
  },
};

export function StatCard({ title, value, icon: Icon, trend, color = 'primary', subtitle }: StatCardProps) {
  const { bg, icon: iconColor } = colorConfig[color];

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={cn('flex items-center justify-center h-11 w-11 rounded-lg', bg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>

        {/* Trend */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5',
              trend.isPositive
                ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
                : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value & Title */}
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
