'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TableSort { col: string; dir: 'asc' | 'desc' }

interface Options<TRow, TFilters> {
  fetchRows: (
    params: { search: string; filters: TFilters; sort: TableSort; limit: number; offset: number },
    signal: AbortSignal
  ) => Promise<{ rows: TRow[]; total: number }>;
  defaultFilters: TFilters;
  defaultSort: TableSort;
  onError?: (err: Error) => void;
}

export function useAdminTable<TRow, TFilters>({
  fetchRows,
  defaultFilters,
  defaultSort,
  onError,
}: Options<TRow, TFilters>) {
  const [rows, setRows] = useState<TRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TFilters>(defaultFilters);
  const [sort, setSort] = useState<TableSort>(defaultSort);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callers may pass inline callbacks; track them in refs so an unstable
  // reference can't recreate refetch and re-trigger the fetch effect.
  const fetchRowsRef = useRef(fetchRows);
  fetchRowsRef.current = fetchRows;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Reset to page 1 when anything filter-like changes
  useEffect(() => { setOffset(0); }, [search, filters, sort, limit]);

  const refetch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const result = await fetchRowsRef.current({ search, filters, sort, limit, offset }, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setRows(result.rows);
        setTotal(result.total);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (e instanceof Error) onErrorRef.current?.(e);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, search ? 400 : 0);
  }, [search, filters, sort, limit, offset]);

  useEffect(() => {
    refetch();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [refetch]);

  return {
    rows, total, loading,
    search, setSearch,
    filters, setFilters,
    sort, setSort,
    limit, setLimit,
    offset, setOffset,
    refetch,
  };
}
