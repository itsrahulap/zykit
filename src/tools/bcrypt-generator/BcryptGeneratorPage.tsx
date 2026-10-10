import { useEffect, useId, useRef, useState } from 'react';
import bcryptGenerator from './index';
import { estimateMs, formatMs, MAX_COST, MAX_PASSWORD_BYTES, MIN_COST, parseHash, passwordBytes, type Prefix } from './features/bcrypt';
import type { Body, Res } from './bcrypt.worker';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button } from '../../shared/ui/ui';

type Mode = 'generate' | 'verify';
type Result = { kind: 'hash'; hash: string; ms: number } | { kind: 'verify'; match: boolean | null; ms: number } | { kind: 'error'; message: string } | null;

const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const field =
  'w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const COSTS = Array.from({ length: MAX_COST - MIN_COST + 1 }, (_, i) => ({ value: MIN_COST + i, label: `${MIN_COST + i}${MIN_COST + i === 12 ? ' (common default)' : ''}` }));
const PREFIXES: { value: Prefix; label: string }[] = [
  { value: '2b', label: '$2b$ (current)' },
  { value: '2a', label: '$2a$' },
  { value: '2y', label: '$2y$ (PHP)' },
];

export default function BcryptGeneratorPage() {
  const passId = useId();
  const hashId = useId();
  const [mode, setMode] = useState<Mode>('generate');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [cost, setCost] = useState(10);
  const [prefix, setPrefix] = useState<Prefix>('2b');
  const [existing, setExisting] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [benchMs, setBenchMs] = useState<number | null>(null);
  const worker = useRef<Worker | null>(null);
  const seq = useRef(0);
  const waiting = useRef<((r: Res) => void) | null>(null);

  const call = (req: Body) =>
    new Promise<Res>((resolve) => {
      worker.current ??= (() => {
        const w = new Worker(new URL('./bcrypt.worker.ts', import.meta.url), { type: 'module' });
        w.onmessage = (e: MessageEvent<Res>) => e.data.id === seq.current && waiting.current?.(e.data);
        return w;
      })();
      waiting.current = resolve;
      worker.current.postMessage({ ...req, id: ++seq.current });
    });

  useEffect(() => {
    void call({ op: 'hash', password: 'benchmark', cost: MIN_COST, prefix: '2b', salt: new Uint8Array(16) }).then((r) => r.ok && setBenchMs(Math.max(r.ms, 0.5)));
    return () => worker.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once; call only touches refs
  }, []);

  const bytes = passwordBytes(password);
  const parsed = parseHash(existing);
  const run = async () => {
    setBusy(true);
    setResult(null);
    const r =
      mode === 'generate'
        ? await call({ op: 'hash', password, cost, prefix, salt: crypto.getRandomValues(new Uint8Array(16)) })
        : await call({ op: 'verify', password, hash: existing.trim() });
    setBusy(false);
    setResult(!r.ok ? { kind: 'error', message: r.error } : mode === 'generate' ? { kind: 'hash', hash: r.hash!, ms: r.ms } : { kind: 'verify', match: r.match ?? null, ms: r.ms });
  };

  const view = result?.kind === 'hash' ? parseHash(result.hash) : null;
  const status = busy ? 'Hashing…' : result?.kind === 'hash' ? `Done in ${formatMs(result.ms)}.` : result?.kind === 'verify' ? 'Checked.' : 'Type a password to start.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={bcryptGenerator} />
      <Headline accent="bcrypt">Hash and check </Headline>
      <StatusStrip status={status} tone={busy ? 'busy' : result ? 'good' : 'neutral'} />
      <Segmented
        label="Mode"
        options={[
          { value: 'generate', label: 'Generate' },
          { value: 'verify', label: 'Verify' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setResult(null);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-label="Input">
          <div>
            <label htmlFor={passId} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Password
            </label>
            <div className="flex gap-2">
              <input
                id={passId}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setResult(null);
                }}
                autoComplete="off"
                spellCheck={false}
                className={field}
              />
              <Button variant="secondary" className="!px-3 !py-2 !text-sm" aria-pressed={show} onClick={() => setShow((s) => !s)}>
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{bytes} of {MAX_PASSWORD_BYTES} bytes (UTF-8)</p>
            {bytes > MAX_PASSWORD_BYTES - 1 && (
              <p role="alert" className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                bcrypt only reads the first 72 bytes including a trailing NUL, so it uses at most 71 bytes of password{bytes > MAX_PASSWORD_BYTES ? '; the rest is ignored' : ''}.
              </p>
            )}
          </div>

          {mode === 'generate' ? (
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Select label="Cost (rounds = 2^cost)" options={COSTS} value={cost} onChange={setCost} />
              <Select label="Version prefix" options={PREFIXES} value={prefix} onChange={setPrefix} />
              <p className="w-full text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
                {benchMs ? `Estimated time at cost ${cost}: about ${formatMs(estimateMs(cost, MIN_COST, benchMs))} on this device.` : 'Measuring speed…'}
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor={hashId} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
                Existing hash
              </label>
              <input id={hashId} value={existing} onChange={(e) => { setExisting(e.target.value); setResult(null); }} spellCheck={false} placeholder="$2b$10$…" className={field} />
              {existing && !parsed && <p className="mt-2 text-sm text-red-700 dark:text-red-400">Not a valid bcrypt hash (expected 60 characters starting with $2a$, $2b$ or $2y$).</p>}
            </div>
          )}
          <Button onClick={run} disabled={busy || (mode === 'verify' && !parsed)} className="pointer-coarse:min-h-11">
            {busy ? 'Working…' : mode === 'generate' ? 'Generate hash' : 'Verify'}
          </Button>
        </section>

        <section className={card} aria-label="Result" aria-busy={busy}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Result</h2>
            {result?.kind === 'hash' && <CopyButton text={result.hash} />}
          </div>
          {!result && <p className="text-sm text-slate-500 dark:text-slate-400">The result appears here. Nothing is saved.</p>}
          {result?.kind === 'error' && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{result.message}</p>}
          {result?.kind === 'hash' && <CodeBlock label="bcrypt hash">{result.hash}</CodeBlock>}
          {result?.kind === 'verify' && (
            <p role="status" className={`rounded-2xl border p-4 text-sm font-medium ${result.match ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200'}`}>
              {result.match ? 'Match: the password fits this hash.' : 'No match.'}
            </p>
          )}
          {(view ?? (result?.kind === 'verify' ? parsed : null)) && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {Object.entries({ Version: `$${(view ?? parsed)!.prefix}$`, Cost: `${(view ?? parsed)!.cost} (${2 ** (view ?? parsed)!.cost} rounds)`, 'Salt (22 chars)': (view ?? parsed)!.saltText, 'Hash (31 chars)': (view ?? parsed)!.hashText }).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="min-w-0 font-mono break-all text-slate-900 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      <Panel eyebrow="Estimated time per cost">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-3 dark:text-slate-300">
          {COSTS.map((c) => (
            <li key={c.value}>
              Cost {c.value}: {benchMs ? `~${formatMs(estimateMs(c.value, MIN_COST, benchMs))}` : '…'}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
