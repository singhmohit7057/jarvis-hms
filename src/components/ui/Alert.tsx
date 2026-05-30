// #must: Alert box with colored left border, optional title, close button, and icon
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  /** Alert color variant */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Optional title (bold) */
  title?: string;
  /** Alert body content */
  children: ReactNode;
  /** Optional close callback — shows X button when provided */
  onClose?: () => void;
}

const variantConfig: Record<
  NonNullable<AlertProps['variant']>,
  { border: string; bg: string; icon: typeof Info; iconColor: string }
> = {
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  error: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
};

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border-l-4 p-4',
        config.border,
        config.bg
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</p>
        )}
        <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
