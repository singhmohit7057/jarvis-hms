
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** Tooltip text content */
  content: string;
  /** Position relative to the trigger element */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Trigger element (hovered to show tooltip) */
  children: ReactNode;
}

const positionStyles: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, position = 'top', children }: TooltipProps) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div
        className={cn(
          'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md',
          'whitespace-nowrap pointer-events-none',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'dark:bg-slate-700',
          positionStyles[position]
        )}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
}
