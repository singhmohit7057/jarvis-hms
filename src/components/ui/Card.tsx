// #must: Card container with optional title, subtitle, action slot, and dark mode
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  /** Card title */
  title?: string;
  /** Subtitle beneath title */
  subtitle?: string;
  /** Action element rendered top-right (e.g., a button) */
  action?: ReactNode;
  /** Card body */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Remove default padding from body */
  noPadding?: boolean;
}

export function Card({ title, subtitle, action, children, className, noPadding }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white shadow-sm border border-gray-100',
        'dark:bg-slate-800 dark:border-slate-700',
        className
      )}
    >
      {/* Header — shown when title or action is provided */}
      {(title || action) && (
        <div className="flex items-start justify-between px-6 pt-5 pb-0">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}

      {/* Body */}
      <div className={cn(!noPadding && 'p-6', !!(title || action) && !noPadding && 'pt-4')}>
        {children}
      </div>
    </div>
  );
}
