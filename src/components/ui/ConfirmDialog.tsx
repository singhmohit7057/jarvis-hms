// #must: Confirmation dialog built on Modal with confirm/cancel actions
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  /** Whether dialog is visible */
  isOpen: boolean;
  /** Close handler (cancel) */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog body message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Visual variant affecting icon and confirm button color */
  variant?: 'danger' | 'warning' | 'info';
  /** Show loading state on confirm button */
  isLoading?: boolean;
}

const variantConfig: Record<
  NonNullable<ConfirmDialogProps['variant']>,
  { icon: typeof Info; iconBg: string; iconColor: string; buttonVariant: 'danger' | 'primary' | 'secondary' }
> = {
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonVariant: 'primary',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'primary',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={cn('flex items-center justify-center h-12 w-12 rounded-full mb-4', config.iconBg)}>
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full">
          <Button variant="secondary" onClick={onClose} fullWidth disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            fullWidth
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
