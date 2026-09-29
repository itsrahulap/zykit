// Runs code in a fresh classic blob: Worker per run and collects its console output.
//
// Worker lifetime: the worker lives until (a) the main code has settled AND no timers/fetches
// it started are pending (the runtime posts 'idle'), (b) the user presses Stop, (c) the time
// limit passes, or (d) the output cap is hit. It is then terminated, so nothing keeps running.

import { useCallback, useEffect, useRef, useState } from 'react';
import { compileTypeScript, describeCompileError } from '../features/compile';
import type { Language } from '../features/examples';
import { DEFAULT_RUNTIME_OPTIONS, type WorkerMessage } from '../features/protocol';
import type { ConsoleEntry } from '../features/transcript';
import { buildWorkerSource, findModuleSyntax, formatScriptError, mapLocations } from '../features/source';

export type RunStatus =
  | 'idle'
  | 'compiling'
  | 'running' // main code still executing
  | 'waiting' // main code settled; timers still pending
  | 'finished'
  | 'failed'
  | 'stopped'
  | 'timeout'
  | 'truncated';

export interface RunState {
  status: RunStatus;
  /** Duration of the main code, from the worker. */
  ms: number | null;
  /** Whether the main code threw / rejected. */
  mainFailed: boolean;
  limitMs: number;
}

const FLUSH_MS = 40;

interface ActiveRun {
  worker: Worker;
  url: string;
  timer: ReturnType<typeof setTimeout>;
}

export function useJsRunner() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [run, setRun] = useState<RunState>({ status: 'idle', ms: null, mainFailed: false, limitMs: 10_000 });

  const active = useRef<ActiveRun | null>(null);
  const runId = useRef(0);
  const nextId = useRef(1);
  const buffer = useRef<ConsoleEntry[]>([]);
  const clearPending = useRef(false);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const received = useRef(0);

  const flush = useCallback(() => {
    if (flushTimer.current !== null) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    const batch = buffer.current;
    const clear = clearPending.current;
    if (!batch.length && !clear) return;
    buffer.current = [];
    clearPending.current = false;
    setEntries((prev) => (clear ? batch : batch.length ? prev.concat(batch) : prev));
  }, []);

  const push = useCallback(
    (e: Omit<ConsoleEntry, 'id'>, immediate = false) => {
      buffer.current.push({ ...e, id: nextId.current++ });
      if (immediate) flush();
      else if (flushTimer.current === null) flushTimer.current = setTimeout(flush, FLUSH_MS);
    },
    [flush],
  );

  const teardown = useCallback(() => {
    const a = active.current;
    if (!a) return;
    active.current = null;
    clearTimeout(a.timer);
    a.worker.onmessage = null;
    a.worker.onerror = null;
    a.worker.terminate();
    URL.revokeObjectURL(a.url);
  }, []);

  const end = useCallback(
    (status: RunStatus, note?: string) => {
      teardown();
      if (note) push({ level: 'system', text: note, depth: 0 });
      flush();
      setRun((r) => ({ ...r, status }));
    },
    [flush, push, teardown],
  );

  const start = useCallback(
    async (code: string, language: Language, limitMs: number) => {
      teardown();
      const id = ++runId.current;
      buffer.current = [];
      clearPending.current = false;
      received.current = 0;
      setEntries([]);
      setRun({ status: language === 'ts' ? 'compiling' : 'running', ms: null, mainFailed: false, limitMs });

      let js = code;
      if (language === 'ts') {
        let result;
        try {
          result = await compileTypeScript(code);
        } catch {
          if (id !== runId.current) return;
          return end('failed', 'Could not load the TypeScript compiler. Check your connection and try again.');
        }
        if (id !== runId.current) return;
        if (!result.ok) {
          push({ level: 'error', text: describeCompileError(result), depth: 0 });
          return end('failed');
        }
        js = result.code;
      }

      const mod = findModuleSyntax(js);
      if (mod) {
        push({
          level: 'error',
          text:
            `\`${mod.keyword}\` statements aren't supported (line ${mod.line}). Code runs as a plain script in an ` +
            'offline worker, so modules and npm packages are not available. Paste the code you need directly instead.',
          depth: 0,
        });
        return end('failed');
      }

      const built = buildWorkerSource(js, DEFAULT_RUNTIME_OPTIONS);
      const url = URL.createObjectURL(new Blob([built.source], { type: 'text/javascript' }));
      let worker: Worker;
      try {
        worker = new Worker(url); // classic worker: syntax errors arrive as ErrorEvent with lineno
      } catch (e) {
        URL.revokeObjectURL(url);
        push({ level: 'error', text: 'This browser could not start a sandbox worker: ' + String(e), depth: 0 });
        return end('failed');
      }
      const timer = setTimeout(() => {
        if (id !== runId.current) return;
        end('timeout', `Stopped after ${limitMs / 1000} s (time limit).`);
      }, limitMs);
      active.current = { worker, url, timer };
      setRun((r) => ({ ...r, status: 'running' }));

      worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
        if (id !== runId.current) return;
        const m = ev.data;
        switch (m.t) {
          case 'log':
            if (++received.current > DEFAULT_RUNTIME_OPTIONS.maxEntries + 10) {
              return end('truncated', 'Output truncated: too many console entries. The run was stopped.');
            }
            push({ level: m.level, text: mapLocations(m.text, url, built.lineOffset, built.userLines), depth: m.depth, at: m.at });
            return;
          case 'clear':
            buffer.current = [];
            clearPending.current = true;
            if (flushTimer.current === null) flushTimer.current = setTimeout(flush, FLUSH_MS);
            return;
          case 'done':
            flush();
            setRun((r) => ({ ...r, status: 'waiting', ms: m.ms, mainFailed: !m.ok }));
            return;
          case 'idle':
            return end('finished');
          case 'truncated':
            return end(
              'truncated',
              'Output truncated: reached the limit of 2,000 entries or 1 MB of text. The run was stopped.',
            );
        }
      };
      worker.onerror = (ev: ErrorEvent) => {
        ev.preventDefault();
        if (id !== runId.current) return;
        const msg = ev.message
          ? formatScriptError(ev.message, ev.lineno, ev.colno, built.lineOffset, built.userLines)
          : 'The sandbox worker could not start. Your browser may block workers created from blob: URLs.';
        push({ level: 'error', text: msg, depth: 0 });
        end('failed');
      };
    },
    [end, flush, push, teardown],
  );

  const stop = useCallback(() => {
    runId.current++; // also cancels a run that is still compiling
    end('stopped', 'Stopped.');
  }, [end]);

  const clear = useCallback(() => {
    buffer.current = [];
    clearPending.current = false;
    setEntries([]);
  }, []);

  useEffect(
    () => () => {
      runId.current++;
      teardown();
      if (flushTimer.current !== null) clearTimeout(flushTimer.current);
    },
    [teardown],
  );

  return { entries, run, start, stop, clear };
}
