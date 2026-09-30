import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_TOTAL_BYTES, QUERY_TIMEOUT_MS, tableNameFromFile, type TableSchema } from '../features/csv-sql';
import type { QueryResult, SqlRequest, SqlResponse, TableSource } from '../workers/sql.protocol';
import { formatBytes } from '../../../shared/utils/format.utils';

export interface SqlDbState {
  tables: TableSchema[];
  result: QueryResult | null;
  error: string | null;
  notices: string[];
  /** What the worker is doing, if anything. */
  busy: 'loading' | 'query' | null;
}

type Pending = { resolve: (r: SqlResponse) => void };

interface Source extends TableSource {
  bytes: number;
}

/**
 * Owns the SQLite worker. Table sources are kept here so a stuck query can be cancelled by
 * terminating the worker and loading the tables again into a fresh one.
 */
export function useSqlDb(allText: boolean) {
  const [state, setState] = useState<SqlDbState>({ tables: [], result: null, error: null, notices: [], busy: null });
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(0);
  const sourcesRef = useRef<Source[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const allTextRef = useRef(allText);

  const worker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('../workers/sql.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<SqlResponse>) => {
      const p = pending.current.get(e.data.id);
      pending.current.delete(e.data.id);
      p?.resolve(e.data);
    };
    w.onerror = (e) => {
      e.preventDefault();
      for (const [id, p] of pending.current) p.resolve({ id, type: 'error', message: 'The SQL engine stopped unexpectedly (it may have run out of memory).' });
      pending.current.clear();
      w.terminate();
      if (workerRef.current === w) workerRef.current = null;
    };
    workerRef.current = w;
    return w;
  }, []);

  const send = useCallback(
    (req: Omit<SqlRequest, 'id'>) =>
      new Promise<SqlResponse>((resolve) => {
        const id = ++nextId.current;
        pending.current.set(id, { resolve });
        worker().postMessage({ ...req, id } as SqlRequest);
      }),
    [worker],
  );

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      workerRef.current?.terminate();
    },
    [],
  );

  const load = useCallback(
    async (tables: Source[], reset = false) => {
      setState((s) => ({ ...s, busy: 'loading', error: null, ...(reset ? {} : { notices: [] }) }));
      const res = await send({ type: 'load', tables: tables.map(({ name, data, source, tab }) => ({ name, data, source, tab })), allText: allTextRef.current });
      if (res.type === 'loaded') {
        setState((s) => ({ ...s, busy: null, tables: res.tables, notices: reset ? s.notices : res.notices }));
        return true;
      }
      setState((s) => ({ ...s, busy: null, error: res.type === 'error' ? res.message : 'Loading failed.' }));
      return false;
    },
    [send],
  );

  /** Add files or pasted text as tables. */
  const add = useCallback(
    async (items: { data: File | string; source: string }[]) => {
      const used = sourcesRef.current.reduce((n, s) => n + s.bytes, 0);
      const bytes = items.reduce((n, i) => n + (typeof i.data === 'string' ? i.data.length : i.data.size), 0);
      if (used + bytes > MAX_TOTAL_BYTES) {
        setState((s) => ({
          ...s,
          error: `That's too much data: the tool holds up to ${formatBytes(MAX_TOTAL_BYTES)} of CSV in total (${formatBytes(used)} already loaded, ${formatBytes(bytes)} added).`,
        }));
        return;
      }
      const taken = new Set([...sourcesRef.current.map((s) => s.name), ...state.tables.map((t) => t.name)]);
      const added: Source[] = items.map((i) => {
        const name = tableNameFromFile(i.source, taken);
        taken.add(name);
        return { ...i, name, bytes: typeof i.data === 'string' ? i.data.length : i.data.size, tab: /\.(tsv|tab)$/i.test(i.source) };
      });
      if (await load(added)) sourcesRef.current = [...sourcesRef.current, ...added];
    },
    [load, state.tables],
  );

  const drop = useCallback(
    async (name: string) => {
      sourcesRef.current = sourcesRef.current.filter((s) => s.name !== name);
      const res = await send({ type: 'drop', name });
      if (res.type === 'loaded') setState((s) => ({ ...s, tables: res.tables }));
    },
    [send],
  );

  /** Start again with a fresh worker and the loaded sources (after cancel, or when typing changes). */
  const restart = useCallback(
    async (message: string | null) => {
      clearTimeout(timer.current);
      workerRef.current?.terminate();
      workerRef.current = null;
      for (const [id, p] of pending.current) p.resolve({ id, type: 'error', message: message ?? 'Cancelled.' });
      pending.current.clear();
      setState((s) => ({ ...s, tables: [], busy: null }));
      if (sourcesRef.current.length) await load(sourcesRef.current, true);
      setState((s) => ({ ...s, error: message }));
    },
    [load],
  );

  useEffect(() => {
    if (allTextRef.current === allText) return;
    allTextRef.current = allText;
    void restart(null);
  }, [allText, restart]);

  const run = useCallback(
    async (sql: string, timeoutMs = QUERY_TIMEOUT_MS) => {
      if (!sql.trim()) return;
      setState((s) => ({ ...s, busy: 'query', error: null }));
      clearTimeout(timer.current);
      const id = nextId.current + 1;
      timer.current = setTimeout(() => {
        if (pending.current.has(id))
          void restart(`The query took longer than ${timeoutMs / 1000} seconds and was stopped. Tables were reloaded from the original files (changes made by queries are lost).`);
      }, timeoutMs);
      const res = await send({ type: 'query', sql });
      clearTimeout(timer.current);
      if (res.type === 'result') setState((s) => ({ ...s, busy: null, result: res.result, tables: res.tables ?? s.tables }));
      else if (res.type === 'error') setState((s) => ({ ...s, busy: null, error: res.message, tables: res.tables ?? s.tables }));
    },
    [send, restart],
  );

  const cancel = useCallback(
    () => restart('Query cancelled. Tables were reloaded from the original files (changes made by queries are lost).'),
    [restart],
  );

  const exportResult = useCallback(
    async (format: 'csv' | 'json') => {
      const res = await send({ type: 'export', format });
      if (res.type === 'exported') return res.text;
      if (res.type === 'error') setState((s) => ({ ...s, error: res.message }));
      return null;
    },
    [send],
  );

  const dismissError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return { ...state, add, drop, run, cancel, exportResult, dismissError };
}
