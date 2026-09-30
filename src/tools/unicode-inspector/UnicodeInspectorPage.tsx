import { useDeferredValue, useMemo, useState } from 'react';
import unicodeInspector from './index';
import { analyze, cleanText, displayFor, generalCategory, graphemes, type FlagKind, type Severity } from './features/unicode-inspector';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CopyButton } from '../../shared/ui/tool';
import { Checkbox, OpenFileButton } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const MAX_INPUT = 1_000_000;
const MAX_ROWS = 2000;
const MAX_CHIPS = 1000;

const SAMPLE = 'Café é 👨‍👩‍👧 🇺🇸 👍🏽\nLog in at pаypal.com​ today !\nif (role != "user‮ ⁦// admin⁩⁦") {}\nﬁ ① ｆｕｌｌ';

const FLAG_LABELS: Record<FlagKind, string> = {
  bidi: 'bidirectional control',
  invisible: 'invisible character',
  space: 'unusual space',
  control: 'control character',
  variation: 'stray variation selector',
  tag: 'tag character',
  confusable: 'look-alike character',
  private: 'private-use character',
  unassigned: 'unassigned code point',
  surrogate: 'lone surrogate',
  replacement: 'replacement character',
};

const toneFor = (s: Severity | undefined) => (s === 'danger' ? 'red' : s === 'warn' ? 'amber' : 'neutral');
const bytesHex = (b: number[], w = 2) => (b.length ? b.map((x) => x.toString(16).toUpperCase().padStart(w, '0')).join(' ') : '—');

export default function UnicodeInspectorPage() {
  const [input, setInput] = useState('');
  const [normalizeSpaces, setNormalizeSpaces] = useState(true);
  const [replaceConfusables, setReplaceConfusables] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useIncomingText(unicodeInspector.id, (t) => setInput(t));
  useShareState({ input }, (s) => s.input !== undefined && setInput(s.input));

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT;
  const a = useMemo(() => (text && !tooLarge ? analyze(text, MAX_ROWS) : null), [text, tooLarge]);
  const clusters = useMemo(() => (text && !tooLarge ? graphemes(text.slice(0, 20_000)).slice(0, MAX_CHIPS) : []), [text, tooLarge]);
  const cleaned = useMemo(() => (a ? cleanText(text, { normalizeSpaces, replaceConfusables }) : null), [a, text, normalizeSpaces, replaceConfusables]);
  useToolShortcuts({ getOutput: () => cleaned?.text ?? '' });

  const worstByGrapheme = useMemo(() => {
    const m = new Map<number, Severity>();
    const rank = { info: 0, warn: 1, danger: 2 };
    for (const r of a?.rows ?? [])
      for (const f of r.flags) {
        const cur = m.get(r.grapheme);
        if (!cur || rank[f.severity] > rank[cur]) m.set(r.grapheme, f.severity);
      }
    return m;
  }, [a]);

  const status = tooLarge
    ? 'This text is too large to inspect here (limit: 1,000,000 characters).'
    : !a
      ? 'Paste text to see every character in it.'
      : `${pluralize(a.graphemeCount, 'character')} · ${pluralize(a.codePointCount, 'code point')} · ${pluralize(a.utf8Length, 'UTF-8 byte')} · ${pluralize(a.utf16Length, 'UTF-16 unit')}`;

  const flagSummary = a
    ? (Object.entries(a.flagCounts) as [FlagKind, number][]).map(([k, n]) => `${pluralize(n, FLAG_LABELS[k])}`)
    : [];
  const dangerous = !!a && ((a.flagCounts.bidi ?? 0) > 0 || (a.flagCounts.tag ?? 0) > 0);
  const detail = selected !== null ? a?.rows[selected] : undefined;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={unicodeInspector} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="character">Inspect every </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".txt,.md,.csv,.json,.js,.ts,.py,text/*" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : a ? 'good' : 'neutral'} />

      <CodeArea label="Text" value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder="Paste text, a URL or source code…" onFileText={(t) => setInput(t)} />

      {a && (
        <>
          {a.flagged > 0 ? (
            <div
              role="status"
              className={`space-y-2 rounded-2xl border p-4 text-sm ${
                dangerous
                  ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
              }`}
            >
              <p className="flex items-start gap-2 font-semibold">
                <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" /> Found {flagSummary.join(', ')}.
              </p>
              {dangerous && (
                <p>
                  Bidirectional controls and tag characters can make text look different from what it is, e.g. code that reads as a comment but runs
                  (&ldquo;Trojan Source&rdquo;), or instructions hidden from people but read by software.
                </p>
              )}
            </div>
          ) : (
            <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Icon name="check" className="h-4 w-4 shrink-0" /> No invisible, bidi-control or look-alike characters found.
            </p>
          )}

          <section aria-label="Characters" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="eyebrow mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="grid" className="h-4 w-4" /> Characters (grapheme clusters)
            </h2>
            <ol className="flex flex-wrap gap-1.5">
              {clusters.map((g, i) => {
                const sev = worstByGrapheme.get(i);
                const cps = Array.from(g).length;
                return (
                  <li
                    key={i}
                    title={`${pluralize(cps, 'code point')}`}
                    className={`flex min-h-9 min-w-9 items-center justify-center rounded-lg px-1.5 font-mono text-lg ring-1 ring-inset ${
                      sev === 'danger'
                        ? 'bg-red-50 ring-red-300 dark:bg-red-950/60 dark:ring-red-800'
                        : sev === 'warn'
                          ? 'bg-amber-50 ring-amber-300 dark:bg-amber-950/60 dark:ring-amber-800'
                          : 'bg-slate-50 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800'
                    } text-slate-900 dark:text-slate-100`}
                  >
                    {/^\s$/u.test(g) || /^\p{C}+$/u.test(g) || sev ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {Array.from(g)
                          .map((c) => displayFor(c.codePointAt(0)!, generalCategory(c)[0]))
                          .join(' ')}
                      </span>
                    ) : (
                      g
                    )}
                  </li>
                );
              })}
            </ol>
            {a.graphemeCount > clusters.length && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Showing the first {clusters.length.toLocaleString('en-US')}.</p>}
          </section>

          <section aria-label="Code points" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <header className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="hash" className="h-4 w-4" /> Code points
              </h2>
            </header>
            <div className="max-h-[36rem] overflow-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-2">Char</th>
                    <th scope="col" className="px-2 py-2">Code point</th>
                    <th scope="col" className="px-2 py-2">Name</th>
                    <th scope="col" className="px-2 py-2">Category</th>
                    <th scope="col" className="px-2 py-2">Script</th>
                    <th scope="col" className="px-2 py-2">UTF-8</th>
                    <th scope="col" className="px-2 py-2">UTF-16</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {a.rows.map((r, i) => {
                    const sev = r.flags.find((f) => f.severity === 'danger')?.severity ?? r.flags.find((f) => f.severity === 'warn')?.severity;
                    return (
                      <tr
                        key={i}
                        className={`${selected === i ? 'bg-emerald-50 dark:bg-emerald-950/40' : sev === 'danger' ? 'bg-red-50/60 dark:bg-red-950/30' : sev === 'warn' ? 'bg-amber-50/60 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <td className="px-4 py-1.5 font-mono text-base text-slate-900 dark:text-slate-100">
                          <button type="button" className="min-w-8 text-left pointer-coarse:min-h-11" aria-label={`Details for ${r.hex}`} aria-pressed={selected === i} onClick={() => setSelected(selected === i ? null : i)}>
                            {r.display}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">{r.hex}</td>
                        <td className="px-2 py-1.5 text-slate-800 dark:text-slate-200">
                          {r.name ?? <span className="text-slate-500 dark:text-slate-400">({r.block})</span>}
                          {r.flags
                            .filter((f) => f.severity !== 'info')
                            .map((f) => (
                              <span key={f.kind} className="ml-2">
                                <Badge tone={toneFor(f.severity)}>{FLAG_LABELS[f.kind]}</Badge>
                              </span>
                            ))}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-slate-600 dark:text-slate-400" title={r.categoryName}>
                          {r.category}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-slate-600 dark:text-slate-400">{r.script}</td>
                        <td className="px-2 py-1.5 font-mono whitespace-nowrap text-slate-600 dark:text-slate-400">{bytesHex(r.utf8)}</td>
                        <td className="px-2 py-1.5 font-mono whitespace-nowrap text-slate-600 dark:text-slate-400">{bytesHex(r.utf16, 4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {a.truncated && (
              <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400">
                Showing the first {MAX_ROWS.toLocaleString('en-US')} code points; the warnings above cover the whole text.
              </p>
            )}
          </section>

          {detail && (
            <Panel eyebrow={`${detail.hex} details`} icon="info">
              <div className="flex flex-wrap items-start gap-6">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 font-mono text-4xl text-slate-900 dark:bg-slate-950 dark:text-white">{detail.display}</span>
                <dl className="grid min-w-0 flex-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {(
                    [
                      ['Name', detail.name ?? `No name in the built-in table (${detail.block})`],
                      ['Category', `${detail.categoryName} (${detail.category})`],
                      ['Script', detail.script],
                      ['Block', detail.block],
                      ['Decimal', String(detail.cp)],
                      ['HTML', detail.escapes.html],
                      ['JavaScript', detail.escapes.js],
                      ['CSS', detail.escapes.css],
                      ['URL', detail.escapes.url],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                      <dd className="font-mono break-all text-slate-900 dark:text-slate-100">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {detail.flags.map((f) => (
                <p key={f.kind} className="mt-4 text-sm text-slate-700 dark:text-slate-300">
                  <Badge tone={toneFor(f.severity)}>{FLAG_LABELS[f.kind]}</Badge> {f.message}
                </p>
              ))}
            </Panel>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel eyebrow="Scripts and look-alikes" icon="globe">
              <div className="flex flex-wrap gap-2">
                {a.scripts.map((s) => (
                  <Badge key={s.script} tone={s.script === 'Latin' || s.script === 'Common' ? 'neutral' : 'blue'}>
                    {s.script} · {s.count.toLocaleString('en-US')}
                  </Badge>
                ))}
              </div>
              {a.mixedWords.length > 0 ? (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Words mixing scripts (possible spoofing):</p>
                  <ul className="space-y-1.5 text-sm">
                    {a.mixedWords.map((w) => (
                      <li key={w.word} className="break-words text-slate-700 dark:text-slate-300">
                        <span className="font-mono font-semibold text-red-700 dark:text-red-400">{w.word}</span> mixes {w.scripts.join(' + ')}
                        {w.skeleton !== w.word && (
                          <>
                            {' '}
                            and looks like <span className="font-mono">{w.skeleton}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">No word mixes letters from different scripts.</p>
              )}
            </Panel>

            <Panel eyebrow="Normalization" icon="layers">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="py-2 pr-3">Form</th>
                      <th scope="col" className="py-2 pr-3">Same as input?</th>
                      <th scope="col" className="py-2 pr-3">Code points</th>
                      <th scope="col" className="py-2 pr-3">UTF-8 bytes</th>
                      <th scope="col" className="py-2"><span className="sr-only">Copy</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {a.normalization.map((n) => (
                      <tr key={n.form}>
                        <th scope="row" className="py-2 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100">{n.form}</th>
                        <td className="py-2 pr-3">{n.same ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Differs</Badge>}</td>
                        <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{n.codePoints.toLocaleString('en-US')}</td>
                        <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{n.utf8Bytes.toLocaleString('en-US')}</td>
                        <td className="py-2">
                          <CopyButton text={n.text} label="Copy" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                NFC composes (é as one code point), NFD decomposes (e + ◌́). The K forms also fold look-alike variants such as ﬁ → fi and ① → 1.
              </p>
            </Panel>
          </div>

          {cleaned && (
            <section aria-label="Cleaned text" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
                <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="sparkle" className="h-4 w-4" /> Cleaned text
                </h2>
                <div className="flex flex-wrap items-center gap-1">
                  <CopyButton text={cleaned.text} />
                  <SendToMenu text={cleaned.text} kind="text" />
                  <Button variant="secondary" disabled={cleaned.text === text} onClick={() => setInput(cleaned.text)}>
                    Clean the input
                  </Button>
                </div>
              </header>
              <div className="space-y-3 p-4 sm:px-6">
                <div className="flex flex-wrap gap-x-6">
                  <Checkbox label="Turn unusual spaces into normal spaces" checked={normalizeSpaces} onChange={setNormalizeSpaces} />
                  <Checkbox label="Replace look-alike letters" checked={replaceConfusables} onChange={setReplaceConfusables} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {cleaned.removed || cleaned.replaced
                    ? `Removes ${pluralize(cleaned.removed, 'invisible or control character')} and replaces ${pluralize(cleaned.replaced, 'character')}. Emoji sequences are kept intact.`
                    : 'Nothing to clean.'}
                </p>
              </div>
            </section>
          )}
        </>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Everything runs in your browser. Categories and scripts come from your browser&rsquo;s Unicode data; names come from a built-in table for common
        blocks, so rarer characters show their block instead.
      </p>
    </div>
  );
}
