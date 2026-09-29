// Runs a built worker script in a Node vm context shaped like a worker global scope.
// This exercises the *serialised* runtime, proving it has no outer-scope references.

import vm from 'node:vm';
import { buildWorkerSource } from '../../../src/tools/js-runner/features/source';
import { DEFAULT_RUNTIME_OPTIONS, type RuntimeOptions, type WorkerMessage } from '../../../src/tools/js-runner/features/protocol';

export const FAKE_URL = 'blob:http://localhost:4173/0b6c1c5e-1111-2222-3333-444455556666';

type Listener = (e: unknown) => void;

export function runInFakeWorker(code: string, options: Partial<RuntimeOptions> = {}) {
  const messages: WorkerMessage[] = [];
  const listeners: Record<string, Listener[]> = {};
  const waiters: { pred: (m: WorkerMessage) => boolean; resolve: (m: WorkerMessage) => void }[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const intervals = new Set<ReturnType<typeof setInterval>>();

  const ctx: Record<string, unknown> = {
    postMessage: (m: WorkerMessage) => {
      messages.push(m);
      for (const w of [...waiters]) if (w.pred(m)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve(m);
      }
    },
    console: {},
    addEventListener: (type: string, fn: Listener) => (listeners[type] ??= []).push(fn),
    setTimeout: (fn: () => void, ms?: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        try {
          fn();
        } catch (error) {
          dispatch('error', { error, message: String(error), preventDefault() {} });
        }
      }, ms);
      timers.add(id);
      return id;
    },
    setInterval: (fn: () => void, ms?: number) => {
      const id = setInterval(fn, ms);
      intervals.add(id);
      return id;
    },
    clearTimeout: (id: ReturnType<typeof setTimeout>) => {
      clearTimeout(id);
      timers.delete(id);
    },
    clearInterval: (id: ReturnType<typeof setInterval>) => {
      clearInterval(id);
      intervals.delete(id);
    },
    performance: { now: () => performance.now() },
  };
  ctx.self = ctx;
  vm.createContext(ctx);

  function dispatch(type: string, e: unknown) {
    for (const fn of listeners[type] ?? []) fn(e);
  }

  const built = buildWorkerSource(code, { ...DEFAULT_RUNTIME_OPTIONS, ...options });
  let syntaxError: unknown = null;
  try {
    const script = new vm.Script(built.source, { filename: FAKE_URL });
    script.runInContext(ctx);
  } catch (e) {
    syntaxError = e;
  }

  return {
    built,
    messages,
    syntaxError,
    dispatch,
    logs: () => messages.filter((m): m is Extract<WorkerMessage, { t: 'log' }> => m.t === 'log'),
    texts: () => messages.flatMap((m) => (m.t === 'log' ? [m.text] : [])),
    waitFor(t: WorkerMessage['t'], timeout = 2000): Promise<WorkerMessage> {
      const found = messages.find((m) => m.t === t);
      if (found) return Promise.resolve(found);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timed out waiting for ' + t)), timeout);
        waiters.push({ pred: (m) => m.t === t, resolve: (m) => (clearTimeout(timer), resolve(m)) });
      });
    },
    dispose() {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    },
  };
}
