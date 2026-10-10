import { useCallback, useEffect, useRef, useState } from 'react';
import keyboardEventViewer from './index';
import { addToHistory, announcement, keyLabel, toJson, toMarkdown, toRecord, type KeyRecord } from './features/keyboard';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CopyButton } from '../../shared/ui/tool';
import { Button } from '../../shared/ui/ui';

const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const th = 'px-2 py-1 text-left font-semibold whitespace-nowrap';
const td = 'px-2 py-1 whitespace-nowrap';

export default function KeyboardEventViewerPage() {
  const [history, setHistory] = useState<KeyRecord[]>([]);
  const [windowWide, setWindowWide] = useState(false);
  const [prevent, setPrevent] = useState(false);
  const [live, setLive] = useState('');
  const count = useRef(0);
  const preventRef = useRef(prevent);
  useEffect(() => {
    preventRef.current = prevent;
  });

  const handle = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
    // Tab stays free so keyboard users can always leave the page.
    if (preventRef.current && e.key !== 'Tab') e.preventDefault();
    const r = toRecord('nativeEvent' in e ? e.nativeEvent : e, ++count.current);
    setHistory((h) => addToHistory(h, r));
    setLive(announcement(r));
  }, []);

  useEffect(() => {
    if (!windowWide) return;
    window.addEventListener('keydown', handle);
    window.addEventListener('keyup', handle);
    return () => {
      window.removeEventListener('keydown', handle);
      window.removeEventListener('keyup', handle);
    };
  }, [windowWide, handle]);

  const last = history[0];
  const area = windowWide ? {} : { onKeyDown: handle, onKeyUp: handle };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={keyboardEventViewer} />
      <Headline accent="keys">See every press </Headline>
      <StatusStrip status={last ? 'Capturing keys. Details are below.' : 'Click the box below, then press a key.'} tone={last ? 'good' : 'neutral'} />

      <section className={card} aria-label="Capture">
        <div
          tabIndex={0}
          role="group"
          aria-label="Key capture area. Focus here and press keys."
          {...area}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700"
        >
          <p aria-hidden="true" className="max-w-full font-mono text-5xl font-bold break-all text-slate-900 sm:text-7xl dark:text-white">
            {last ? keyLabel(last.key) : '?'}
          </p>
          <p aria-hidden="true" className="font-mono text-sm break-all text-slate-600 dark:text-slate-400">
            {last ? `${last.code || 'no code'} · ${last.type}` : windowWide ? 'Press any key.' : 'Click or Tab here, then press any key.'}
          </p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {live}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Checkbox label="Capture keys anywhere on the page" checked={windowWide} onChange={setWindowWide} />
          <Checkbox label="Block the browser’s default action (preventDefault)" checked={prevent} onChange={setPrevent} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Browsers and the OS keep some shortcuts for themselves (Ctrl+W, Ctrl+T, Cmd+Q, Alt+F4, the Windows key) and never send them to a page, so you may not see them. Tab is never blocked so you can leave this box.
        </p>
      </section>

      {last && (
        <section className={card} aria-label="Latest event">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Latest event</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
            {(
              [
                ['key', last.key === ' ' ? '" "' : last.key],
                ['code', last.code],
                ['keyCode (legacy)', last.keyCode],
                ['which (legacy)', last.which],
                ['location', last.location],
                ['modifiers', last.modifiers.join(' + ') || 'none'],
                ['CapsLock on', String(last.capsLock)],
                ['NumLock on', String(last.numLock)],
                ['repeat', String(last.repeat)],
                ['isComposing', String(last.isComposing)],
                ['timeStamp', `${last.timeStamp} ms`],
              ] as [string, string | number][]
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="min-w-0 font-mono break-all text-slate-900 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className={card} aria-label="History">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">History (last 50)</h2>
          <div className="flex flex-wrap items-center gap-1">
            <CopyButton text={toJson(history)} label="Copy JSON" disabled={!history.length} />
            <CopyButton text={toMarkdown(history)} label="Copy Markdown" disabled={!history.length} />
            <Button variant="secondary" className="!px-3 !py-2 !text-sm pointer-coarse:min-h-11" disabled={!history.length} onClick={() => setHistory([])}>
              Clear
            </Button>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nothing yet. Keys you press appear here, newest first. Nothing is saved.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs text-slate-800 dark:text-slate-200">
              <caption className="sr-only">Recent keyboard events, newest first</caption>
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  {['#', 'Event', 'key', 'code', 'keyCode', 'Location', 'Modifiers', 'Caps', 'Num', 'Repeat', 'Comp.', 'Time (ms)'].map((h) => (
                    <th key={h} scope="col" className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.n} className="border-t border-slate-200 dark:border-slate-800">
                    <td className={td}>{r.n}</td>
                    <td className={td}>{r.type}</td>
                    <td className={td}>{keyLabel(r.key)}</td>
                    <td className={td}>{r.code}</td>
                    <td className={td}>{r.keyCode}</td>
                    <td className={td}>{r.location}</td>
                    <td className={td}>{r.modifiers.join('+') || '-'}</td>
                    <td className={td}>{r.capsLock ? 'on' : '-'}</td>
                    <td className={td}>{r.numLock ? 'on' : '-'}</td>
                    <td className={td}>{r.repeat ? 'yes' : '-'}</td>
                    <td className={td}>{r.isComposing ? 'yes' : '-'}</td>
                    <td className={td}>{r.timeStamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Panel eyebrow="key vs code">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <code className="font-mono">key</code> is the character or action the layout produces (&ldquo;a&rdquo;, &ldquo;A&rdquo;, &ldquo;Enter&rdquo;). It changes with the keyboard layout, Shift and Caps Lock.
          </li>
          <li>
            <code className="font-mono">code</code> is the physical key position (<code className="font-mono">KeyA</code>), the same on any layout. Use it for games (WASD); use <code className="font-mono">key</code> for text and shortcuts.
          </li>
          <li>
            <code className="font-mono">keyCode</code> and <code className="font-mono">which</code> are deprecated. They are shown only because old code still reads them.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
