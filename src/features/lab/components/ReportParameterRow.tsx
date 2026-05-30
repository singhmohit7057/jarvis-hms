// #must: Single parameter row in lab report entry with auto-flag calculation
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { LabResultEntry } from '@/types';

interface ReportParameterRowProps {
  parameter: {
    name: string;
    unit: string;
    normalRange: string;
  };
  value: string;
  onChange: (value: string) => void;
  flag: LabResultEntry['flag'];
  onFlagChange: (flag: LabResultEntry['flag']) => void;
}

const FLAG_VARIANTS = {
  normal: 'success',
  high: 'danger',
  low: 'info',
  critical: 'danger',
} as const;

const FLAG_LABELS = {
  normal: 'Normal',
  high: 'High ↑',
  low: 'Low ↓',
  critical: 'Critical',
} as const;

function parseRange(rangeStr: string): { min: number; max: number } | null {
  const match = rangeStr.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
  if (!match) return null;
  const min = parseFloat(match[1]);
  const max = parseFloat(match[2]);
  if (isNaN(min) || isNaN(max)) return null;
  return { min, max };
}

function calculateFlag(value: string, normalRange: string): LabResultEntry['flag'] {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'normal';

  const range = parseRange(normalRange);
  if (!range) return 'normal';

  if (numValue < range.min) return 'low';
  if (numValue > range.max) return 'high';
  return 'normal';
}

export function ReportParameterRow({
  parameter,
  value,
  onChange,
  flag,
  onFlagChange,
}: ReportParameterRowProps) {
  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    const autoFlag = calculateFlag(newValue, parameter.normalRange);
    onFlagChange(autoFlag);
  };

  return (
    <tr className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
        {parameter.name}
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          className={cn(
            'w-full rounded-md border px-3 py-1.5 text-sm',
            'bg-white border-gray-300 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100',
            flag === 'high' && 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800',
            flag === 'low' && 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800',
            flag === 'critical' && 'border-red-500 bg-red-100 dark:bg-red-900/20 dark:border-red-700'
          )}
          placeholder="Enter value"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {parameter.unit}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {parameter.normalRange}
      </td>
      <td className="px-4 py-3">
        {value ? (
          <Badge variant={FLAG_VARIANTS[flag]} size="sm">
            {FLAG_LABELS[flag]}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">--</span>
        )}
      </td>
    </tr>
  );
}

export { calculateFlag, parseRange };
