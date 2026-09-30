import { useDeferredValue, useMemo, useState } from 'react';
import envDiff from './index';
import { diffCounts, diffEnv, maskValue, parseEnv, toExample, type DiffRow, type DiffStatus, type EnvEntry, type ParsedEnv } from './features/env-diff';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { OpenFileButton, OutputPanel } from '../../shared/ui/convert';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Filter = 'all' | DiffStatus;

const SAMPLE_A = `# .env.example — what the app expects
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://localhost/app
REDIS_URL=
STRIPE_SECRET_KEY=
FEATURE_FLAGS="search,beta"
`;

const SAMPLE_B = `# .env — this machine
export NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://app:hunter2@db.internal/app
STRIPE_SECRET_KEY=sk_live_51Hk2mZq8Xr7bN3vT0pLwYc
FEATURE_FLAGS="search,beta"
API_BASE=\${SITE_URL}/api
PORT=8081
SESSION_SECRET=abc#123
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC
-----END PRIVATE KEY-----"
`;

const STATUS_LABEL: Record<DiffStatus, string> = { missing: 'Missing in B', extra: 'Only in B', changed: 'Changed', same: 'Same' };
const STATUS_TONE: Record<DiffStatus, 'amber' | 'blue' | 'violet' | 'green'> = { missing: 'amber', extra: 'blue', changed: 'violet', same: 'green' };

function Issues({ name, parsed }: { name: string; parsed: ParsedEnv }) {
  if (!parsed.issues.length && !parsed.duplicates.length) return null;
  return (
    <div role="status" aria-label={`${name} problems`} className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      {parsed.issues.map((i, n) => (
        <p key={n} className="flex gap-2 break-words">
          <Icon name="warn" className={`mt-0.5 h-4 w-4 shrink-0 ${i.severity === 'error' ? 'text-red-600 dark:text-red-400' : ''}`} />
          <span className="min-w-0">
            <strong>Line {i.line}</strong>
            {i.severity === 'error' ? ' (error)' : ''}: {i.message}
          </span>
        </p>
      ))}
      {parsed.duplicates.map((d) => (
        <p key={d.key} className="flex gap-2 break-words">
          <Icon name="copy" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">
            <strong>{d.key}</strong> is set {d.lines.length} times (lines {d.lines.join(', ')}); the last one wins.
          </span>
        </p>
      ))}
    </div>
  );
}

function Value({ entry, revealed }: { entry?: EnvEntry; revealed: boolean }) {
  if (!entry) return <span className="text-slate-400 dark:text-slate-500">—</span>;
  const shown = revealed ? (entry.value === '' ? '(empty)' : entry.value) : maskValue(entry.value);
  return (
    <span className="block min-w-0">
      <span className={`block whitespace-pre-wrap break-all font-mono text-sm ${revealed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{shown}</span>
      {entry.refs.length > 0 && (
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
          References {entry.refs.map((r) => `\${${r}}`).join(', ')} (not expanded)
        </span>
      )}
    </span>
  );
}

function Row({ row, revealed, onToggle }: { row: DiffRow; revealed: boolean; onToggle: () => void }) {
  return (
    <li className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:px-6">
      <div className="min-w-0 space-y-1">
        <p className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{row.key}</p>
        <div className="flex flex-wrap gap-1">
          <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
          {row.secret && <Badge tone="red">Looks secret</Badge>}
        </div>
        {row.secret && <p className="text-xs text-slate-500 dark:text-slate-400">{row.secret}</p>}
      </div>
      <div className="min-w-0">
        <span className="eyebrow text-slate-500 sm:hidden">A </span>
        <Value entry={row.left} revealed={revealed} />
      </div>
      <div className="min-w-0">
        <span className="eyebrow text-slate-500 sm:hidden">B </span>
        <Value entry={row.right} revealed={revealed} />
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={revealed}
        aria-label={`${revealed ? 'Hide' : 'Reveal'} values of ${row.key}`}
        className="inline-flex items-center justify-self-start gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Icon name={revealed ? 'lock' : 'search'} className="h-4 w-4" /> {revealed ? 'Hide' : 'Reveal'}
      </button>
    </li>
  );
}

export default function EnvDiffPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [exampleFrom, setExampleFrom] = useState<'a' | 'b'>('b');

  const aText = useDeferredValue(a);
  const bText = useDeferredValue(b);
  const pa = useMemo(() => parseEnv(aText), [aText]);
  const pb = useMemo(() => parseEnv(bText), [bText]);
  const rows = useMemo(() => diffEnv(pa, pb), [pa, pb]);
  const counts = diffCounts(rows);
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const example = useMemo(() => toExample(exampleFrom === 'a' ? aText : bText), [exampleFrom, aText, bText]);
  const both = aText.trim() && bText.trim();

  const toggle = (key: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const status = !aText.trim() && !bText.trim()
    ? 'Paste two .env files to compare them. Values stay masked until you reveal them.'
    : !both
      ? `${pluralize((aText.trim() ? pa : pb).values.size, 'variable')} in one file — paste the other to compare.`
      : `${counts.missing} missing · ${counts.extra} extra · ${counts.changed} changed · ${counts.same} same`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={envDiff} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent=".env files">Compare </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setA(SAMPLE_A);
              setB(SAMPLE_B);
              setRevealed(new Set());
            }}
          >
            Try an example
          </Button>
          <Button
            variant="ghost"
            disabled={!a && !b}
            onClick={() => {
              setA('');
              setB('');
              setRevealed(new Set());
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={both && !counts.missing && !counts.changed && !counts.extra ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <CodeArea label="File A" hint="e.g. .env.example" value={a} onChange={(e) => setA(e.target.value)} rows={12} placeholder="KEY=value" onFileText={(t) => setA(t)} />
          <div className="flex flex-wrap items-center gap-3">
            <OpenFileButton accept=".env,.txt,text/plain" onText={(t) => setA(t)} label="Open file A" />
          </div>
          <Issues name="File A" parsed={pa} />
        </div>
        <div className="min-w-0 space-y-4">
          <CodeArea label="File B" hint="e.g. .env" value={b} onChange={(e) => setB(e.target.value)} rows={12} placeholder="KEY=value" onFileText={(t) => setB(t)} />
          <div className="flex flex-wrap items-center gap-3">
            <OpenFileButton accept=".env,.txt,text/plain" onText={(t) => setB(t)} label="Open file B" />
          </div>
          <Issues name="File B" parsed={pb} />
        </div>
      </div>

      {rows.length > 0 && (
        <section aria-label="Differences" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <Segmented<Filter>
              label="Show"
              options={[
                { value: 'all', label: `All ${rows.length}` },
                { value: 'missing', label: `Missing ${counts.missing}` },
                { value: 'extra', label: `Extra ${counts.extra}` },
                { value: 'changed', label: `Changed ${counts.changed}` },
                { value: 'same', label: `Same ${counts.same}` },
              ]}
              value={filter}
              onChange={setFilter}
            />
            <Button variant="ghost" disabled={!revealed.size} onClick={() => setRevealed(new Set())}>
              <Icon name="lock" className="h-4 w-4" /> Hide all
            </Button>
          </header>
          <div className="hidden grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-slate-100 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid dark:border-slate-800">
            <span>Key</span>
            <span>File A</span>
            <span>File B</span>
            <span className="w-20" />
          </div>
          {shown.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((r) => (
                <Row key={r.key} row={r} revealed={revealed.has(r.key)} onToggle={() => toggle(r.key)} />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">Nothing in this group.</p>
          )}
        </section>
      )}

      {(aText.trim() || bText.trim()) && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Generate .env.example from</h2>
            <Segmented<'a' | 'b'>
              label="Generate from"
              options={[
                { value: 'a', label: 'File A' },
                { value: 'b', label: 'File B' },
              ]}
              value={exampleFrom}
              onChange={setExampleFrom}
            />
          </div>
          <OutputPanel title=".env.example (values removed)" icon="file" text={example} fileName=".env.example" mime="text/plain" />
        </div>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Parsed with dotenv’s rules in your browser. Nothing is uploaded, saved or put in share links; ${'{'}VAR{'}'} references are shown, not
        expanded. Secret hints are based on names and random-looking values, so treat them as a nudge, not a guarantee.
      </p>
    </div>
  );
}
