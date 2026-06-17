
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { LAB_STATUS } from '@/config/constants';
import type { LabStatus } from '@/types';

interface LabStatusTrackerProps {
  currentStatus: LabStatus;
}

const STATUS_LABELS: Record<LabStatus, string> = {
  booked: 'Booked',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  delivered: 'Delivered',
};

export function LabStatusTracker({ currentStatus }: LabStatusTrackerProps) {
  const currentIndex = LAB_STATUS.indexOf(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {LAB_STATUS.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={status} className="flex flex-1 items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
                    isCompleted &&
                      'bg-emerald-500 border-emerald-500 text-white',
                    isCurrent &&
                      'bg-blue-500 border-blue-500 text-white animate-pulse',
                    isFuture &&
                      'bg-white border-gray-300 text-gray-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs text-center whitespace-nowrap',
                    isCompleted && 'text-emerald-600 dark:text-emerald-400 font-medium',
                    isCurrent && 'text-blue-600 dark:text-blue-400 font-semibold',
                    isFuture && 'text-gray-400 dark:text-slate-500'
                  )}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>

              {/* Connecting line */}
              {index < LAB_STATUS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    index < currentIndex
                      ? 'bg-emerald-500'
                      : 'bg-gray-200 dark:bg-slate-700'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
