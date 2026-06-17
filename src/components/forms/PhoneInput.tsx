
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  /** Label above the field */
  label?: string;
  /** Error message */
  error?: string;
  /** Current value (digits only, without prefix) */
  value: string;
  /** Change handler — receives formatted digits only */
  onChange: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder */
  placeholder?: string;
}

/**
 * Formats a phone number string into Indian format: XXXXX XXXXX
 */
function formatPhone(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 10);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)} ${clean.slice(5)}`;
}

export function PhoneInput({
  label,
  error,
  value,
  onChange,
  disabled = false,
  placeholder = '98765 43210',
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digit characters and limit to 10 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex">
        <input
          type="tel"
          value={formatPhone(value)}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm',
            'text-gray-900 placeholder:text-gray-400',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'dark:bg-slate-800 dark:text-gray-100 dark:placeholder:text-gray-500',
            'dark:focus:ring-blue-400/20 dark:focus:border-blue-400',
            error
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 dark:border-slate-600'
          )}
          aria-invalid={!!error}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
