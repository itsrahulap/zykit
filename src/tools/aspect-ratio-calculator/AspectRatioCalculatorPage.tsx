import { useState } from 'react';
import aspectRatioCalculator from './index';
import {
  cssSnippet, formatNum, nearestCommon, parseSide, PRESETS, resolutionsFor, scaleBy, simplify, solveHeight, solveWidth,
  type Ratio,
} from './features/aspect-ratio-calculator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { useShareState } from '../../shared/hooks/useShareState';

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const chip =
  'rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 pointer-coarse:min-h-11 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

export default function AspectRatioCalculatorPage() {
  const [wText, setW] = useState('1920');
  const [hText, setH] = useState('1080');
  const [lock, setLock] = useState(false);
  const [locked, setLocked] = useState<Ratio>({ w: 16, h: 9 });
  const [percent, setPercent] = useState('50');

  useShareState(
    { w: wText, h: hText, lock, pct: percent },
    (s) => {
      if (s.w !== undefined) setW(s.w);
      if (s.h !== undefined) setH(s.h);
      if (s.pct !== undefined) setPercent(s.pct);
      const w = parseSide(s.w ?? wText);
      const h = parseSide(s.h ?? hText);
      if (s.lock && w && h) {
        setLock(true);
        setLocked(simplify(w, h));
      }
    },
  );

  const w = parseSide(wText);
  const h = parseSide(hText);
  const ratio = w && h ? simplify(w, h) : null;
  const near = w && h ? nearestCommon(w, h) : null;
  const pct = Number(percent);
  const scaled = w && h && percent.trim() && pct > 0 && pct <= 10000 ? scaleBy(w, h, pct) : null;
  const matches = w && h ? resolutionsFor(w, h) : [];
  const css = ratio ? cssSnippet(ratio) : '';

  const editW = (v: string) => {
    setW(v);
    const n = parseSide(v);
    if (lock && n) setH(String(solveHeight(n, locked)));
  };
  const editH = (v: string) => {
    setH(v);
    const n = parseSide(v);
    if (lock && n) setW(String(solveWidth(n, locked)));
  };
  const toggleLock = (on: boolean) => {
    setLock(on);
    if (on && ratio) setLocked(ratio);
  };
  const preset = (r: Ratio) => {
    setLocked(r);
    setLock(true);
    if (w) setH(String(solveHeight(w, r)));
    else {
      setW('1000');
      setH(String(solveHeight(1000, r)));
    }
  };
  const setSize = (nw: number, nh: number) => {
    setW(String(nw));
    setH(String(nh));
    if (lock) setLocked(simplify(nw, nh));
  };

  const status = !wText.trim() || !hText.trim()
    ? 'Enter a width and a height.'
    : !ratio
      ? 'Width and height must be numbers greater than 0 (up to 100000).'
      : `${ratio.w}:${ratio.h}${near && !near.exact ? `, close to ${near.ratio.w}:${near.ratio.h}` : ''}`;

  // Preview box: fit the ratio inside a 100%-wide, max 12rem-tall area.
  const pw = ratio ? ratio.w / ratio.h : 1;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={aspectRatioCalculator} />
      <Headline accent="ratio">Find any aspect </Headline>
      <StatusStrip status={status} tone={ratio ? 'good' : 'neutral'} />

      <section aria-label="Size" className={card}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="ar-w" className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Width</label>
            <input id="ar-w" value={wText} inputMode="decimal" autoComplete="off" aria-invalid={(!!wText.trim() && !w) || undefined} onChange={(e) => editW(e.target.value)} className={inputClass} />
          </div>
          <div className="min-w-0">
            <label htmlFor="ar-h" className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Height</label>
            <input id="ar-h" value={hText} inputMode="decimal" autoComplete="off" aria-invalid={(!!hText.trim() && !h) || undefined} onChange={(e) => editH(e.target.value)} className={inputClass} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
          <input type="checkbox" checked={lock} onChange={(e) => toggleLock(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          Lock ratio{lock && ` (${formatNum(locked.w)}:${formatNum(locked.h)}): editing one side solves the other`}
        </label>
        <div role="group" aria-label="Presets" className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => preset(p.ratio)} className={chip}>{p.label}</button>
          ))}
        </div>
      </section>

      {ratio && w && h && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="Result" className={card}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Ratio</dt>
              <dd data-testid="ratio" className="min-w-0 break-words font-mono text-slate-900 dark:text-slate-100">{ratio.w}:{ratio.h}</dd>
              <dt className="text-slate-500">Decimal</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">{(w / h).toFixed(4)}</dd>
              <dt className="text-slate-500">Nearest common</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">{near!.ratio.w}:{near!.ratio.h}{near!.exact ? ' (exact)' : ' (approximate)'}</dd>
            </dl>
            <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-4 dark:bg-slate-800" aria-hidden="true">
              <div
                className="flex max-h-48 w-full items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-500/10 text-sm font-medium text-emerald-800 dark:text-emerald-300"
                style={{ aspectRatio: String(pw), maxWidth: `${Math.min(100, 12 * 16 * pw)}px` }}
              >
                {ratio.w}:{ratio.h}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="eyebrow text-slate-600 dark:text-slate-400">CSS</h2>
                <CopyButton text={css} />
              </div>
              <CodeBlock label="CSS aspect-ratio">{css}</CodeBlock>
            </div>
          </section>

          <section aria-label="Scale and resolutions" className={card}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 basis-28">
                <label htmlFor="ar-pct" className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Scale (%)</label>
                <input id="ar-pct" value={percent} inputMode="decimal" autoComplete="off" onChange={(e) => setPercent(e.target.value)} className={inputClass} />
              </div>
              <p data-testid="scaled" className="min-w-0 pb-2.5 font-mono text-sm text-slate-900 dark:text-slate-100">
                {scaled ? `${scaled.w} × ${scaled.h}` : 'Enter 0–10000'}
              </p>
              {scaled && <button type="button" className={chip} onClick={() => setSize(scaled.w, scaled.h)}>Use</button>}
            </div>
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Common resolutions at this ratio</h2>
            {matches.length ? (
              <ul className="flex flex-wrap gap-2">
                {matches.map((m) => (
                  <li key={m.name}>
                    <button type="button" onClick={() => setSize(m.w, m.h)} className={chip}>{m.name}: {m.w}×{m.h}</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No listed resolution is within 1% of this ratio.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
