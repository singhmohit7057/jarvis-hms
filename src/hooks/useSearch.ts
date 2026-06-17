
import { useState, useMemo, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchReturn<T> {
  query: string;
  setQuery: (q: string) => void;
  filteredItems: T[];
}

/**
 * Client-side search over an array of items.
 * Matches the debounced query (case-insensitive substring) against the specified fields.
 * The searchFields array is captured by ref to avoid dependency instability.
 */
export function useSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  delay = 300
): UseSearchReturn<T> {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);
  const fieldsRef = useRef(searchFields);
  fieldsRef.current = searchFields;

  const filteredItems = useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (!trimmed) return items;

    return items.filter((item) =>
      fieldsRef.current.some((field) => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(trimmed);
      })
    );
  }, [items, debouncedQuery]);

  return { query, setQuery, filteredItems };
}
