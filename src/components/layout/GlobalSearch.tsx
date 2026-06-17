
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Pill, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { ROUTES } from '@/config/routes';

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  type: 'patient' | 'medicine' | 'appointment';
  route: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const like = `%${trimmed}%`;

    const [patientsRes, medicinesRes, apptsRes] = await Promise.all([
      supabase.from('patients').select('id, name, phone').ilike('name', like).limit(4),
      supabase.from('medicines').select('id, name, generic_name').ilike('name', like).limit(4),
      supabase.from('appointments')
        .select('id, appointment_no, date, patients(name)')
        .ilike('appointment_no', like)
        .limit(3),
    ]);

    const combined: SearchResult[] = [
      ...(patientsRes.data ?? []).map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: p.phone ?? undefined,
        type: 'patient' as const,
        route: ROUTES.PATIENT_DETAIL.replace(':id', p.id),
      })),
      ...(medicinesRes.data ?? []).map((m) => ({
        id: m.id,
        label: m.name,
        sublabel: m.generic_name ?? undefined,
        type: 'medicine' as const,
        route: ROUTES.PHARMACY_INVENTORY,
      })),
      ...(apptsRes.data ?? []).map((a) => ({
        id: a.id,
        label: a.appointment_no,
        sublabel: (a.patients as unknown as { name: string } | null)?.name ?? a.date,
        type: 'appointment' as const,
        route: ROUTES.CONSULTATION.replace(':id', a.id),
      })),
    ];

    setResults(combined);
    setIsOpen(combined.length > 0);
    setActiveIndex(-1);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    navigate(result.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const iconMap = {
    patient: <User className="h-3.5 w-3.5 text-blue-500" />,
    medicine: <Pill className="h-3.5 w-3.5 text-green-500" />,
    appointment: <Calendar className="h-3.5 w-3.5 text-purple-500" />,
  };

  const typeLabel = {
    patient: 'Patient',
    medicine: 'Medicine',
    appointment: 'Appointment',
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        placeholder="Search patients, medicines..."
        className={cn(
          'w-full pl-9 pr-8 py-2 text-sm rounded-lg',
          'bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm',
          'dark:bg-slate-700 dark:text-gray-100 dark:placeholder:text-gray-500',
          'dark:focus:bg-slate-600 dark:focus:ring-blue-400/20',
          'transition-all duration-150'
        )}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border bg-white shadow-lg dark:bg-slate-800 dark:border-slate-700 z-50 overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.id + r.type}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(r)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      i === activeIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                    )}
                  >
                    <span className="shrink-0">{iconMap[r.type]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.label}</span>
                      {r.sublabel && <span className="block text-xs text-gray-400 truncate">{r.sublabel}</span>}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">{typeLabel[r.type]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
