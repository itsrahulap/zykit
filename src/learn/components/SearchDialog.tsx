// Search across every lesson, problem and case study. The index is fetched the first time
// the dialog opens; the input and results follow the ARIA combobox + listbox pattern.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import type { SearchEntry } from '../data/catalog.types';
import { caseStudyPath, getCategory, getSubjectMeta, loadSearchEntries, problemPath, topicPath } from '../data';
import { highlightParts, MAX_RESULTS, searchLearn } from '../features/search';
import { useModal } from '../hooks/useModal';
import { Icon } from '../../shared/ui/ui';

let cached: SearchEntry[] | undefined;

function useSearchIndex() {
  const [state, setState] = useState<{ entries?: SearchEntry[]; failed?: boolean }>(() => ({ entries: cached }));
  useEffect(() => {
    if (cached) return;
    let live = true;
    loadSearchEntries().then(
      (entries) => {
        cached = entries;
        if (live) setState({ entries });
      },
      () => live && setState({ failed: true }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

function entryPath(e: SearchEntry): string {
  if (e.kind === 'topic') return topicPath(e.subjectId, e.id);
  if (e.kind === 'problem') return problemPath(e.subjectId, e.id);
  return caseStudyPath(e.id);
}

function entryLabel(e: SearchEntry): string {
  if (e.kind === 'topic') return `Topic · ${getSubjectMeta(e.subjectId)?.title ?? e.subjectId}`;
  if (e.kind === 'problem') return `Problem · ${getCategory(e.subjectId)?.title ?? e.subjectId}`;
  return 'Case study';
}

const KIND_ICON = { topic: 'book', problem: 'puzzle', 'case-study': 'building' } as const;

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useModal(true, panel, onClose, input);

  const navigate = useNavigate();
  const { entries, failed } = useSearchIndex();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => (entries ? searchLearn(entries, query) : []), [entries, query]);
  const listId = useId();
  const titleId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' });
    // optionId is derived from listId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const open = (e: SearchEntry) => {
    onClose();
    navigate(entryPath(e));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setActive((current + d + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open(results[current].entry);
    }
  };

  const trimmed = query.trim();
  const status = failed
    ? 'The search index couldn’t be loaded. Check your connection and try again.'
    : !entries
      ? 'Loading search…'
      : !trimmed
        ? 'Search lessons, practice problems and case studies.'
        : results.length === 0
          ? `No results for “${trimmed}”.`
          : `${results.length}${results.length === MAX_RESULTS ? '+' : ''} result${results.length === 1 ? '' : 's'}`;

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
          Search Learn
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
            aria-label="Search topics, problems and case studies"
            placeholder="Search topics, problems, case studies…"
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

        <p role="status" className={`px-5 text-sm text-slate-500 dark:text-slate-400 ${results.length > 0 ? 'sr-only' : 'py-8 text-center'}`}>
          {status}
        </p>

        <ul id={listId} role="listbox" aria-label="Results" className={`overflow-y-auto overscroll-contain p-2 ${results.length ? '' : 'hidden'}`}>
          {results.map(({ entry: e }, i) => (
            <li
              key={`${e.kind}/${e.subjectId}/${e.id}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === current}
              onClick={() => open(e)}
              onMouseMove={() => i !== current && setActive(i)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 ${
                i === current ? 'bg-primary-soft text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Icon name={KIND_ICON[e.kind]} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow block text-[0.65rem] text-slate-500 dark:text-slate-400">{entryLabel(e)}</span>
                <span className="block font-semibold text-slate-900 dark:text-white">
                  {highlightParts(e.title, query).map((p, j) =>
                    p.match ? (
                      <mark key={j} className="rounded-sm bg-emerald-100 text-inherit dark:bg-emerald-900/70">
                        {p.text}
                      </mark>
                    ) : (
                      <span key={j}>{p.text}</span>
                    ),
                  )}
                </span>
                <span className="mt-0.5 line-clamp-1 block text-sm text-slate-500 dark:text-slate-400">{e.description}</span>
              </span>
            </li>
          ))}
        </ul>

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
