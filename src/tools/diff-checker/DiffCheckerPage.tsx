import { useState } from 'react';
import diffChecker from './index';
import { DiffView, type ViewMode } from './components/DiffView';
import type { DiffResult } from './features/diff';
import { useDiff } from './hooks/useDiff';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const SAMPLE_A = `function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}

greet("world");
`;

const SAMPLE_B = `function greet(name, punctuation = "!") {
  const message = \`Hello, \${name}\${punctuation}\`;
  console.log(message);
  return message;
}

greet("Zykit");
`;

function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-600"
      />
      {label}
    </label>
  );
}

function summary(r: DiffResult): string {
  if (r.identical) return 'No differences';
  return `+${pluralize(r.additions, 'addition')}, −${pluralize(r.removals, 'removal')}`;
}

function notes(r: DiffResult): string[] {
  const out: string[] = [];
  if (r.a.eol !== r.b.eol && r.a.eol !== 'none' && r.b.eol !== 'none') {
    out.push(`Line endings differ (Original: ${r.a.eol}, Changed: ${r.b.eol}). They were normalised before comparing.`);
  }
  if (r.a.lines > 0 && r.b.lines > 0 && r.a.trailingNewline !== r.b.trailingNewline) {
    out.push(`Only the ${r.a.trailingNewline ? 'Original' : 'Changed'} text ends with a newline.`);
  }
  if (!r.exact) {
    out.push('These texts are very different, so parts are shown as whole blocks replaced rather than matched line by line.');
  }
  return out;
}

export default function DiffCheckerPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [trim, setTrim] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [mode, setMode] = useState<ViewMode>('split');
  const [collapsed, setCollapsed] = useState(true);
  const [context, setContext] = useState(3);

  const { result, unified, busy, error, version } = useDiff(a, b, { trim, ignoreWhitespace, ignoreCase });
  const empty = !a && !b;

  const status = error
    ? 'Can’t compare these inputs.'
    : busy
      ? 'Comparing…'
      : empty
        ? 'Paste or type text into both boxes to compare them.'
        : result
          ? result.identical
            ? ignoreCase || trim || ignoreWhitespace
              ? 'No differences with the current options.'
              : 'No differences. Both texts are identical.'
            : summary(result)
          : 'Comparing…';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={diffChecker} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="change">Spot every </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setA(SAMPLE_A);
              setB(SAMPLE_B);
            }}
          >
            Try an example
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={busy ? 'busy' : result && !error ? (result.identical ? 'good' : 'neutral') : 'neutral'} />

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <Icon name="warn" className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <CodeArea label="Original" value={a} onChange={(e) => setA(e.target.value)} rows={12} placeholder="Paste the original text…" />
        <CodeArea label="Changed" value={b} onChange={(e) => setB(e.target.value)} rows={12} placeholder="Paste the changed text…" />
      </div>

      <section aria-label="Comparison options" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Checkbox label="Ignore leading/trailing whitespace" checked={trim || ignoreWhitespace} disabled={ignoreWhitespace} onChange={setTrim} />
          <Checkbox label="Ignore all whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
          <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented<ViewMode>
            label="View"
            options={[
              { value: 'split', label: 'Side by side' },
              { value: 'unified', label: 'Unified' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Checkbox label="Collapse unchanged lines" checked={collapsed} onChange={setCollapsed} />
          <label className={`inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 ${collapsed ? '' : 'opacity-50'}`}>
            Context lines
            <select
              value={context}
              disabled={!collapsed}
              onChange={(e) => setContext(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {[0, 1, 3, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={empty}
            onClick={() => {
              setA(b);
              setB(a);
            }}
          >
            <Icon name="swap" className="h-4 w-4" /> Swap sides
          </Button>
          <Button
            variant="ghost"
            disabled={empty}
            onClick={() => {
              setA('');
              setB('');
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </section>

      {result && !error && (
        <section
          aria-label="Differences"
          aria-busy={busy}
          className={`overflow-hidden rounded-3xl border border-slate-200 bg-white transition-opacity dark:border-slate-800 dark:bg-slate-900 ${busy ? 'opacity-60' : ''}`}
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="diff" className="h-4 w-4" /> Result
              </h2>
              {result.identical ? (
                <Badge tone="green">
                  <Icon name="check" className="h-3 w-3" /> No differences
                </Badge>
              ) : (
                <>
                  <Badge tone="green">+{pluralize(result.additions, 'addition')}</Badge>
                  <Badge tone="red">−{pluralize(result.removals, 'removal')}</Badge>
                </>
              )}
            </div>
            <CopyButton text={unified} label="Copy unified diff" disabled={result.identical} />
          </header>
          {notes(result).length > 0 && (
            <ul className="space-y-1 border-b border-slate-100 px-6 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              {notes(result).map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" /> {n}
                </li>
              ))}
            </ul>
          )}
          {result.identical ? (
            <p className="px-6 py-10 text-center text-slate-600 dark:text-slate-400">
              {ignoreCase || trim || ignoreWhitespace ? 'The texts match when the selected differences are ignored.' : 'Both texts are identical.'}
            </p>
          ) : (
            <DiffView key={version} lines={result.lines} mode={mode} collapsed={collapsed} context={context} />
          )}
        </section>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Texts are compared in your browser and never uploaded. Line endings (CRLF / LF) are normalised before comparing.
      </p>
    </div>
  );
}
