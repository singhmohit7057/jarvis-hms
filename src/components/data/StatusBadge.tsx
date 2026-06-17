
import { Badge, type BadgeProps } from '@/components/ui/Badge';

export interface StatusBadgeProps {
  /** Status string value */
  status: string;
  /** Context type for automatic variant mapping */
  type?: 'appointment' | 'payment' | 'lab';
}

/**
 * Maps status strings to badge variants based on context type.
 */
function getVariant(status: string, type: StatusBadgeProps['type']): BadgeProps['variant'] {
  const normalized = status.toLowerCase();

  // Appointment statuses
  if (type === 'appointment') {
    const map: Record<string, BadgeProps['variant']> = {
      scheduled: 'info',
      confirmed: 'info',
      'in-progress': 'warning',
      'in progress': 'warning',
      completed: 'success',
      cancelled: 'danger',
      'no-show': 'danger',
      'no show': 'danger',
    };
    return map[normalized] || 'default';
  }

  // Payment statuses
  if (type === 'payment') {
    const map: Record<string, BadgeProps['variant']> = {
      paid: 'success',
      pending: 'warning',
      overdue: 'danger',
      partial: 'warning',
      refunded: 'info',
      cancelled: 'danger',
    };
    return map[normalized] || 'default';
  }

  // Lab / test statuses
  if (type === 'lab') {
    const map: Record<string, BadgeProps['variant']> = {
      pending: 'warning',
      'in-progress': 'info',
      'in progress': 'info',
      completed: 'success',
      abnormal: 'danger',
      normal: 'success',
    };
    return map[normalized] || 'default';
  }

  // Generic fallback
  const generic: Record<string, BadgeProps['variant']> = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
    error: 'danger',
  };
  return generic[normalized] || 'default';
}

/**
 * Format status for display — capitalize first letter, replace hyphens with spaces.
 */
function formatStatus(status: string): string {
  return status
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  return (
    <Badge variant={getVariant(status, type)} size="sm">
      {formatStatus(status)}
    </Badge>
  );
}
