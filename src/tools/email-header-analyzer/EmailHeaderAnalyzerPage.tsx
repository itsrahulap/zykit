import { useDeferredValue, useMemo, useState } from 'react';
import emailHeaderAnalyzer from './index';
import { analyzeHeaders, formatDelay, type Analysis, type MechanismSummary, type RedFlag } from './features/email-header-analyzer';
import { SAMPLES } from './features/samples';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';

type Tone = 'green' | 'red' | 'amber' | 'neutral';

const toneOf = (result: string): Tone =>
  result === 'pass' ? 'green' : ['fail', 'softfail', 'permerror', 'hardfail'].includes(result) ? 'red' : result === 'missing' || result === 'none' ? 'neutral' : 'amber';

const timeFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' });
const fmtTime = (t?: number) => (t === undefined ? 'No date' : `${timeFmt.format(t)} UTC`);

function Verdict({ label, m }: { label: string; m: MechanismSummary }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{label}</span>
        <Badge tone={toneOf(m.result)}>{m.result === 'missing' ? 'not found' : m.result}</Badge>
      </div>
      <p className="mt-1 text-sm break-all text-slate-600 dark:text-slate-400">{m.domain ?? (m.result === 'missing' ? 'No result in the headers' : 'No domain given')}</p>
    </div>
  );
}

const flagStyle: Record<RedFlag['level'], { tone: Tone; label: string }> = {
  high: { tone: 'red', label: 'High' },
  medium: { tone: 'amber', label: 'Medium' },
  low: { tone: 'neutral', label: 'Low' },
};

function Results({ a }: { a: Analysis }) {
  const fromDomain = a.from?.domain;
  return (
    <div className="space-y-6">
      <Panel eyebrow="Authentication" icon="shield">
        <div className="grid gap-3 sm:grid-cols-3">
          <Verdict label="SPF" m={a.spf} />
          <Verdict label="DKIM" m={a.dkim} />
          <Verdict label="DMARC" m={a.dmarc} />
        </div>
        <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Alignment with the From domain{fromDomain ? ` (${fromDomain})` : ''}</h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex flex-wrap items-center gap-2">
            <Badge tone={a.alignment.spfAligned ? 'green' : 'red'}>{a.alignment.spfAligned ? 'aligned' : 'not aligned'}</Badge>
            <span className="min-w-0 break-all">SPF / envelope sender: {a.alignment.spfDomain ?? 'unknown'}</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <Badge tone={a.alignment.dkimAligned ? 'green' : 'red'}>{a.alignment.dkimAligned ? 'aligned' : 'not aligned'}</Badge>
            <span className="min-w-0 break-all">DKIM d=: {a.alignment.dkimDomains.join(', ') || 'none'}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Verdicts come from the topmost Authentication-Results (added by your own provider). Alignment is relaxed (same organizational domain) and needs a pass.
        </p>
      </Panel>

      <Panel eyebrow={`Red flags (${a.flags.length})`} icon="warn">
        {a.flags.length ? (
          <ul className="space-y-2">
            {a.flags.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-200">
                <Badge tone={flagStyle[f.level].tone}>{flagStyle[f.level].label}</Badge>
                <span className="min-w-0 break-words">{f.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">No red flags found. That doesn’t prove the email is safe: check links and attachments too.</p>
        )}
      </Panel>

      <Panel eyebrow="Key headers" icon="info">
        <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {a.keyHeaders.map((k) => (
            <div key={k.name} className="grid gap-1 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="font-medium text-slate-600 dark:text-slate-400">{k.name}</dt>
              <dd className="min-w-0 break-all text-slate-900 dark:text-slate-100">
                {k.value}
                {k.note && (
                  <span className={`mt-1 flex items-start gap-1.5 break-words text-xs ${k.warn ? 'text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {k.warn && <Icon name="warn" className="h-3.5 w-3.5 shrink-0" />}
                    {k.note}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel eyebrow={`Hops (${a.hops.length})${a.totalDelay !== undefined ? ` · total ${formatDelay(a.totalDelay)}` : ''}`} icon="network">
        {a.hops.length ? (
          <ol className="space-y-3" aria-label="Delivery path, first hop first">
            {a.hops.map((h) => (
              <li key={h.number} className={`rounded-2xl border p-4 text-sm ${h.skew ? 'border-red-300 dark:border-red-900' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Hop {h.number}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {h.delay !== undefined && <Badge tone={h.skew ? 'red' : h.delay > 300 ? 'amber' : 'neutral'}>{h.skew ? `clock skew ${formatDelay(h.delay)}` : `+${formatDelay(h.delay)}`}</Badge>}
                    <span className="text-slate-500 dark:text-slate-400">{fmtTime(h.date)}</span>
                  </span>
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-slate-700 sm:grid-cols-[5rem_1fr] dark:text-slate-300">
                  {(['from', 'by', 'with', 'via', 'id', 'for'] as const).map((k) =>
                    h[k] ? (
                      <div key={k} className="contents">
                        <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                        <dd className="min-w-0 font-mono text-xs break-all">{h[k]}</dd>
                      </div>
                    ) : null,
                  )}
                  {h.ip && (
                    <div className="contents">
                      <dt className="text-slate-500 dark:text-slate-400">IP</dt>
                      <dd className="min-w-0 font-mono text-xs break-all">{h.ip}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">No Received headers found.</p>
        )}
      </Panel>

      {a.auth.length > 0 && (
        <Panel eyebrow="All authentication results" icon="layers">
          <ul className="space-y-2 text-sm">
            {a.auth.map((r, i) => (
              <li key={i} className="flex flex-wrap items-start gap-2 text-slate-700 dark:text-slate-300">
                <Badge tone={toneOf(r.result)}>
                  {r.method}={r.result}
                </Badge>
                <span className="min-w-0 break-all">
                  {r.domain && <strong className="font-medium text-slate-900 dark:text-slate-100">{r.domain} </strong>}
                  <span className="text-slate-500 dark:text-slate-400">
                    {r.source}
                    {r.authserv ? ` by ${r.authserv}` : ''}
                    {r.comment ? ` · ${r.comment}` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {a.arc.length > 0 && <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">ARC chain: {a.arc.map((s) => `i=${s.instance} cv=${s.cv ?? '?'} (${s.sealDomain ?? '?'})`).join(' → ')}</p>}
        </Panel>
      )}

      <details className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer font-semibold text-slate-900 pointer-coarse:min-h-11 dark:text-slate-100">All headers ({a.headers.length}, decoded)</summary>
        <dl className="mt-4 space-y-2 text-sm">
          {a.headers.map((h) => (
            <div key={h.index} className="min-w-0">
              <dt className="inline font-mono font-semibold text-slate-700 dark:text-slate-300">{h.name}: </dt>
              <dd className="inline font-mono break-all text-slate-600 dark:text-slate-400">{h.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

export default function EmailHeaderAnalyzerPage() {
  const [input, setInput] = useState('');
  useIncomingText(emailHeaderAnalyzer.id, (t) => setInput(t));
  const deferred = useDeferredValue(input);
  const analysis = useMemo(() => (deferred.trim() ? analyzeHeaders(deferred) : null), [deferred]);
  const high = analysis?.flags.filter((f) => f.level === 'high').length ?? 0;

  const status = !analysis
    ? 'Paste raw email headers to start.'
    : !analysis.headers.length
      ? 'No headers found. Paste the “Show original” / “View source” text.'
      : `${analysis.headers.length} headers, ${analysis.hops.length} hops, ${analysis.flags.length} red flag${analysis.flags.length === 1 ? '' : 's'}${high ? ` (${high} high)` : ''}.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={emailHeaderAnalyzer} />
      <Headline accent="headers">Analyze email </Headline>
      <StatusStrip status={status} tone={analysis?.headers.length ? 'good' : 'neutral'} />

      <section className="space-y-3" aria-label="Input">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Sample"
            placeholder="Load a sample…"
            options={SAMPLES.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(v) => setInput(SAMPLES.find((s) => s.value === v)!.text)}
          />
          <Button variant="ghost" className="!px-3 !py-2 !text-sm" onClick={() => setInput('')} disabled={!input}>
            Clear
          </Button>
        </div>
        <CodeArea
          label="Raw headers"
          hint="Gmail: ⋮ → Show original. Outlook: View → View message source."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFileText={(t) => setInput(t)}
          rows={12}
          placeholder={'Received: from …\nAuthentication-Results: …\nFrom: …'}
        />
      </section>

      {analysis && analysis.headers.length > 0 && <Results a={analysis} />}
    </div>
  );
}
