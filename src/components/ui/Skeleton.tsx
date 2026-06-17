
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  /** Width (CSS value or Tailwind class) */
  width?: string;
  /** Height (CSS value or Tailwind class) */
  height?: string;
  /** Additional CSS classes */
  className?: string;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ width, height, className, variant = 'text' }: SkeletonProps) {
  const variantStyles: Record<NonNullable<SkeletonProps['variant']>, string> = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-slate-700',
        variantStyles[variant],
        className
      )}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
      aria-hidden="true"
    />
  );
}
