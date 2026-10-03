import { useEffect, useId, useMemo, useState } from 'react';
import cspBuilder from './index';
import {
  addSource,
  BUILDER_DIRECTIVES,
  classifySource,
  cspHash,
  DIRECTIVE_BY_NAME,
  evaluate,
  extractInlineBody,
  FORMAT_HINTS,
  formatOutput,
  generateNonce,
  metaTag,
  normaliseSource,
  parsePolicy,
  PRESETS,
  presetPolicy,
  removeDirective,
  removeSource,
  serialisePolicy,
  setDirective,
  sourceProblem,
  type HashAlgo,
  type OutputFormat,
  type Policy,
  type Severity,
} from './features/csp-builder';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button } from '../../shared/ui/ui';

const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';
const quick =
  'rounded-lg px-2 py-1 font-mono text-xs text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100 pointer-coarse:min-h-11 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800';

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'meta', label: 'Meta tag' },
  { value: 'nginx', label: 'nginx' },
  { value: 'apache', label: 'Apache' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'netlify', label: 'Netlify' },
];

const SEVERITY: Record<Severity, { label: string; box: string }> = {
  high: { label: 'High', box: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200' },
  medium: { label: 'Medium', box: 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200' },
  syntax: { label: 'Syntax', box: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-200' },
  low: { label: 'Low', box: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200' },
  info: { label: 'Info', box: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200' },
  ok: { label: 'Good', box: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200' },
};

const GRADE_TONE = { A: 'green', B: 'green', C: 'amber', D: 'amber', F: 'red' } as const;

function quickSources(name: string): string[] {
  const kind = DIRECTIVE_BY_NAME.get(name)?.kind;
  if (name === 'require-trusted-types-for') return ["'script'"];
  if (name === 'trusted-types') return ["'none'", "'allow-duplicates'"];
  if (kind === 'reporting' || kind === 'flag') return [];
  if (['base-uri', 'form-action', 'frame-ancestors'].includes(name)) return ["'self'", "'none'", 'https:'];
  const base = ["'self'", "'none'", 'https:', 'data:', 'blob:'];
  if (name === 'script-src') return [...base, "'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'", "'wasm-unsafe-eval'"];
  if (name === 'style-src' || name === 'default-src') return [...base, "'unsafe-inline'"];
  return base;
}

function chipClass(source: string): string {
  const k = classifySource(source);
  if (/unsafe-/.test(source) || source === '*') return 'bg-amber-50 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800';
  if (k === 'keyword' || k === 'nonce' || k === 'hash') return 'bg-emerald-50 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800';
  if (k === 'invalid') return 'bg-red-50 text-red-900 ring-red-300 dark:bg-red-950 dark:text-red-200 dark:ring-red-800';
  return 'bg-slate-100 text-slate-800 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700';
}

function DirectiveCard({ name, sources, onAdd, onRemoveSource, onRemove }: { name: string; sources: string[]; onAdd: (s: string) => string | null; onRemoveSource: (s: string) => void; onRemove: () => void }) {
  const info = DIRECTIVE_BY_NAME.get(name);
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const id = useId();
  const submit = (raw: string) => {
    if (!raw.trim()) return;
    const err = onAdd(raw);
    setProblem(err);
    if (!err) setText('');
  };
  const isFlag = info?.kind === 'flag';
  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800" role="group" aria-label={`${name} directive`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-sm font-semibold break-all text-slate-900 dark:text-slate-100">{name}</h3>
          {info && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{info.description}</p>}
        </div>
        <Button variant="ghost" className="!px-3 !py-1.5 !text-sm" onClick={onRemove} aria-label={`Remove ${name}`}>
          Remove
        </Button>
      </div>
      {!isFlag && (
        <>
          <ul className="flex flex-wrap gap-2" aria-label={`Sources for ${name}`}>
            {sources.length === 0 && <li className="text-sm text-slate-500 dark:text-slate-400">No sources yet.</li>}
            {sources.map((s) => (
              <li key={s} className={`inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pr-1 pl-3 font-mono text-xs ring-1 ring-inset ${chipClass(s)}`}>
                <span className="min-w-0 break-all">{s}</span>
                <button type="button" onClick={() => onRemoveSource(s)} aria-label={`Remove ${s} from ${name}`} className="rounded-full px-2 py-1 pointer-coarse:min-h-11 pointer-coarse:min-w-11 hover:bg-black/10 dark:hover:bg-white/10">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5" aria-label={`Quick sources for ${name}`}>
            {quickSources(name).map((s) => (
              <button key={s} type="button" className={quick} onClick={() => submit(s)} aria-label={`Add ${s} to ${name}`}>
                {s}
              </button>
            ))}
            {['script-src', 'style-src', 'default-src', 'script-src-elem', 'style-src-elem'].includes(name) && (
              <button type="button" className={quick} onClick={() => submit(`nonce-${generateNonce()}`)} aria-label={`Add a random nonce to ${name}`}>
                + nonce
              </button>
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(text);
            }}
          >
            <label htmlFor={id} className="sr-only">
              Add a source to {name}
            </label>
            <input id={id} value={text} onChange={(e) => setText(e.target.value)} placeholder="cdn.example.com, https://api.example.com" spellCheck={false} autoComplete="off" aria-invalid={!!problem} className={field} />
            <Button type="submit" variant="secondary" className="!px-3 !py-2 !text-sm" aria-label={`Add source to ${name}`}>
              Add
            </Button>
          </form>
          {problem && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {problem}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function HashGenerator({ onUse }: { onUse: (directive: string, source: string) => void }) {
  const [body, setBody] = useState('');
  const [algo, setAlgo] = useState<HashAlgo>('sha256');
  const [done, setDone] = useState({ key: '', hash: '' });
  const text = extractInlineBody(body);
  const key = `${algo}:${text}`;
  useEffect(() => {
    if (!text) return;
    let live = true;
    void cspHash(text, algo).then((h) => live && setDone({ key, hash: h }));
    return () => {
      live = false;
    };
  }, [text, algo, key]);
  const hash = text && done.key === key ? done.hash : '';
  return (
    <section className={card} aria-label="Hash generator">
      <h2 className="eyebrow text-slate-600 dark:text-slate-400">Hash an inline script or style</h2>
      <CodeArea label="Inline script or style" hint="Exact text between the tags" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="console.log('hello');" />
      <Select
        label="Algorithm"
        value={algo}
        onChange={setAlgo}
        options={[
          { value: 'sha256', label: 'SHA-256' },
          { value: 'sha384', label: 'SHA-384' },
          { value: 'sha512', label: 'SHA-512' },
        ]}
      />
      {hash && (
        <div className="space-y-2">
          <CodeBlock label="CSP hash source">{hash}</CodeBlock>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={hash} />
            <Button variant="secondary" className="!px-3 !py-2 !text-sm" onClick={() => onUse('script-src', hash)}>
              Add to script-src
            </Button>
            <Button variant="secondary" className="!px-3 !py-2 !text-sm" onClick={() => onUse('style-src', hash)}>
              Add to style-src
            </Button>
          </div>
        </div>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-400">The hash must match the bytes exactly, including whitespace and line breaks. If you paste a whole &lt;script&gt; tag, only its contents are hashed.</p>
    </section>
  );
}

export default function CspBuilderPage() {
  const [policy, setPolicy] = useState<Policy>([]);
  const [format, setFormat] = useState<OutputFormat>('header');
  const [reportOnly, setReportOnly] = useState(false);
  const [paste, setPaste] = useState('');
  const [notes, setNotes] = useState<string[]>([]);

  const load = (text: string) => {
    const r = parsePolicy(text);
    setPolicy(r.policy);
    setNotes(r.notes);
  };
  useIncomingText(cspBuilder.id, (t) => {
    setPaste(t);
    load(t);
  });
  useShareState(
    { policy: serialisePolicy(policy), format, reportOnly },
    (s) => {
      if (s.policy !== undefined) setPolicy(parsePolicy(s.policy).policy);
      if (s.format) setFormat(s.format);
      if (s.reportOnly !== undefined) setReportOnly(s.reportOnly);
    },
    { format: FORMATS.map((f) => f.value) },
  );

  const evaluation = useMemo(() => evaluate(policy), [policy]);
  const output = useMemo(() => formatOutput(policy, format, reportOnly), [policy, format, reportOnly]);
  const meta = useMemo(() => metaTag(policy), [policy]);
  const available = BUILDER_DIRECTIVES.filter((d) => !policy.some((p) => p.name === d.name));
  const counts = (s: Severity) => evaluation.findings.filter((f) => f.severity === s).length;

  const addTo = (name: string, raw: string): string | null => {
    const s = normaliseSource(raw);
    const problem = sourceProblem(name, s);
    if (problem) return problem;
    setPolicy((p) => addSource(p, name, s));
    return null;
  };

  const status =
    policy.length === 0
      ? 'Pick a preset, paste a policy, or add a directive to start.'
      : `Grade ${evaluation.grade} (${evaluation.score}/100): ${counts('high')} high, ${counts('medium')} medium, ${counts('low') + counts('syntax')} lower-severity findings.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={cspBuilder} />
      <Headline accent="Content-Security-Policy">Build a </Headline>
      <StatusStrip status={status} tone={policy.length && ['A', 'B'].includes(evaluation.grade) ? 'good' : 'neutral'} />
      <Notices items={["A strong CSP limits the damage of cross-site scripting but doesn't replace escaping output. Test with Content-Security-Policy-Report-Only first: a policy that is too strict can break your site."]} />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <Button key={p.id} variant="secondary" title={p.description} onClick={() => { setPolicy(presetPolicy(p.id, generateNonce())); setNotes([]); }}>
            {p.label}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => { setPolicy([]); setNotes([]); }} disabled={policy.length === 0}>
          Clear
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section className={card} aria-label="Directives">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Directives</h2>
            {policy.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No directives yet. Start from a preset above or add one below.</p>}
            <div className="space-y-4">
              {policy.map((d) => (
                <DirectiveCard
                  key={d.name}
                  name={d.name}
                  sources={d.sources}
                  onAdd={(s) => addTo(d.name, s)}
                  onRemoveSource={(s) => setPolicy((p) => removeSource(p, d.name, s))}
                  onRemove={() => setPolicy((p) => removeDirective(p, d.name))}
                />
              ))}
            </div>
            {available.length > 0 && (
              <Select
                label="Add a directive"
                placeholder="Choose a directive…"
                options={available.map((d) => ({ value: d.name, label: d.name }))}
                onChange={(name) => setPolicy((p) => setDirective(p, name, name === 'object-src' || name === 'base-uri' ? ["'none'"] : name === 'require-trusted-types-for' ? ["'script'"] : []))}
              />
            )}
          </section>

          <section className={card} aria-label="Import">
            <CodeArea label="Paste an existing policy" hint="Header, meta tag, nginx or Apache line" value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder="default-src 'self'; script-src 'self' https://cdn.example.com" />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => load(paste)} disabled={!paste.trim()}>
                Load into builder
              </Button>
            </div>
            {notes.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                {notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className={card} aria-label="Evaluation" aria-live="polite">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">Evaluation</h2>
              {policy.length > 0 && <Badge tone={GRADE_TONE[evaluation.grade]}>Grade {evaluation.grade}</Badge>}
            </div>
            {policy.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Findings appear here as you build the policy.</p>
            ) : (
              <ul className="space-y-2">
                {evaluation.findings.map((f, i) => (
                  <li key={i} className={`min-w-0 space-y-1 rounded-xl border p-3 text-sm break-words ${SEVERITY[f.severity].box}`}>
                    <p>
                      <strong className="font-semibold">{SEVERITY[f.severity].label}</strong> · <code className="font-mono">{f.directive}</code>
                    </p>
                    <p>{f.message}</p>
                    {f.fix && <p className="opacity-80">Fix: {f.fix}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card} aria-label="Output">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">Output</h2>
              <div className="flex flex-wrap items-center gap-1">
                <CopyButton text={output} disabled={policy.length === 0} />
                <SendToMenu text={output} kind="text" />
              </div>
            </div>
            <Segmented label="Format" value={format} onChange={setFormat} options={FORMATS} />
            {format !== 'meta' && <Checkbox label="Report-Only (log violations without blocking)" checked={reportOnly} onChange={setReportOnly} />}
            <CodeBlock label="Generated policy">{policy.length ? output : '(empty policy)'}</CodeBlock>
            <p className="text-sm text-slate-600 dark:text-slate-400">{FORMAT_HINTS[format]}</p>
            {format === 'meta' && meta.dropped.length > 0 && (
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Left out because browsers ignore them in a meta tag: <code className="font-mono">{meta.dropped.join(', ')}</code>. Send these as an HTTP header.
              </p>
            )}
            {format === 'meta' && <p className="text-sm text-slate-600 dark:text-slate-400">Meta tags also can't be Report-Only, and only apply to content after the tag.</p>}
          </section>
        </div>
      </div>

      <HashGenerator onUse={(directive, source) => setPolicy((p) => addSource(p, directive, source))} />

      <Panel eyebrow="Tips">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>
            Prefer a nonce with <code className="font-mono">'strict-dynamic'</code> over host allowlists: allowlisted CDNs often host JSONP or AngularJS that attackers can reuse.
          </li>
          <li>
            Always set <code className="font-mono">object-src 'none'</code> and <code className="font-mono">base-uri 'none'</code> (or <code className="font-mono">'self'</code>).
          </li>
          <li>Nonces must be unpredictable and different on every response. The nonce generated here is only an example.</li>
          <li>Nothing you enter leaves this tab; the evaluator is a local approximation of tools like Google's CSP Evaluator.</li>
        </ul>
      </Panel>
    </div>
  );
}
