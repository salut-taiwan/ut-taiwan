import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminTable } from '@/hooks/useAdminTable';

const defaults = {
  defaultFilters: { status: 'all' },
  defaultSort: { col: 'created_at', dir: 'desc' as const },
};

type Row = { id: string };
type Filters = { status: string };
type FetchArgs = Parameters<
  Parameters<typeof useAdminTable<Row, Filters>>[0]['fetchRows']
>;

function setup(over: Record<string, unknown> = {}) {
  const fetchRows = vi.fn(async (..._args: FetchArgs) => ({ rows: [{ id: 'r-1' }], total: 1 }));
  const onError = vi.fn();
  const hook = renderHook(() =>
    useAdminTable<Row, Filters>({ fetchRows, onError, ...defaults, ...over }));
  return { hook, fetchRows, onError };
}

beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); });

describe('useAdminTable', () => {
  test('loads the first page immediately, with no debounce', async () => {
    const { fetchRows } = setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));
    expect(fetchRows.mock.calls[0][0]).toMatchObject({
      search: '', limit: 25, offset: 0, sort: { col: 'created_at', dir: 'desc' },
    });
  });

  test('the rows and total from the server become the table state', async () => {
    const { hook } = setup();
    await waitFor(() => expect(hook.result.current.rows).toHaveLength(1));
    expect(hook.result.current.total).toBe(1);
    expect(hook.result.current.loading).toBe(false);
  });

  test('typing in the search box waits before querying', async () => {
    // One request per pause, not one per keystroke.
    const { hook, fetchRows } = setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));

    act(() => { hook.result.current.setSearch('b'); });
    act(() => { hook.result.current.setSearch('bu'); });
    act(() => { hook.result.current.setSearch('bud'); });
    expect(fetchRows).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(400); });
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
    expect(fetchRows.mock.calls[1][0].search).toBe('bud');
  });

  test('changing a filter refreshes at once — only typing is debounced', async () => {
    const { hook, fetchRows } = setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));

    await act(async () => { hook.result.current.setFilters({ status: 'pending' }); });

    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
  });

  test('any narrowing sends the reader back to the first page', async () => {
    // Otherwise a filter applied on page 4 shows an empty table.
    const { hook, fetchRows } = setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));

    await act(async () => { hook.result.current.setOffset(75); });
    await waitFor(() => expect(hook.result.current.offset).toBe(75));

    await act(async () => { hook.result.current.setFilters({ status: 'pending' }); });

    await waitFor(() => expect(hook.result.current.offset).toBe(0));
  });

  test('paging on its own does not reset itself', async () => {
    const { hook } = setup();
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    await act(async () => { hook.result.current.setOffset(25); });

    await waitFor(() => expect(hook.result.current.offset).toBe(25));
  });

  test('a superseded request cannot overwrite fresher rows', async () => {
    let resolveFirst: (v: { rows: { id: string }[]; total: number }) => void = () => {};
    const fetchRows = vi.fn()
      .mockImplementationOnce(() => new Promise(r => { resolveFirst = r; }))
      .mockImplementation(async () => ({ rows: [{ id: 'fresh' }], total: 1 }));

    const hook = renderHook(() => useAdminTable({ fetchRows, ...defaults }));

    await act(async () => {
      hook.result.current.setFilters({ status: 'pending' });
      vi.advanceTimersByTime(10);
    });
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
    await act(async () => { resolveFirst({ rows: [{ id: 'stale' }], total: 9 }); });

    await waitFor(() => expect(hook.result.current.rows).toEqual([{ id: 'fresh' }]));
  });

  test('a cancelled request is not reported as an error', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const fetchRows = vi.fn(async () => { throw abort; });
    const onError = vi.fn();

    renderHook(() => useAdminTable({ fetchRows, onError, ...defaults }));

    await waitFor(() => expect(fetchRows).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
  });

  test('a real failure is reported once and leaves the table intact', async () => {
    const fetchRows = vi.fn()
      .mockImplementationOnce(async () => ({ rows: [{ id: 'r-1' }], total: 1 }))
      .mockImplementationOnce(async () => { throw new Error('server down'); });
    const onError = vi.fn();
    const hook = renderHook(() => useAdminTable({ fetchRows, onError, ...defaults }));

    await waitFor(() => expect(hook.result.current.rows).toHaveLength(1));
    await act(async () => { hook.result.current.setFilters({ status: 'pending' }); });

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(hook.result.current.rows).toHaveLength(1);
  });

  test('an inline callback does not send the table into a refetch loop', async () => {
    // Callers write fetchRows inline; a new function identity each render must
    // not retrigger the effect.
    const fetchRows = vi.fn(async () => ({ rows: [], total: 0 }));
    const hook = renderHook(() => useAdminTable({
      fetchRows: (...args: Parameters<typeof fetchRows>) => fetchRows(...args),
      onError: () => {},
      ...defaults,
    }));

    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));
    hook.rerender();
    hook.rerender();
    await act(async () => { vi.advanceTimersByTime(500); });

    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  test('loading is true while a request is in flight', async () => {
    let resolve: (v: { rows: never[]; total: number }) => void = () => {};
    const fetchRows = vi.fn(() => new Promise<{ rows: never[]; total: number }>(r => { resolve = r; }));
    const hook = renderHook(() => useAdminTable({ fetchRows, ...defaults }));

    await waitFor(() => expect(hook.result.current.loading).toBe(true));
    await act(async () => { resolve({ rows: [], total: 0 }); });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
  });

  test('changing the page size reloads from the top', async () => {
    const { hook, fetchRows } = setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));

    await act(async () => { hook.result.current.setLimit(50); });

    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
    expect(fetchRows.mock.calls[1][0]).toMatchObject({ limit: 50, offset: 0 });
  });
});
