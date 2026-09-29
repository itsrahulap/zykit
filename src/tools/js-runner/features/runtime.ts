// The console/timer runtime that runs inside the sandbox worker before the user's code.
//
// IMPORTANT: `workerRuntime` is serialised with `Function.prototype.toString()` and becomes the
// first statement of the worker script (see source.ts). It must not reference imports or any
// identifier outside its own body; everything it needs arrives through its parameters.
// Type-only imports are fine because they are erased.

import type { Formatter, FormatterOptions } from './formatter';
import type { LogLevel, RuntimeOptions, WorkerMessage } from './protocol';

type TimerFn = (handler: unknown, ms?: number, ...args: unknown[]) => unknown;

/** The parts of the worker global scope the runtime touches (a fake one is used in tests). */
export interface RuntimeScope {
  postMessage: (msg: WorkerMessage) => void;
  console: Record<string, unknown>;
  addEventListener: (type: string, listener: (e: never) => void) => void;
  setTimeout: TimerFn;
  setInterval: TimerFn;
  clearTimeout: (id?: unknown) => void;
  clearInterval: (id?: unknown) => void;
  fetch?: (...args: unknown[]) => Promise<unknown>;
  performance?: { now: () => number };
}

/** Starts the user's (async-wrapped) code. */
export type RunBody = (body: () => Promise<unknown>) => void;

export function workerRuntime(
  scope: RuntimeScope,
  opts: RuntimeOptions,
  makeFormatter: (o?: FormatterOptions) => Formatter,
): RunBody {
  const post = scope.postMessage.bind(scope);
  const perf = scope.performance;
  const now = () => (perf && typeof perf.now === 'function' ? perf.now() : Date.now());
  const start = now();
  const fmt = makeFormatter({});

  // ---- Output with caps ---------------------------------------------------------------------
  let entries = 0;
  let chars = 0;
  let truncated = false;
  let depth = 0;

  function emit(level: LogLevel, text: string) {
    if (truncated) return;
    if (entries >= opts.maxEntries || chars >= opts.maxChars) {
      truncated = true;
      post({ t: 'truncated' });
      return;
    }
    const room = opts.maxChars - chars;
    if (text.length > room) text = text.slice(0, room) + '…';
    entries++;
    chars += text.length;
    post({ t: 'log', level, text, depth, at: Math.round((now() - start) * 10) / 10 });
  }

  function format(args: unknown[]): string {
    try {
      return fmt.formatArgs(args);
    } catch (e) {
      return '[could not format value: ' + String(e) + ']';
    }
  }

  // ---- console ------------------------------------------------------------------------------
  const c = scope.console;
  const counts: Record<string, number> = Object.create(null);
  const timers: Record<string, number> = Object.create(null);
  const levels: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
  levels.forEach((level) => {
    c[level] = (...args: unknown[]) => emit(level, format(args));
  });
  c.dir = (value: unknown) => emit('log', fmt.inspect(value));
  c.dirxml = c.log;
  c.trace = (...args: unknown[]) => {
    const stack = String(new Error().stack || '').split('\n');
    // Drop the "Error" header line (V8) so only frames remain.
    const frames = stack.filter((l, i) => !(i === 0 && /^Error\b/.test(l))).join('\n');
    emit('log', 'Trace' + (args.length ? ': ' + format(args) : '') + (frames ? '\n' + frames : ''));
  };
  c.assert = (cond: unknown, ...args: unknown[]) => {
    if (!cond) emit('error', 'Assertion failed' + (args.length ? ': ' + format(args) : ''));
  };
  c.clear = () => {
    if (!truncated) post({ t: 'clear' });
  };
  c.count = (label: unknown = 'default') => {
    const k = String(label);
    counts[k] = (counts[k] || 0) + 1;
    emit('log', k + ': ' + counts[k]);
  };
  c.countReset = (label: unknown = 'default') => {
    counts[String(label)] = 0;
  };
  c.time = (label: unknown = 'default') => {
    const k = String(label);
    if (k in timers) emit('warn', "Timer '" + k + "' already exists");
    else timers[k] = now();
  };
  const elapsed = (k: string) => {
    const ms = now() - timers[k];
    return k + ': ' + (ms < 10 ? ms.toFixed(3) : ms.toFixed(1)) + ' ms';
  };
  c.timeLog = (label: unknown = 'default', ...args: unknown[]) => {
    const k = String(label);
    if (!(k in timers)) return emit('warn', "Timer '" + k + "' does not exist");
    emit('log', elapsed(k) + (args.length ? ' ' + format(args) : ''));
  };
  c.timeEnd = (label: unknown = 'default') => {
    const k = String(label);
    if (!(k in timers)) return emit('warn', "Timer '" + k + "' does not exist");
    emit('log', elapsed(k));
    delete timers[k];
  };
  c.group = (...args: unknown[]) => {
    if (args.length) emit('log', format(args));
    depth++;
  };
  c.groupCollapsed = c.group;
  c.groupEnd = () => {
    if (depth > 0) depth--;
  };
  c.table = (data: unknown, columns?: unknown) => {
    if (data === null || typeof data !== 'object') return emit('log', format([data]));
    const cell = (v: unknown) => {
      const s = typeof v === 'string' ? fmt.inspect(v) : fmt.inspect(v).replace(/\s*\n\s*/g, ' ');
      return s.length > 40 ? s.slice(0, 39) + '…' : s;
    };
    const rows: [string, unknown][] = [];
    if (data instanceof Map) data.forEach((v, k) => rows.push([cell(k), v]));
    else if (data instanceof Set) {
      let i = 0;
      data.forEach((v) => rows.push([String(i++), v]));
    } else Object.keys(data).forEach((k) => rows.push([k, (data as Record<string, unknown>)[k]]));
    const cols: string[] = [];
    let hasValues = false;
    const wanted = Array.isArray(columns) ? columns.map(String) : null;
    rows.forEach(([, v]) => {
      if (v !== null && typeof v === 'object') {
        Object.keys(v as object).forEach((k) => {
          if (cols.indexOf(k) === -1 && (!wanted || wanted.indexOf(k) !== -1)) cols.push(k);
        });
      } else hasValues = true;
    });
    const header = ['(index)'].concat(cols, hasValues ? ['Values'] : []);
    const body = rows.slice(0, 1000).map(([k, v]) => {
      const isObj = v !== null && typeof v === 'object';
      const line = [k];
      cols.forEach((col) => {
        const has = isObj && Object.prototype.hasOwnProperty.call(v, col);
        line.push(has ? cell((v as Record<string, unknown>)[col]) : '');
      });
      if (hasValues) line.push(isObj ? '' : cell(v));
      return line;
    });
    const widths = header.map((h, i) => Math.max(h.length, ...body.map((r) => r[i].length)) + 2);
    const pad = (s: string, w: number) => ' ' + s + ' '.repeat(Math.max(0, w - s.length - 1));
    const rule = (l: string, m: string, r: string) => l + widths.map((w) => '─'.repeat(w)).join(m) + r;
    const row = (cells: string[]) => '│' + cells.map((s, i) => pad(s, widths[i])).join('│') + '│';
    emit('log', [rule('┌', '┬', '┐'), row(header), rule('├', '┼', '┤')].concat(body.map(row), [rule('└', '┴', '┘')]).join('\n'));
  };

  // ---- Errors that escape the user's code ---------------------------------------------------
  scope.addEventListener('error', ((e: { error?: unknown; message?: string; preventDefault?: () => void }) => {
    if (e.preventDefault) e.preventDefault();
    const text = e.error !== undefined && e.error !== null ? fmt.inspect(e.error) : String(e.message || 'Unknown error');
    emit('error', /^Uncaught\b/.test(text) ? text : 'Uncaught ' + text);
  }) as (e: never) => void);
  scope.addEventListener('unhandledrejection', ((e: { reason?: unknown; preventDefault?: () => void }) => {
    if (e.preventDefault) e.preventDefault();
    emit('error', 'Uncaught (in promise) ' + fmt.inspect(e.reason));
  }) as (e: never) => void);

  // ---- Pending work tracking, so the page knows when the run is really over ------------------
  const origSetTimeout = scope.setTimeout.bind(scope);
  const origSetInterval = scope.setInterval.bind(scope);
  const origClearTimeout = scope.clearTimeout.bind(scope);
  const origClearInterval = scope.clearInterval.bind(scope);
  const pending = new Set<unknown>();
  let inflight = 0;
  let bodyDone = false;
  let idleCheck: unknown = null;
  let idlePosted = false;

  function maybeIdle() {
    if (!bodyDone || idlePosted || pending.size > 0 || inflight > 0 || idleCheck !== null) return;
    idleCheck = origSetTimeout(() => {
      idleCheck = null;
      if (!idlePosted && pending.size === 0 && inflight === 0) {
        idlePosted = true;
        post({ t: 'idle' });
      }
    }, opts.idleGraceMs);
  }

  scope.setTimeout = (handler: unknown, ms?: number, ...args: unknown[]) => {
    if (typeof handler !== 'function') return origSetTimeout(handler, ms, ...args);
    const id: unknown = origSetTimeout(() => {
      pending.delete(id);
      try {
        handler(...args);
      } finally {
        maybeIdle();
      }
    }, ms);
    pending.add(id);
    return id;
  };
  scope.setInterval = (handler: unknown, ms?: number, ...args: unknown[]) => {
    if (typeof handler !== 'function') return origSetInterval(handler, ms, ...args);
    const id = origSetInterval(() => handler(...args), ms);
    pending.add(id);
    return id;
  };
  scope.clearTimeout = (id?: unknown) => {
    origClearTimeout(id);
    if (pending.delete(id)) maybeIdle();
  };
  scope.clearInterval = (id?: unknown) => {
    origClearInterval(id);
    if (pending.delete(id)) maybeIdle();
  };
  const origFetch = scope.fetch;
  if (typeof origFetch === 'function') {
    scope.fetch = (...args: unknown[]) => {
      inflight++;
      let p: Promise<unknown>;
      try {
        p = Promise.resolve(origFetch.apply(scope, args));
      } catch (e) {
        p = Promise.reject(e);
      }
      return p.finally(() => {
        inflight--;
        maybeIdle();
      });
    };
  }

  // ---- Run -----------------------------------------------------------------------------------
  return (body) => {
    const t0 = now();
    const finish = (ok: boolean) => {
      bodyDone = true;
      post({ t: 'done', ok, ms: Math.round((now() - t0) * 10) / 10 });
      maybeIdle();
    };
    body().then(
      () => finish(true),
      (err: unknown) => {
        emit('error', 'Uncaught ' + fmt.inspect(err));
        finish(false);
      },
    );
  };
}
