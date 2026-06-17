/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate a sequential ID with prefix and optional date segment.
 * Examples: PAT-0001, INV-20260530-0001
 */
export function generateId(prefix: string, date?: Date, sequence?: number): string {
  const seq = String(sequence ?? 1).padStart(4, '0');

  if (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${prefix}-${year}${month}${day}-${seq}`;
  }

  return `${prefix}-${seq}`;
}

/**
 * Promise-based delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate a string to a given length, appending an ellipsis if truncated.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
