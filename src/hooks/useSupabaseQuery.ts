// #must: Generic Supabase data fetching hook with loading, error, and refetch
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSupabaseQueryReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  count: number;
  refetch: () => void;
}

/**
 * Generic hook for fetching data from Supabase.
 * Calls queryFn on mount and whenever deps change.
 * Provides loading/error states and a manual refetch function.
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T[] | null; error: { message: string } | null; count?: number | null }>,
  deps: unknown[] = []
): UseSupabaseQueryReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();

      if (!mountedRef.current) return;

      if (result.error) {
        setError(result.error.message);
        setData([]);
        setCount(0);
      } else {
        setData(result.data ?? []);
        setCount(result.count ?? result.data?.length ?? 0);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setData([]);
      setCount(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, count, refetch: fetchData };
}
