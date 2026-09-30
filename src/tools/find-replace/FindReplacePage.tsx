import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import findReplace from './index';
import { MAX_MATCHES, toSegments, type FindOptions, type Rule } from './features/findReplace';
import { useFindReplace } from './hooks/useFindReplace';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Checkbox, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

/** Only this much of the text is highlighted on screen; matching and replacing use all of it. */
const MAX_HIGHLIGHT_CHARS = 200_000;

const SAMPLE_TEXT = `Order 1042 shipped on 2026-09-14 to Ada Lovelace.
Order 1043 shipped on 2026-09-15 to Alan Turing.
Contact: support@example.com`;

const TEXT_FILES = '.txt,.csv,.tsv,.md,.log,.json,.xml,.html,.yaml,.yml,text/*';

const input =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-950 dark:text-slate-100';
const smallButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800';

let nextId = 2;

export default function FindReplacePage() {
  const [text, setText] = useState('');
  const [rules, setRules] = useState<Rule[]>([{ id: 1, find: '', replace: '', enabled: true }]);
  const [options, setOptions] = useState<FindOptions>({ regex: false, caseSensitive: false, wholeWord: false, multiline: false, replaceAll: true });
  const [activeId, setActiveId] = useState(1);
  // The current match resets whenever a new result arrives.
  const [position, setPosition] = useState<{ for: unknown; index: number }>({ for: null, index: 0 });
  const markRefs = useRef(new Map<number, HTMLElement>());

  const deferredText = useDeferredValue(text);
  const activeIndex = Math.max(0, rules.findIndex((r) => r.id === activeId));
  const state = useFindReplace(deferredText, rules, options, activeIndex);
  const result = state.status === 'done' ? state.result : state.status === 'running' ? state.last : undefined;
  const busy = state.status === 'running' || deferredText !== text;

  const active = result?.active ?? null;
  const matches = useMemo(() => active?.matches ?? [], [active]);
  const nonEmpty = useMemo(() => matches.map((m, i) => (m.end > m.index ? i : -1)).filter((i) => i >= 0), [matches]);
  const shown = active ? active.text.slice(0, MAX_HIGHLIGHT_CHARS) : '';
  const segments = useMemo(() => (active ? toSegments(shown, matches) : []), [active, shown, matches]);
  const current = position.for === active ? position.index : 0;
  const cur = nonEmpty.length ? Math.min(current, nonEmpty.length - 1) : 0;
  const setCurrent = (index: number) => setPosition({ for: active, index });

  useEffect(() => {
    const el = markRefs.current.get(nonEmpty[cur]);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [cur, nonEmpty]);

  const setRule = (id: number, patch: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRule = () => {
    const id = nextId++;
    setRules((rs) => [...rs, { id, find: '', replace: '', enabled: true }]);
    setActiveId(id);
  };
  const removeRule = (id: number) => {
    setRules((rs) => rs.filter((r) => r.id !== id));
    if (activeId === id) setActiveId(rules.find((r) => r.id !== id)?.id ?? 1);
  };
  const opt = (patch: Partial<FindOptions>) => setOptions((o) => ({ ...o, ...patch }));

  useIncomingText(findReplace.id, (t) => setText(t));
  useShareState(
    { text, ...options, finds: rules.map((r) => r.find), replaces: rules.map((r) => r.replace), enabled: rules.map((r) => r.enabled) },
    ({ text: t, finds, replaces, enabled, ...o }) => {
      if (t !== undefined) setText(t);
      setOptions((cur) => ({ ...cur, ...o }));
      const strings = finds?.filter((f): f is string => typeof f === 'string').slice(0, 50);
      if (!strings?.length) return;
      const next = strings.map((find, i) => ({
        id: nextId++,
        find,
        replace: typeof replaces?.[i] === 'string' ? replaces[i] : '',
        enabled: typeof enabled?.[i] === 'boolean' ? enabled[i] : true,
      }));
      setRules(next);
      setActiveId(next[0].id);
    },
  );

  const totalReplaced = result?.rules.reduce((n, r) => n + (r?.replaced ?? 0), 0) ?? 0;
  const status =
    state.status === 'timeout'
      ? 'Matching took longer than 1 second and was stopped. The pattern may backtrack catastrophically; try simplifying it.'
      : state.status === 'error'
        ? state.error
        : !text
          ? 'Paste text, then type what to find.'
          : !rules.some((r) => r.enabled && r.find)
            ? 'Type what to find.'
            : `${pluralize(totalReplaced, 'replacement')} across ${pluralize(rules.filter((r) => r.enabled && r.find).length, 'rule')}`;

  const loadSample = () => {
    setText(SAMPLE_TEXT);
    setOptions((o) => ({ ...o, regex: true }));
    setRules([
      { id: 1, find: '(\\d{4})-(\\d{2})-(\\d{2})', replace: '$3/$2/$1', enabled: true },
      { id: nextId, find: '(?<first>[A-Z]\\w+) (?<last>[A-Z]\\w+)\\.', replace: '$<last>, $<first>.', enabled: true },
    ]);
    nextId++;
    setActiveId(1);
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={findReplace} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="everywhere">Find and replace, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadSample}>
            Try an example
          </Button>
          <OpenFileButton accept={TEXT_FILES} onText={(t) => setText(t)} />
          <Button variant="ghost" disabled={!text} onClick={() => setText('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={busy ? 'busy' : state.status === 'done' && totalReplaced > 0 ? 'good' : 'neutral'} />

      <OptionsCard label="Options">
        <Checkbox label="Regular expression" checked={options.regex} onChange={(regex) => opt({ regex })} />
        <Checkbox label="Case sensitive" checked={options.caseSensitive} onChange={(caseSensitive) => opt({ caseSensitive })} />
        <Checkbox label="Whole word" checked={options.wholeWord} onChange={(wholeWord) => opt({ wholeWord })} />
        <Checkbox label="Multiline (^ and $ per line)" checked={options.multiline} onChange={(multiline) => opt({ multiline })} />
        <Segmented<'all' | 'first'>
          label="Replace"
          options={[
            { value: 'all', label: 'Replace all' },
            { value: 'first', label: 'Replace first' },
          ]}
          value={options.replaceAll ? 'all' : 'first'}
          onChange={(v) => opt({ replaceAll: v === 'all' })}
        />
      </OptionsCard>

      <section aria-label="Rules" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Icon name="regex" className="h-4 w-4" /> Rules, applied in order
          </h2>
          <button type="button" onClick={addRule} className={smallButton}>
            + Add rule
          </button>
        </div>
        <ol className="space-y-3">
          {rules.map((r, i) => {
            const outcome = result?.rules[i];
            const isActive = r.id === rules[activeIndex]?.id;
            return (
              <li
                key={r.id}
                onFocusCapture={() => setActiveId(r.id)}
                className={`rounded-2xl border p-3 ${isActive ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <input
                    aria-label={`Find (rule ${i + 1})`}
                    placeholder={options.regex ? 'Find (regex)' : 'Find'}
                    value={r.find}
                    onChange={(e) => setRule(r.id, { find: e.target.value })}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    className={input}
                    aria-invalid={outcome?.error ? true : undefined}
                  />
                  <input
                    aria-label={`Replace with (rule ${i + 1})`}
                    placeholder={options.regex ? 'Replace ($1, $<name>, $&)' : 'Replace with'}
                    value={r.replace}
                    onChange={(e) => setRule(r.id, { replace: e.target.value })}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    className={input}
                  />
                  <div className="flex items-center gap-2">
                    {outcome && !outcome.error && <Badge tone={outcome.count ? 'green' : 'neutral'}>{pluralize(outcome.count, 'match', 'matches')}</Badge>}
                    {rules.length > 1 && (
                      <>
                        <Checkbox label="On" checked={r.enabled} onChange={(enabled) => setRule(r.id, { enabled })} />
                        <button type="button" onClick={() => removeRule(r.id)} className={smallButton} aria-label={`Remove rule ${i + 1}`}>
                          <Icon name="x" className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {outcome?.error && <p className="mt-2 text-sm break-words text-red-800 dark:text-red-300">{outcome.error}</p>}
              </li>
            );
          })}
        </ol>
        {rules.length > 1 && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Each rule works on the result of the rules above it. Highlights show the selected rule.</p>}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea label="Text" value={text} onChange={(e) => setText(e.target.value)} rows={14} placeholder="Paste text here" onFileText={(t) => setText(t)} />

        <section aria-label="Matches" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="search" className="h-4 w-4" /> Matches{rules.length > 1 ? ` (rule ${activeIndex + 1})` : ''}
            </h2>
            <div className="flex items-center gap-1">
              <span className="px-2 text-sm text-slate-600 dark:text-slate-400" aria-live="polite" data-testid="match-position">
                {nonEmpty.length ? `${cur + 1} of ${nonEmpty.length}${active?.truncated ? '+' : ''}` : 'No matches'}
              </span>
              <button
                type="button"
                className={smallButton}
                disabled={!nonEmpty.length}
                onClick={() => setCurrent((cur - 1 + nonEmpty.length) % nonEmpty.length)}
                aria-label="Previous match"
              >
                <Icon name="chevron-left" className="h-4 w-4" />
              </button>
              <button type="button" className={smallButton} disabled={!nonEmpty.length} onClick={() => setCurrent((cur + 1) % nonEmpty.length)} aria-label="Next match">
                <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="p-4">
            <pre
              data-testid="highlighted"
              className={`max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-100 p-4 font-mono text-sm leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-300 ${busy ? 'opacity-60' : ''}`}
            >
              {segments.length
                ? segments.map((s, i) =>
                    s.match < 0 ? (
                      <span key={i}>{s.text}</span>
                    ) : (
                      <mark
                        key={i}
                        ref={(el) => {
                          if (el) markRefs.current.set(s.match, el);
                          else markRefs.current.delete(s.match);
                        }}
                        aria-current={s.match === nonEmpty[cur] ? 'true' : undefined}
                        className={`rounded px-0.5 ${
                          s.match === nonEmpty[cur]
                            ? 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-slate-950'
                            : 'bg-amber-200 text-slate-900 dark:bg-amber-700/60 dark:text-amber-50'
                        }`}
                      >
                        {s.text}
                      </mark>
                    ),
                  )
                : shown || ' '}
            </pre>
            {active && active.text.length > MAX_HIGHLIGHT_CHARS && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Only the start of the text is highlighted. Replacing uses all of it.</p>
            )}
            {active?.truncated && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Showing the first {MAX_MATCHES.toLocaleString('en-US')} matches.</p>}
          </div>
        </section>
      </div>

      {result && text && (
        <div className="space-y-3">
          <OutputPanel title="Result" icon="text" text={result.output} fileName="replaced.txt" mime="text/plain" busy={busy} />
          <Button variant="secondary" disabled={result.output === text} onClick={() => setText(result.output)}>
            Use result as the new text
          </Button>
        </div>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your text is searched in your browser and never uploaded. Regular expressions run in a background worker that&rsquo;s stopped after 1 second, so a
        runaway pattern can&rsquo;t freeze the page.
      </p>
    </div>
  );
}
