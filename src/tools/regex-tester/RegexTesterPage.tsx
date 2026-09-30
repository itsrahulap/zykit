import { useDeferredValue, useMemo, useState } from 'react';
import regexTester from './index';
import { explain, FLAGS, MAX_MATCHES, MAX_TEXT, segments, type Match } from './features/regex';
import { useRegex } from './hooks/useRegex';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { OpenFileButton } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';
import { useOverflow } from '../../shared/hooks/useOverflow';

/** Rows shown in the match table; the rest are still highlighted and counted. */
const TABLE_ROWS = 500;

const INPUT =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

const SAMPLE = {
  pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(\\d{2})',
  flags: 'g',
  text: 'Released 2024-03-10, patched 2024-04-02.\nNext review: 2025-01-15.',
  replacement: '$<month>/$3/$<year>',
};

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
  red: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900',
};

const KIND_TONE = {
  literal: TONES.neutral,
  escape: TONES.blue,
  class: TONES.violet,
  group: TONES.green,
  quantifier: TONES.amber,
  anchor: TONES.red,
  alternation: TONES.amber,
  any: TONES.blue,
  backref: TONES.violet,
} as const;

const TEXT_FILES = '.txt,.csv,.tsv,.md,.log,.json,.xml,.html,.yaml,.yml,text/*';

const PATTERN_ERROR_ID = 'regex-pattern-error';

const validFlags = (f: string) => FLAGS.map((x) => x.flag).filter((x) => f.includes(x)).join('');

const show = (s: string | undefined) => (s === undefined ? '—' : JSON.stringify(s));

function Highlighted({ text, matches }: { text: string; matches: Match[] }) {
  const segs = useMemo(() => segments(text, matches), [text, matches]);
  const [ref, overflowing] = useOverflow<HTMLPreElement>([segs]);
  // A named region (a bare <pre> can't carry aria-label); focusable when it scrolls, so keyboard users can scroll it.
  return (
    <pre
      ref={ref}
      role="region"
      aria-label="Highlighted matches"
      tabIndex={overflowing ? 0 : undefined}
      className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-slate-100 p-4 font-mono text-sm leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-300"
    >
      {segs.map((s, i) =>
        s.match < 0 ? (
          s.text
        ) : (
          <mark
            key={i}
            title={`Match ${s.match + 1}`}
            className={`rounded px-px text-slate-900 dark:text-white ${s.match % 2 ? 'bg-sky-200 dark:bg-sky-800' : 'bg-emerald-200 dark:bg-emerald-800'}`}
          >
            {s.text}
          </mark>
        ),
      )}
    </pre>
  );
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [replacement, setReplacement] = useState('');

  const deferredText = useDeferredValue(text);
  const tooLarge = deferredText.length > MAX_TEXT;
  const state = useRegex(pattern, flags, tooLarge ? '' : deferredText, replacement ? replacement : undefined);
  const tokens = useMemo(() => explain(pattern), [pattern]);

  const toggle = (f: string) =>
    setFlags((cur) =>
      FLAGS.map((x) => x.flag)
        .filter((x) => (x === f ? !cur.includes(x) : cur.includes(x)))
        .join(''),
    );

  const result = state.status === 'done' ? state.result : null;
  const matches = result?.ok ? result.matches : [];

  const status = tooLarge
    ? `The test text is too long (limit: ${MAX_TEXT.toLocaleString('en-US')} characters).`
    : state.status === 'idle'
      ? 'Type a pattern to see its matches.'
      : state.status === 'running'
        ? 'Matching…'
        : state.status === 'timeout'
          ? 'Stopped after 1 s — the pattern may backtrack catastrophically'
          : !state.result.ok
            ? `Invalid pattern: ${state.result.error}`
            : state.result.truncated
              ? `Showing the first ${MAX_MATCHES.toLocaleString('en-US')} matches`
              : state.result.matches.length === 0
                ? 'No matches'
                : pluralize(state.result.matches.length, 'match', 'matches');

  useIncomingText(regexTester.id, (t) => {
    const literal = /^\/(.+)\/([a-z]*)$/s.exec(t.trim());
    setPattern(literal ? literal[1] : t);
    if (literal) setFlags(validFlags(literal[2]));
  });
  useShareState({ pattern, flags, text, replacement }, (r) => {
    if (r.pattern !== undefined) setPattern(r.pattern);
    if (r.flags !== undefined) setFlags(validFlags(r.flags));
    if (r.text !== undefined) setText(r.text);
    if (r.replacement !== undefined) setReplacement(r.replacement);
  });
  const replaced = result?.ok ? (result.replaced ?? '') : '';
  useToolShortcuts({ getOutput: () => replaced });

  const groupCount = matches.reduce((n, m) => Math.max(n, m.groups.length), 0);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={regexTester} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="pattern">Test every </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setPattern(SAMPLE.pattern);
              setFlags(SAMPLE.flags);
              setText(SAMPLE.text);
              setReplacement(SAMPLE.replacement);
            }}
          >
            Try an example
          </Button>
          <OpenFileButton accept={TEXT_FILES} onText={(t) => setText(t)} />
          <Button
            variant="ghost"
            disabled={!pattern && !text && !replacement}
            onClick={() => {
              setPattern('');
              setText('');
              setReplacement('');
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={state.status === 'running' ? 'busy' : result?.ok && matches.length > 0 ? 'good' : 'neutral'} />

      {state.status === 'timeout' && (
        <p
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          Stopped after 1 s — the pattern may backtrack catastrophically. Nested quantifiers like <code>(a+)+</code> can take exponential time on text
          that almost matches; try making the inner part more specific.
        </p>
      )}

      <section
        aria-label="Pattern and flags"
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="block">
          <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Pattern</span>
          <span className="flex items-center gap-2 font-mono text-slate-500">
            <span aria-hidden="true">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="[a-z]+"
              aria-label="Pattern"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-invalid={result ? !result.ok : undefined}
              aria-describedby={result && !result.ok ? PATTERN_ERROR_ID : undefined}
              className={INPUT}
            />
            <span aria-hidden="true" className="whitespace-nowrap">
              /{flags}
            </span>
          </span>
        </label>
        {result && !result.ok && (
          <p id={PATTERN_ERROR_ID} className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
            <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{result.error}</span>
          </p>
        )}
        <fieldset>
          <legend className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Flags</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FLAGS.map((f) => (
              <label
                key={f.flag}
                className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm pointer-coarse:min-h-11 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 dark:border-slate-800 dark:has-[:checked]:border-emerald-700 dark:has-[:checked]:bg-emerald-950/40"
              >
                <input
                  type="checkbox"
                  checked={flags.includes(f.flag)}
                  onChange={() => toggle(f.flag)}
                  aria-label={`${f.flag} — ${f.name}`}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <span className="min-w-0">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{f.flag}</span>{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">{f.name}</span>
                  <span className="block text-slate-500 dark:text-slate-400">{f.info}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea label="Test text" value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Text to search" onFileText={(t) => setText(t)} />
        <div className="min-w-0">
          <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Matches</span>
          <Highlighted text={tooLarge ? '' : deferredText} matches={matches} />
        </div>
      </div>

      {matches.length > 0 && (
        <section aria-label="Match table" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="grid" className="h-4 w-4" /> Match details
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Index</th>
                  <th className="px-3 py-2 font-medium">Match</th>
                  {groupCount > 0 && <th className="px-3 py-2 font-medium">Groups</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                {matches.slice(0, TABLE_ROWS).map((m, i) => (
                  <tr key={i}>
                    <td className="px-6 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      {m.index}–{m.end}
                    </td>
                    <td className="max-w-xs break-all px-3 py-2">{show(m.text)}</td>
                    {groupCount > 0 && (
                      <td className="px-3 py-2">
                        <ul className="space-y-0.5">
                          {m.groups.map((g, gi) => (
                            <li key={gi} className="break-all">
                              <span className="text-slate-500">${gi + 1}</span> {show(g)}
                            </li>
                          ))}
                          {Object.entries(m.named).map(([k, v]) => (
                            <li key={k} className="break-all">
                              <span className="text-emerald-700 dark:text-emerald-400">{`<${k}>`}</span> {show(v)}
                            </li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matches.length > TABLE_ROWS && (
            <p className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
              Showing {TABLE_ROWS} of {matches.length.toLocaleString('en-US')} matches in the table.
            </p>
          )}
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel eyebrow="Replace" icon="swap" className="min-w-0">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">
              Replacement <span className="text-slate-500">— use $1, $&lt;name&gt;, $&amp; or $$</span>
            </span>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className={INPUT}
            />
          </label>
          {result?.ok && result.replaced !== undefined && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Result</span>
                <div className="flex flex-wrap items-center gap-1">
                  <CopyButton text={result.replaced} />
                  <SendToMenu text={result.replaced} kind="text" />
                </div>
              </div>
              <CodeBlock className="max-h-80 overflow-y-auto">{result.replaced}</CodeBlock>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Pattern explained" icon="lightbulb" className="min-w-0">
          {tokens.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Each part of your pattern is explained here.</p>
          ) : (
            <ol aria-label="Pattern tokens" className="space-y-2 text-sm">
              {tokens.map((t, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <code className={`max-w-[50%] shrink-0 break-all rounded-md px-1.5 py-0.5 text-xs ring-1 ring-inset ${KIND_TONE[t.kind]}`}>
                    {t.text}
                  </code>
                  <span className="min-w-0 text-slate-700 dark:text-slate-300">{t.info}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Uses your browser&rsquo;s JavaScript regex engine in a background worker; runs longer than 1 second are stopped. Nothing leaves your device.
      </p>
    </div>
  );
}
