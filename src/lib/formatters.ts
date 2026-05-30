// #must: Formatting utilities — currency (INR), dates, phone numbers, percentages

/**
 * Format a number as Indian Rupees (₹1,23,456.00).
 * Uses the Indian numbering system (en-IN locale).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object.
 * Default format: DD/MM/YYYY
 */
export function formatDate(date: string | Date, format: 'dd/mm/yyyy' | 'yyyy-mm-dd' = 'dd/mm/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'yyyy-mm-dd') {
    return `${year}-${month}-${day}`;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Format a date string or Date object as DD/MM/YYYY HH:mm.
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format a 10-digit phone number as +91 XXXXX XXXXX.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const digits = cleaned.startsWith('91') && cleaned.length === 12 ? cleaned.slice(2) : cleaned;

  if (digits.length !== 10) return phone;

  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/**
 * Format a number as a percentage with two decimal places.
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
