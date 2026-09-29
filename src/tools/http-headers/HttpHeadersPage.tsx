import { useDeferredValue, useMemo, useState } from 'react';
import httpHeaders from './index';
import { headerInfo } from './features/headers';
import { parseHeaders, SAMPLE_HEADERS, type Header } from './features/parse';
import { reviewSecurity, summariseCaching, type Level } from './features/review';
import { describeValue } from './features/values';
import { Notices, OpenFileButton } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';

const LEVEL: Record<Level, { tone: 'green' | 'amber' | 'red' | 'blue'; label: string; icon: 'check' | 'warn' | 'x' | 'info' }> = {
  good: { tone: 'green', label: 'Good', icon: 'check' },
  warn: { tone: 'amber', label: 'Warning', icon: 'warn' },
  bad: { tone: 'red', label: 'Problem', icon: 'x' },
  info: { tone: 'blue', label: 'Info', icon: 'info' },
};
const LEVEL_TEXT: Record<Level, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-600 dark:text-red-400',
  info: 'text-sky-600 dark:text-sky-400',
};
const GRADE_COLOUR: Record<string, string> = {
  'A+': 'bg-emerald-600 text-white',
  A: 'bg-emerald-600 text-white',
  B: 'bg-lime-600 text-white',
  C: 'bg-amber-500 text-white',
  D: 'bg-orange-600 text-white',
  F: 'bg-red-600 text-white',
};

function HeaderRow({ h }: { h: Header }) {
  const info = headerInfo(h.name);
  const rows = describeValue(h.name, h.value);
  return (
    <li className="min-w-0 space-y-2 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold break-all text-slate-900 dark:text-white">{h.name}</span>
        {info && <Badge>{info.category}</Badge>}
        {info?.deprecated && <Badge tone="amber">Deprecated</Badge>}
        {!info && <Badge tone="violet">Custom / uncommon</Badge>}
      </div>
      <p className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm break-all text-slate-800 dark:bg-slate-950 dark:text-slate-300">{h.value || '(empty)'}</p>
      {info && <p className="text-sm text-slate-600 dark:text-slate-400">{info.description}</p>}
      {rows && rows.length > 0 && (
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(0,14rem)_1fr]">
          {rows.map(([k, v], i) => (
            <div key={`${k}-${i}`} className="contents">
              <dt className="font-mono break-all text-slate-700 dark:text-slate-300">{k}</dt>
              <dd className="mb-1 break-words text-slate-600 sm:mb-0 dark:text-slate-400">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export default function HttpHeadersPage() {
  const [text, setText] = useState('');
  const deferred = useDeferredValue(text);
  useIncomingText(httpHeaders.id, (t) => setText(t));
  const parsed = useMemo(() => (deferred.trim() ? parseHeaders(deferred) : null), [deferred]);
  const isResponse = parsed?.kind === 'response';
  const status = parsed?.start?.kind === 'response' ? parsed.start.status : undefined;
  const security = useMemo(() => (parsed && isResponse && parsed.headers.length ? reviewSecurity(parsed.headers) : null), [parsed, isResponse]);
  const caching = useMemo(() => (parsed && isResponse && parsed.headers.length ? summariseCaching(parsed.headers, status) : null), [parsed, isResponse, status]);

  const n = parsed?.headers.length ?? 0;
  const statusText = !parsed
    ? 'Paste response headers from curl -I or your browser DevTools.'
    : !n
      ? 'No headers found yet.'
      : `${n} ${isResponse ? 'response' : 'request'} header${n === 1 ? '' : 's'}${parsed.start?.kind === 'response' ? `, status ${parsed.start.status}` : ''}${security ? `. Security grade ${security.grade}.` : '.'}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={httpHeaders} />
      <Headline accent="headers">Understand your </Headline>
      <StatusStrip status={statusText} tone={n ? 'good' : 'neutral'} />

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <CodeArea
          label="Raw headers"
          hint="Status line optional"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'HTTP/2 200\ncontent-type: text/html\ncache-control: max-age=300'}
          className="break-all"
          onFileText={(t) => setText(t)}
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="pointer-coarse:min-h-11" onClick={() => setText(SAMPLE_HEADERS)}>
            Load sample
          </Button>
          <OpenFileButton accept=".txt,.http,.headers,text/plain" onText={(t) => setText(t)} />
          <Button variant="ghost" className="pointer-coarse:min-h-11" onClick={() => setText('')} disabled={!text}>
            Clear
          </Button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Get them with <code className="font-mono break-all">curl -sI https://example.com</code> (add <code className="font-mono">-L</code> to follow
          redirects), or in DevTools: Network → select the request → Headers → Response Headers → Raw / copy.
        </p>
      </section>

      {parsed && <Notices items={parsed.notices} />}

      {security && (
        <Panel eyebrow="Security review" icon="shield">
          <div className="mb-5 flex items-center gap-4">
            <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${GRADE_COLOUR[security.grade]}`} aria-label={`Grade ${security.grade}`}>
              {security.grade}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Score {security.score}/100 from the headers alone. Some checks (like HSTS) only matter over HTTPS, and a CSP delivered in a
              &lt;meta&gt; tag isn't visible here.
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {security.checks.map((c) => (
              <li key={c.id} className="flex gap-3 py-3">
                <Icon name={LEVEL[c.level].icon} className={`mt-0.5 h-5 w-5 shrink-0 ${LEVEL_TEXT[c.level]}`} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    {c.title} <Badge tone={LEVEL[c.level].tone}>{LEVEL[c.level].label}</Badge>
                  </p>
                  <p className="mt-1 text-sm break-words text-slate-600 dark:text-slate-400">{c.message}</p>
                  {c.details && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm break-words text-slate-600 dark:text-slate-400">
                      {c.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {caching && (
        <Panel eyebrow="Caching" icon="clock">
          <p className="mb-3 font-semibold text-slate-900 dark:text-white">{caching.verdict}</p>
          <DetailRows rows={caching.rows} />
          {caching.notes.length > 0 && (
            <div className="mt-4">
              <Notices items={caching.notes} />
            </div>
          )}
        </Panel>
      )}

      {parsed && n > 0 && (
        <Panel eyebrow={`Headers (${n})`} icon="server">
          {parsed.start && (
            <p className="mb-2 font-mono text-sm break-all text-slate-700 dark:text-slate-300">
              {parsed.start.kind === 'response'
                ? `${parsed.start.version} ${parsed.start.status} ${parsed.start.reason}`
                : `${parsed.start.method} ${parsed.start.target} ${parsed.start.version}`}
            </p>
          )}
          {!isResponse && <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">These look like request headers, so the security and caching review is skipped.</p>}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {parsed.headers.map((h, i) => (
              <HeaderRow key={`${h.line}-${i}`} h={h} />
            ))}
          </ul>
        </Panel>
      )}

      {parsed && parsed.invalid.length > 0 && (
        <Panel eyebrow="Skipped lines" icon="warn">
          <ul className="space-y-1 font-mono text-sm break-all text-slate-600 dark:text-slate-400">
            {parsed.invalid.slice(0, 50).map((l) => (
              <li key={l.line}>
                <span className="text-slate-400">{l.line}:</span> {l.text}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">Headers are analysed in your browser and never uploaded. Cookies and tokens may be sensitive.</p>
    </div>
  );
}
