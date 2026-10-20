// Live commit graph: one dot per commit, one row per branch line, labels for branches, tags,
// origin/* and HEAD. Click (or Enter on) a commit to see its details.

import { useEffect, useMemo, useRef, useState } from 'react';
import { layoutGraph } from '../features/graph';
import type { Repo } from '../features/repo';

const COL = 96;
const LANE = 64;
const PAD_X = 32;
const LANE_COLORS = ['#059669', '#0284c7', '#7c3aed', '#d97706', '#db2777', '#0d9488'];
const PILL: Record<string, string> = { head: '#0f172a', branch: '#059669', remote: '#64748b', tag: '#d97706' };

export function CommitGraph({ repo }: { repo: Repo }) {
  const { nodes, edges, lanes } = useMemo(() => layoutGraph(repo), [repo]);
  const [selected, setSelected] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const maxRefs = Math.max(1, ...nodes.map((n) => n.refs.length));
  const top = 18 + maxRefs * 22;
  const width = Math.max(320, PAD_X * 2 + Math.max(0, nodes.length - 1) * COL);
  const height = top + lanes * LANE;
  const pos = new Map(nodes.map((n) => [n.id, { x: PAD_X + n.col * COL, y: top + n.lane * LANE + 12 }]));
  const detail = selected ? repo.commits[selected] : null;

  // Keep the newest commits in view.
  useEffect(() => {
    box.current?.scrollTo({ left: box.current.scrollWidth });
  }, [nodes.length]);

  return (
    <section aria-labelledby="gp-graph" className="min-w-0 space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gp-graph" className="font-semibold text-slate-900 dark:text-white">
          Commit graph
        </h2>
        <p className="text-xs text-slate-500">Each dot is a commit. The ringed dot is HEAD, where you are now.</p>
      </div>
      {!nodes.length ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          {repo.initialized ? 'No commits yet. Your first commit will appear here.' : 'Not a repository yet. Run git init to start.'}
        </p>
      ) : (
        <div ref={box} className="overflow-x-auto">
          <svg width={width} height={height} role="img" aria-label={`Commit graph with ${nodes.length} commits`} className="block">
            {edges.map((e) => {
              const a = pos.get(e.from)!;
              const b = pos.get(e.to)!;
              const d = a.y === b.y ? `M ${a.x} ${a.y} L ${b.x} ${b.y}` : `M ${a.x} ${a.y} C ${a.x + COL / 2} ${a.y}, ${b.x - COL / 2} ${b.y}, ${b.x} ${b.y}`;
              return <path key={`${e.from}-${e.to}`} d={d} fill="none" stroke="#94a3b8" strokeWidth={2.5} />;
            })}
            {nodes.map((n) => {
              const p = pos.get(n.id)!;
              const color = LANE_COLORS[n.lane % LANE_COLORS.length];
              const label = `Commit ${n.id}: ${n.message}${n.refs.length ? ` (${n.refs.map((r) => r.label).join(', ')})` : ''}`;
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={selected === n.id}
                  className="cursor-pointer focus:outline-none [&:focus-visible>circle:first-of-type]:stroke-sky-500"
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(selected === n.id ? null : n.id);
                    }
                  }}
                >
                  <title>{label}</title>
                  <circle cx={p.x} cy={p.y} r={n.isHead ? 15 : 0} fill="none" stroke={color} strokeWidth={2.5} />
                  <circle cx={p.x} cy={p.y} r={10} fill={color} stroke={selected === n.id ? '#0f172a' : 'white'} strokeWidth={2} />
                  <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" className="fill-slate-500">
                    {n.id.slice(0, 7)}
                  </text>
                  {n.refs.map((r, i) => {
                    const w = r.label.length * 6.6 + 12;
                    const y = p.y - 22 - (i + 1) * 22 + 8;
                    return (
                      <g key={r.label}>
                        <rect x={p.x - w / 2} y={y} width={w} height={18} rx={9} fill={PILL[r.kind]} />
                        <text x={p.x} y={y + 13} textAnchor="middle" fontSize="11" fontWeight="600" fill="white" fontFamily="ui-monospace, monospace">
                          {r.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      )}
      {detail && (
        <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
          <p className="font-mono text-xs text-slate-500">
            commit {detail.id}
            {detail.parents.length ? ` · parent${detail.parents.length > 1 ? 's' : ''} ${detail.parents.join(', ')}` : ' · first commit'}
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{detail.message}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Files in this snapshot: {Object.keys(detail.files).sort().join(', ') || '(none)'}</p>
        </div>
      )}
    </section>
  );
}
