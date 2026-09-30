import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SITE } from '../config/site';
import { Headline, IconTile } from '../shared/ui/page';
import { Icon } from '../shared/ui/ui';
import { TOOLS, toolPath } from '../tools/registry';
import { learnStats } from '../learn/data/stats.generated';
import type { ToolDefinition } from '../tools/types';
import { categoryCounts, filterTools } from '../shared/utils/toolSearch';
import { useFavorites, useRecentTools } from '../shared/lib/toolPrefs';
import { FavoriteButton } from '../shared/ui/FavoriteButton';

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const soon = tool.status === 'coming-soon';
  const body = (
    <>
      <div className={`flex items-start justify-between gap-3 ${soon ? '' : 'pr-12 pointer-coarse:pr-14'}`}>
        <IconTile icon={tool.icon} size="lg" />
        {tool.status !== 'available' && (
          <span className="eyebrow rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {soon ? 'Coming soon' : 'Beta'}
          </span>
        )}
      </div>
      <h3 id={`card-${tool.id}`} className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {tool.name}
      </h3>
      <p className="mt-1 font-medium text-slate-700 dark:text-slate-300">{tool.tagline}</p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{tool.description}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
        {tool.tags.map((t) => (
          <li key={t} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t}
          </li>
        ))}
      </ul>
      {!soon && (
        <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
          Open tool <Icon name="arrow" className="h-4 w-4" />
        </span>
      )}
    </>
  );
  const cls = 'flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900';
  return soon ? (
    <div className={`${cls} opacity-70`}>{body}</div>
  ) : (
    <div className="relative h-full">
      <Link
        to={toolPath(tool)}
        className={`${cls} transition-shadow hover:border-primary-edge hover:shadow-lg hover:shadow-slate-900/5 motion-reduce:transition-none`}
      >
        {body}
      </Link>
      <FavoriteButton tool={tool} describedBy={`card-${tool.id}`} className="absolute top-6 right-6 sm:top-7 sm:right-7" />
    </div>
  );
}

/** "Favorites" and "Recently used" rows; hidden while searching or filtering. */
function PersonalRows() {
  const { favorites } = useFavorites();
  const recent = useRecentTools();
  const pick = (ids: string[]) =>
    ids.map((id) => TOOLS.find((t) => t.id === id)).filter((t): t is ToolDefinition => t !== undefined && t.status !== 'coming-soon');
  const rows = [
    { id: 'favorites', title: 'Favorites', tools: pick(favorites) },
    { id: 'recent', title: 'Recently used', tools: pick(recent) },
  ].filter((r) => r.tools.length > 0);
  if (rows.length === 0) return null;
  return (
    <>
      {rows.map((r) => (
        <section key={r.id} aria-labelledby={`row-${r.id}`}>
          <h2 id={`row-${r.id}`} className="eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">
            {r.title}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {r.tools.map((t) => (
              <li key={t.id} className="max-w-full">
                <Link
                  to={toolPath(t)}
                  className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pr-3.5 pl-1.5 text-sm font-semibold text-slate-800 hover:border-primary-edge pointer-coarse:min-h-11 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge">
                    <Icon name={t.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 truncate">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/** True when a keypress should go to the focused element instead of our shortcut. */
function isTyping(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
}

const chip = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ring-1 ring-inset transition-colors pointer-coarse:min-h-11 motion-reduce:transition-none ${
    active
      ? 'bg-primary text-primary-ink ring-primary-edge'
      : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800'
  }`;

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const categories = useMemo(() => [...new Set(TOOLS.map((t) => t.category))], []);
  const urlCategory = params.get('category') ?? '';
  const category = categories.includes(urlCategory) ? urlCategory : '';
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep ?q= in sync with the box without adding history entries. `written` is the last
  // value we put in the URL, so an outside change (e.g. clicking the logo) can reset the box.
  const urlQuery = params.get('q') ?? '';
  const written = useRef(urlQuery);
  useEffect(() => {
    if (urlQuery === written.current) return;
    written.current = urlQuery;
    setQuery(urlQuery);
  }, [urlQuery]);
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === written.current) return;
    written.current = trimmed;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set('q', trimmed);
        else next.delete('q');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [query, setParams]);

  // "/" jumps to the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setCategory = (value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('category', value);
        else next.delete('category');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const shown = useMemo(() => filterTools(TOOLS, { query, category }), [query, category]);
  const counts = useMemo(() => categoryCounts(TOOLS, query), [query]);
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const filtering = Boolean(query.trim() || category);
  const visibleCategories = categories.filter((cat) => shown.some((t) => t.category === cat));

  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <p className="eyebrow text-emerald-700 dark:text-emerald-400">{SITE.tagline}</p>
        <Headline accent="device">Useful tools that stay on your </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Every tool here runs entirely in your browser. Your files and text are never uploaded, stored or seen by anyone else.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm text-slate-700 dark:text-slate-300">
          {['No uploads', 'No accounts', 'No tracking', 'Works offline once loaded'].map((p) => (
            <li key={p} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-primary-ink">
              <Icon name="check" className="h-4 w-4" /> {p}
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-10">
        <section aria-label="Find a tool" className="space-y-4">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="relative max-w-2xl">
            <label htmlFor="tool-search" className="sr-only">
              Search tools
            </label>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              id="tool-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query) {
                  e.preventDefault();
                  setQuery('');
                }
              }}
              placeholder="Search tools, e.g. JSON, UUID, base64"
              autoComplete="off"
              spellCheck={false}
              aria-keyshortcuts="/"
              className="block w-full rounded-2xl border border-field-edge bg-white py-3.5 pr-14 pl-12 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            ) : (
              <kbd
                aria-hidden="true"
                className="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-slate-200 px-2 py-0.5 font-mono text-xs text-slate-500 sm:block dark:border-slate-700 dark:text-slate-400"
              >
                /
              </kbd>
            )}
          </form>

          <div role="group" aria-label="Categories" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={chip(!category)}>
              All <span className="tabular-nums opacity-70">{total}</span>
            </button>
            {counts.map((c) => (
              <button
                key={c.category}
                type="button"
                aria-pressed={category === c.category}
                onClick={() => setCategory(category === c.category ? '' : c.category)}
                className={chip(category === c.category)}
              >
                {c.category} <span className="tabular-nums opacity-70">{c.count}</span>
              </button>
            ))}
          </div>

          <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
            {filtering ? `${shown.length} ${shown.length === 1 ? 'tool' : 'tools'} found` : ''}
          </p>
        </section>

        {shown.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <Icon name="search" className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">No tools match {query.trim() ? `“${query.trim()}”` : 'this filter'}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different word, or look through every category.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('');
              }}
              className="mt-5 rounded-xl px-4 py-2 font-semibold text-emerald-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              Show all tools
            </button>
          </div>
        )}

        {!filtering && <PersonalRows />}

        {visibleCategories.map((cat, i) => (
          <section key={cat} aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`} className="eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">
              {cat}
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown
                .filter((t) => t.category === cat)
                .map((t) => (
                  <li key={t.id}>
                    <ToolCard tool={t} />
                  </li>
                ))}
              {!filtering && i === visibleCategories.length - 1 && (
                <li>
                  <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">
                    <Icon name="grid" className="h-6 w-6" />
                    <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">More tools on the way</p>
                    <p className="mt-1 text-sm">New tools are added here as they&rsquo;re built.</p>
                  </div>
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>

      <LearnBanner />
    </div>
  );
}

// Counts come from a tiny generated file so the home page never loads Learn content.
function LearnBanner() {
  const stats = [
    { value: learnStats.subjects, label: 'subjects' },
    { value: learnStats.topics, label: 'lessons' },
    { value: learnStats.problems, label: 'practice problems' },
    { value: learnStats.caseStudies, label: 'case studies' },
  ];
  return (
    <section aria-labelledby="learn-banner">
      <p className="eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">Learn</p>
      <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <IconTile icon="book" />
            <h2 id="learn-banner" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Learn once. Understand{' '}
              <em className="font-serif font-normal italic text-emerald-600 dark:text-emerald-400">deeply</em>.
            </h2>
          </div>
          <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Free, plain-language software engineering lessons, from JavaScript basics to system design, with examples you can run and progress
            saved in your browser.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{s.value}</dd>
                <dd aria-hidden="true" className="text-sm text-slate-500 dark:text-slate-400">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <Link
          to="/learn"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-3 font-semibold text-primary-ink ring-1 ring-inset ring-primary-edge hover:bg-primary-hover pointer-coarse:min-h-11 lg:self-center"
        >
          Start learning <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
