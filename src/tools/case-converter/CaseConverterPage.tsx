import { useDeferredValue, useMemo, useState } from 'react';
import caseConverter from './index';
import { CASE_FORMATS, convertLines } from './features/case';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const SAMPLE = `XMLHttpRequest handler
user_id
the lord of the rings`;

/** Converted output longer than this is truncated on screen; Copy still gets all of it. */
const MAX_PREVIEW_CHARS = 20_000;

export default function CaseConverterPage() {
  const [input, setInput] = useState('');
  const text = useDeferredValue(input);
  const stale = text !== input;

  const results = useMemo(
    () => (text ? CASE_FORMATS.map((f) => ({ id: f.id, label: f.label, value: convertLines(text, f) })) : []),
    [text],
  );
  const lines = text ? text.split(/\r?\n/).length : 0;
  const status = !text ? 'Type or paste text to see it in every case at once.' : `Converted ${pluralize(lines, 'line')} into ${CASE_FORMATS.length} formats`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={caseConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="case">Change text to any </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : text ? 'good' : 'neutral'} />

      <CodeArea
        label="Text"
        hint="each line is converted separately"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        placeholder="myVariableName or Some Title"
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Conversions">
        {(results.length ? results : CASE_FORMATS.map((f) => ({ id: f.id, label: f.label, value: '' }))).map((r) => (
          <li key={r.id} className="min-w-0">
            <section
              aria-label={r.label}
              className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 pr-3 pl-5 dark:border-slate-800">
                <h2 className="truncate font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{r.label}</h2>
                <CopyButton text={r.value} />
              </header>
              <pre className="max-h-48 min-h-14 flex-1 overflow-y-auto whitespace-pre-wrap break-all p-5 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {r.value ? (
                  r.value.length > MAX_PREVIEW_CHARS ? `${r.value.slice(0, MAX_PREVIEW_CHARS)}…` : r.value
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )}
              </pre>
            </section>
          </li>
        ))}
      </ul>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Words are split on spaces, punctuation, camelCase humps and acronyms (XMLHttpRequest → xml http request) and between letters and digits.
        Your text never leaves your browser.
      </p>
    </div>
  );
}
