// The site-wide command palette (lazy-loaded by CommandPaletteProvider). Tools are searched
// instantly from the registry; the Learn index and blog metadata are fetched on first open.
// The input and results follow the ARIA combobox + listbox pattern, with one group per kind.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { useModal } from '../hooks/useModal';
import {
  orderItems,
  paletteActions,
  searchActionItems,
  searchPostItems,
  searchToolItems,
  toolItem,
  type PaletteGroup,
  type PaletteItem,
  type PalettePost,
} from '../lib/commandSearch';
import { useRecentTools } from '../lib/toolPrefs';
import { applyTheme, currentTheme } from '../utils/theme';
import { TOOLS } from '../../tools/registry';
import { highlightParts, searchLearn } from '../../learn/features/search';
import type { SearchEntry } from '../../learn/data/catalog.types';
import { Icon } from './ui';

const LEARN_LIMIT = 8;

type LearnData = typeof import('../../learn/data');
interface Remote {
  learn?: { data: LearnData; entries: SearchEntry[] };
  posts?: PalettePost[];
  failed?: boolean;
}

// Fetched once per page load and shared by every later open.
let cache: Remote = {};
let pending: Promise<Remote> | undefined;

function loadRemote(): Promise<Remote> {
  pending ??= Promise.all([
    import('../../learn/data').then(async (data) => ({ data, entries: await data.loadSearchEntries() })),
    import('../../blog/registry').then((m) => m.POSTS.map(({ slug, title, summary, tags }) => ({ slug, title, summary, tags }))),
  ]).then(
    ([learn, posts]) => (cache = { learn, posts }),
    () => {
      pending = undefined; // allow a retry on the next open
      return (cache = { failed: true });
    },
  );
  return pending;
}

function useRemote(): Remote {
  const [state, setState] = useState<Remote>(cache);
  useEffect(() => {
    if (cache.learn) return;
    let live = true;
    loadRemote().then((r) => live && setState(r));
    return () => {
      live = false;
    };
  }, []);
  return state;
}

const KIND_ICON = { topic: 'book', problem: 'puzzle', 'case-study': 'building' } as const;

function learnItems(learn: NonNullable<Remote['learn']>, query: string): PaletteItem[] {
  const { data } = learn;
  return searchLearn(learn.entries, query, LEARN_LIMIT).map(({ entry: e }) => ({
    key: `learn:${e.kind}/${e.subjectId}/${e.id}`,
    group: 'Learn',
    title: e.title,
    description: e.description,
    icon: KIND_ICON[e.kind],
    label:
      e.kind === 'topic'
        ? `Topic · ${data.getSubjectMeta(e.subjectId)?.title ?? e.subjectId}`
        : e.kind === 'problem'
          ? `Problem · ${data.getCategory(e.subjectId)?.title ?? e.subjectId}`
          : 'Case study',
    to: e.kind === 'topic' ? data.topicPath(e.subjectId, e.id) : e.kind === 'problem' ? data.problemPath(e.subjectId, e.id) : data.caseStudyPath(e.id),
  }));
}

const GROUP_TITLES: Record<PaletteGroup, string> = { Recent: 'Recent tools', Tools: 'Tools', Learn: 'Learn', Blog: 'Blog', Actions: 'Actions' };

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((p, j) =>
        p.match ? (
          <mark key={j} className="rounded-sm bg-emerald-100 text-inherit dark:bg-emerald-900/70">
            {p.text}
          </mark>
        ) : (
          <span key={j}>{p.text}</span>
        ),
      )}
    </>
  );
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useModal(true, panel, onClose, input);

  const navigate = useNavigate();
  const remote = useRemote();
  const recent = useRecentTools();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [theme] = useState(currentTheme);
  const trimmed = query.trim();

  const results = useMemo(() => {
    const actions = searchActionItems(paletteActions(theme), query);
    if (!trimmed) {
      const recentItems = recent
        .map((id) => TOOLS.find((t) => t.id === id && t.status !== 'coming-soon'))
        .filter((t) => t !== undefined)
        .slice(0, 5)
        .map((t) => toolItem(t, 'Recent'));
      return orderItems([...recentItems, ...actions]);
    }
    return orderItems([
      ...searchToolItems(TOOLS, query),
      ...(remote.learn ? learnItems(remote.learn, query) : []),
      ...(remote.posts ? searchPostItems(remote.posts, query) : []),
      ...actions,
    ]);
  }, [query, trimmed, recent, remote, theme]);

  const listId = useId();
  const titleId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' });
    // optionId is derived from listId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const run = (item: PaletteItem) => {
    onClose();
    if (item.action === 'toggle-theme') applyTheme(theme === 'dark' ? 'light' : 'dark');
    else if (item.to) navigate(item.to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setActive((current + d + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[current]);
    }
  };

  const loadingLearn = Boolean(trimmed) && !remote.learn && !remote.failed;
  const matches = results.length;
  const status = remote.failed && trimmed
    ? 'Lessons and posts couldn’t be loaded. Showing tools only.'
    : !trimmed
      ? 'Search tools, lessons, problems, case studies and posts.'
      : loadingLearn
        ? 'Loading lessons…'
        : matches === 0
          ? `No results for “${trimmed}”.`
          : `${matches} result${matches === 1 ? '' : 's'}`;

  // Groups in display order, with each item's index in the flat option list.
  const groups: { group: PaletteGroup; items: { item: PaletteItem; index: number }[] }[] = [];
  results.forEach((item, index) => {
    const last = groups[groups.length - 1];
    if (last?.group === item.group) last.items.push({ item, index });
    else groups.push({ group: item.group, items: [{ item, index }] });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[8vh] sm:p-6 sm:pt-[12vh]">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 id={titleId} className="sr-only">
          Search Zykit
        </h2>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Icon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length > 0 ? optionId(current) : undefined}
            aria-label="Search tools, lessons and posts"
            placeholder="Search tools, lessons, posts…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 pointer-coarse:min-h-11 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
          >
            <span className="sr-only">Close search</span>
            <span aria-hidden="true">Esc</span>
          </button>
        </div>

        <p role="status" className={`px-5 text-sm text-slate-500 dark:text-slate-400 ${matches > 0 || !trimmed ? 'sr-only' : 'py-6 text-center'}`}>
          {status}
        </p>

        <div id={listId} role="listbox" aria-label="Results" className={`overflow-y-auto overscroll-contain p-2 ${results.length ? '' : 'hidden'}`}>
          {groups.map(({ group, items }) => (
            <div key={group} role="group" aria-labelledby={`${listId}-${group}`} className="pb-1">
              <div id={`${listId}-${group}`} role="presentation" className="eyebrow px-3 pt-2 pb-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
                {GROUP_TITLES[group]}
              </div>
              {items.map(({ item, index: i }) => (
                <div
                  key={item.key}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === current}
                  onClick={() => run(item)}
                  onMouseMove={() => i !== current && setActive(i)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 ${
                    i === current ? 'bg-primary-soft text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    {item.group !== 'Actions' && <span className="eyebrow block text-[0.65rem] text-slate-500 dark:text-slate-400">{item.label}</span>}
                    <span className="block font-semibold text-slate-900 dark:text-white">
                      <Highlighted text={item.title} query={query} />
                    </span>
                    {item.description && <span className="mt-0.5 line-clamp-1 block text-sm text-slate-500 dark:text-slate-400">{item.description}</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {loadingLearn && <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">Loading lessons…</p>}
        </div>

        <div className="hidden items-center gap-4 border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500 sm:flex dark:border-slate-800 dark:text-slate-400">
          <span>
            <kbd className="font-sans font-semibold">↑</kbd> <kbd className="font-sans font-semibold">↓</kbd> to move
          </span>
          <span>
            <kbd className="font-sans font-semibold">Enter</kbd> to open
          </span>
          <span>
            <kbd className="font-sans font-semibold">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
