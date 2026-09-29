import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, type MetadataEntry } from '../features/metadata/metadata.types';
import { Badge } from '../../../shared/ui/ui';

type Filter = 'all' | 'sensitive' | 'generator' | 'provenance';

const FILTERS: { id: Filter; label: string; test: (e: MetadataEntry) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'sensitive', label: 'Privacy', test: (e) => e.sensitive },
  { id: 'generator', label: 'Generator', test: (e) => e.generatorRelated },
  { id: 'provenance', label: 'Provenance', test: (e) => e.provenanceRelated },
];

export function EntryTags({ entry }: { entry: MetadataEntry }) {
  return (
    <span className="flex flex-wrap gap-1">
      {entry.sensitive && <Badge tone="red">Privacy</Badge>}
      {entry.generatorRelated && <Badge tone="violet">Generator</Badge>}
      {entry.provenanceRelated && <Badge tone="blue">Provenance</Badge>}
      {!entry.removable && <Badge>Kept</Badge>}
    </span>
  );
}

export function MetadataTable({ entries }: { entries: MetadataEntry[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, entries.filter(f.test).length])), [entries]);

  const groups = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = query.trim().toLowerCase();
    const visible = entries.filter((e) => f.test(e) && (!q || e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q)));
    return CATEGORY_ORDER.map((cat) => ({ cat, items: visible.filter((e) => e.category === cat) })).filter((g) => g.items.length);
  }, [entries, filter, query]);

  if (!entries.length) return <p className="text-sm text-slate-600 dark:text-slate-400">No readable metadata fields.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter fields" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {f.label} <span className="opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <label className="sm:w-56">
          <span className="sr-only">Search metadata</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
      </div>

      {groups.length === 0 && <p className="text-sm text-slate-500">No fields match.</p>}

      <div className="space-y-3">
        {groups.map(({ cat, items }) => (
          <details key={cat} open className="group rounded-2xl border border-slate-200 dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/50">
              <span>
                {CATEGORY_LABELS[cat]} <span className="font-normal text-slate-500">· {items.length}</span>
              </span>
              <span className="text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true">
                ›
              </span>
            </summary>
            <table className="w-full table-fixed border-t border-slate-200 text-sm sm:text-base dark:border-slate-800">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th scope="col" className="px-4 pb-2 pt-3">Tag</th>
                  <th scope="col" className="px-4 pb-2 pt-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((e, i) => (
                  <tr key={i} className="align-top">
                    <th scope="row" className="w-2/5 px-4 py-3 text-left font-medium text-slate-700 sm:w-1/3 dark:text-slate-300">
                      <span className="block break-words">{e.key}</span>
                      <span className="block break-words text-xs font-normal text-slate-500">{e.location}</span>
                      <span className="mt-1 block">
                        <EntryTags entry={e} />
                      </span>
                    </th>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-400">
                      {/* Rendered as text: metadata is untrusted input. */}
                      <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{e.value}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </div>
  );
}
