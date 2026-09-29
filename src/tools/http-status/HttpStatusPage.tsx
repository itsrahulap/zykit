import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import httpStatus from './index';
import { CLASS_INFO, classOf, searchStatuses, STATUSES, type HttpStatus, type StatusClass } from './features/statuses';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Badge, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Filter = 'all' | StatusClass;
const CLASSES: StatusClass[] = ['1xx', '2xx', '3xx', '4xx', '5xx'];

const RETRY_TEXT: Record<HttpStatus['retry'], string> = {
  yes: 'Retry: yes',
  no: 'Retry: no',
  maybe: 'Retry: depends',
  'n/a': '',
};

function hashCode(): number | null {
  const m = /^#(\d{3})$/.exec(window.location.hash);
  return m && STATUSES.some((s) => s.code === Number(m[1])) ? Number(m[1]) : null;
}

function StatusCard({ s, highlighted }: { s: HttpStatus; highlighted: boolean }) {
  return (
    <article
      id={String(s.code)}
      aria-labelledby={`status-${s.code}`}
      data-highlighted={highlighted || undefined}
      className={`scroll-mt-24 rounded-3xl border bg-white p-5 transition-shadow motion-reduce:transition-none sm:p-6 dark:bg-slate-900 ${
        highlighted ? 'border-emerald-500 ring-4 ring-emerald-500/20 dark:border-emerald-400' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={`#${s.code}`}
          className="font-mono text-2xl font-bold text-emerald-700 hover:underline dark:text-emerald-400"
          aria-label={`Link to ${s.code}`}
        >
          {s.code}
        </a>
        <h3 id={`status-${s.code}`} className="min-w-0 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
          {s.name}
        </h3>
        {s.deprecated && <Badge tone="amber">Deprecated</Badge>}
      </header>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{s.meaning}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">When: </span>
        {s.usage}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {s.cacheable && <Badge tone="blue">Cacheable by default</Badge>}
        {s.retry !== 'n/a' && <Badge tone={s.retry === 'yes' ? 'green' : s.retry === 'maybe' ? 'amber' : 'neutral'}>{RETRY_TEXT[s.retry]}</Badge>}
        {s.headers.map((h) => (
          <code key={h} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {h}
          </code>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{s.rfc}</p>
    </article>
  );
}

export default function HttpStatusPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [highlight, setHighlight] = useState<number | null>(() => hashCode());
  const q = useDeferredValue(query);
  /** Code still waiting to be scrolled to (its card may not be rendered yet). */
  const pendingScroll = useRef<number | null>(highlight);

  const results = useMemo(() => {
    const found = searchStatuses(q);
    return filter === 'all' ? found : found.filter((s) => classOf(s.code) === filter);
  }, [q, filter]);

  // /tools/http-status#404 scrolls to and highlights 404, also when the hash changes later.
  useEffect(() => {
    const onHash = () => {
      const code = hashCode();
      setHighlight(code);
      pendingScroll.current = code;
      if (code !== null) {
        setQuery('');
        setFilter('all');
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const code = pendingScroll.current;
    const el = code === null ? null : document.getElementById(String(code));
    if (!el) return;
    pendingScroll.current = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [highlight, results]);

  const grouped = CLASSES.map((c) => ({ c, items: results.filter((s) => classOf(s.code) === c) })).filter((g) => g.items.length > 0);

  const status = q.trim() || filter !== 'all' ? `${pluralize(results.length, 'status code')} found` : `${STATUSES.length} standard status codes`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={httpStatus} />
      <Headline accent="means">What every HTTP status </Headline>
      <StatusStrip status={status} tone={results.length ? 'neutral' : 'busy'} />

      <section aria-label="Search options" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="block">
          <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Search</span>
          <span className="relative block">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(null);
              }}
              placeholder="404, teapot, rate limit, Retry-After…"
              className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 pointer-coarse:min-h-11 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </span>
        </label>
        <Segmented<Filter>
          label="Class"
          options={[{ value: 'all', label: 'All' }, ...CLASSES.map((c) => ({ value: c, label: c }))]}
          value={filter}
          onChange={setFilter}
        />
      </section>

      {grouped.length === 0 && <p className="text-slate-600 dark:text-slate-400">No status code matches &ldquo;{q}&rdquo;.</p>}

      {grouped.map(({ c, items }) => (
        <section key={c} aria-labelledby={`class-${c}`} className="space-y-4">
          <div>
            <h2 id={`class-${c}`} className="text-2xl font-bold text-slate-900 dark:text-white">
              {c} <span className="font-serif font-normal italic text-emerald-600 dark:text-emerald-400">{CLASS_INFO[c].label}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{CLASS_INFO[c].summary}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((s) => (
              <StatusCard key={s.code} s={s} highlighted={highlight === s.code} />
            ))}
          </div>
        </section>
      ))}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Based on the IANA HTTP Status Code Registry and RFC 9110. &ldquo;Cacheable by default&rdquo; means caches may store the response without explicit
        freshness headers. Link to any code with <code>#404</code> in the address.
      </p>
    </div>
  );
}
