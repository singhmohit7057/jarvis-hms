
import DatePicker from 'react-datepicker';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

export interface DatePickerFieldProps {
  label?: string;
  error?: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  showTimeSelectOnly?: boolean;
  timeIntervals?: number;
  showMonthYearPicker?: boolean;
  placeholder?: string;
  disabled?: boolean;
  portalId?: string;
}

export function DatePickerField({
  label,
  error,
  selected,
  onChange,
  dateFormat = 'dd/MM/yyyy',
  minDate,
  maxDate,
  showTimeSelect = false,
  showTimeSelectOnly = false,
  timeIntervals = 15,
  showMonthYearPicker = false,
  placeholder = 'Select date',
  disabled = false,
  portalId,
}: DatePickerFieldProps) {
  const isTimeOnly = showTimeSelectOnly;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {isTimeOnly
          ? <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
          : <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        }
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat={dateFormat}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect || showTimeSelectOnly}
          showTimeSelectOnly={showTimeSelectOnly}
          timeIntervals={timeIntervals}
          timeFormat="HH:mm"
          showMonthYearPicker={showMonthYearPicker}
          placeholderText={placeholder}
          disabled={disabled}
          showPopperArrow={false}
          popperPlacement="bottom-start"
          portalId={portalId}
          className={cn(
            'w-full rounded-lg border bg-white pl-10 pr-3.5 py-2.5 text-sm',
            'text-gray-900 placeholder:text-gray-400',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'dark:bg-slate-800 dark:text-gray-100 dark:placeholder:text-gray-500',
            error
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 dark:border-slate-600'
          )}
          wrapperClassName="w-full"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
