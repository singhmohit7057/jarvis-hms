// #must: Reusable report filter bar with date range, quick presets, and extra filter slot
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/forms/DatePickerField';
import { Filter, RotateCcw } from 'lucide-react';

export interface ReportFilterValues {
  startDate: Date;
  endDate: Date;
}

export interface ReportFiltersProps {
  /** Called when Apply is clicked with the selected filter values */
  onFilter: (filters: ReportFilterValues) => void;
  /** Optional slot for additional filter controls (e.g., category dropdown) */
  extraFilters?: ReactNode;
  /** Whether to show date range pickers (default true) */
  showDateRange?: boolean;
}

type PresetKey = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

function getPresetDates(preset: PresetKey): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return { start: monday, end: today };
    }
    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: firstDay, end: today };
    }
    case 'last_month': {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: firstDayLastMonth, end: lastDayLastMonth };
    }
    case 'custom':
    default:
      return { start: today, end: today };
  }
}

export function ReportFilters({ onFilter, extraFilters, showDateRange = true }: ReportFiltersProps) {
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [activePreset, setActivePreset] = useState<PresetKey>('this_month');

  const presets: { key: PresetKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'custom', label: 'Custom' },
  ];

  const handlePresetClick = (preset: PresetKey) => {
    setActivePreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onFilter({ startDate, endDate });
    }
  };

  const handleReset = () => {
    const { start, end } = getPresetDates('this_month');
    setStartDate(start);
    setEndDate(end);
    setActivePreset('this_month');
    onFilter({ startDate: start, endDate: end });
  };

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 dark:bg-slate-800 dark:border-slate-700 mb-6">
      {/* Quick preset buttons */}
      {showDateRange && (
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePresetClick(preset.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                activePreset === preset.key
                  ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Date pickers and extra filters */}
      <div className="flex flex-col lg:flex-row items-end gap-4">
        {showDateRange && (
          <>
            <div className="w-full lg:w-48">
              <DatePickerField
                label="From"
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  setActivePreset('custom');
                }}
                maxDate={endDate ?? undefined}
                placeholder="Start date"
              />
            </div>
            <div className="w-full lg:w-48">
              <DatePickerField
                label="To"
                selected={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setActivePreset('custom');
                }}
                minDate={startDate ?? undefined}
                maxDate={new Date()}
                placeholder="End date"
              />
            </div>
          </>
        )}

        {extraFilters && (
          <div className="flex flex-col sm:flex-row items-end gap-4 w-full lg:w-auto">
            {extraFilters}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            leftIcon={<Filter className="h-3.5 w-3.5" />}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
