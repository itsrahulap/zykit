// Runs a lesson example in the sandboxed DOM iframe (public/sandbox/dom.html) and collects its
// console output in the same shape as the JS Runner, so both share ConsoleOutput.
//
// Each run gets a brand-new iframe (a new React key), so nothing from a previous run survives.
// Stop, the time limit, a new run and unmounting all remove the iframe, which ends any loop or
// timer inside it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { compileTypeScript, describeCompileError } from '../../tools/js-runner/features/compile';
import { createFormatter } from '../../tools/js-runner/features/formatter';
import type { ConsoleEntry } from '../../tools/js-runner/features/transcript';
import type { RunState, RunStatus } from '../../tools/js-runner/hooks/useJsRunner';
import { PARENT_TAG, parseSandboxMessage } from '../features/domSandbox';

const MAX_ENTRIES = 600;

export function useDomSandbox() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [run, setRun] = useState<RunState>({ status: 'idle', ms: null, mainFailed: false, limitMs: 5000 });
  /** Key of the live iframe, or null when none is mounted. */
  const [frameKey, setFrameKey] = useState<number | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pending = useRef<string | null>(null);
  const runId = useRef(0);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = useRef(0);

  const clearTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };

  const note = useCallback((level: ConsoleEntry['level'], text: string) => {
    setEntries((prev) => prev.concat({ id: nextId.current++, level, text, depth: 0 }));
  }, []);

  const end = useCallback(
    (status: RunStatus, message?: string, keepFrame = false) => {
      clearTimer();
      runId.current++;
      pending.current = null;
      if (!keepFrame) setFrameKey(null);
      if (message) note('system', message);
      setRun((r) => ({ ...r, status }));
    },
    [note],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const m = parseSandboxMessage(event, frameRef.current?.contentWindow);
      if (!m) return;
      if (m.type === 'ready') {
        const code = pending.current;
        pending.current = null;
        // The frame is an opaque origin, so '*' is the only target that reaches it; the
        // recipient is pinned by posting to this exact window.
        if (code !== null) event.source?.postMessage({ source: PARENT_TAG, type: 'run', code, formatter: createFormatter.toString() }, { targetOrigin: '*' });
      } else if (m.type === 'log') {
        if (++count.current > MAX_ENTRIES) return end('truncated', 'Output truncated: too many console entries. The run was stopped.');
        setEntries((prev) => prev.concat({ id: nextId.current++, level: m.level, text: m.text, depth: m.depth ?? 0 }));
      } else if (m.type === 'truncated') {
        end('truncated', 'Output truncated: too much console output. The run was stopped.');
      } else if (m.type === 'done') {
        clearTimer();
        // Keep the frame so its page stays visible and late timers can still log.
        setRun((r) => ({ ...r, status: 'finished', ms: m.ms, mainFailed: !m.ok }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [end]);

  useEffect(() => clearTimer, []);

  const start = useCallback(
    async (code: string, language: 'js' | 'ts', limitMs: number) => {
      clearTimer();
      const id = ++runId.current;
      count.current = 0;
      setEntries([]);
      setFrameKey(null);
      setRun({ status: language === 'ts' ? 'compiling' : 'running', ms: null, mainFailed: false, limitMs });
      let js = code;
      if (language === 'ts') {
        let result;
        try {
          result = await compileTypeScript(code);
        } catch {
          if (id === runId.current) end('failed', 'Could not load the TypeScript compiler. Check your connection and try again.');
          return;
        }
        if (id !== runId.current) return;
        if (!result.ok) {
          note('error', describeCompileError(result));
          return end('failed');
        }
        js = result.code;
      }
      pending.current = js;
      setFrameKey(id);
      setRun((r) => ({ ...r, status: 'running' }));
      timer.current = setTimeout(() => {
        if (id === runId.current) end('timeout', `Stopped after ${limitMs / 1000} s (time limit). The page was reset.`);
      }, limitMs);
    },
    [end, note],
  );

  const stop = useCallback(() => end('stopped', 'Stopped. The page was reset.'), [end]);
  const clear = useCallback(() => setEntries([]), []);
  /** Removes the frame without a message (e.g. when the playground closes). */
  const reset = useCallback(() => {
    end('idle');
    setEntries([]);
  }, [end]);

  return { entries, run, start, stop, clear, reset, frameKey, frameRef };
}
