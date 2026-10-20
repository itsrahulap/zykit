// Lays the visible commits out left-to-right: column = creation order, lane = the branch whose
// first-parent line reaches the commit first (main gets the top lane).

import { headId, refsAt, visibleCommits, type Repo } from './repo';

export interface GraphNode {
  id: string;
  message: string;
  col: number;
  lane: number;
  refs: ReturnType<typeof refsAt>;
  isHead: boolean;
}

export function layoutGraph(r: Repo) {
  const commits = visibleCommits(r);
  const byId = new Map(commits.map((c) => [c.id, c]));
  const rank = (name: string) => (name === 'main' || name === 'master' ? 0 : 1);
  const branchTips = Object.keys(r.branches)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((b) => r.branches[b]);
  const tips = [...branchTips, ...Object.values(r.remote?.branches ?? {}), ...Object.values(r.tags), headId(r), r.merging?.theirs ?? null];
  const lane = new Map<string, number>();
  let next = 0;
  for (const tip of tips) {
    let id: string | undefined = tip ?? undefined;
    let used = false;
    while (id && byId.has(id) && !lane.has(id)) {
      lane.set(id, next);
      used = true;
      id = byId.get(id)!.parents[0];
    }
    if (used) next++;
  }
  const head = headId(r);
  const nodes: GraphNode[] = commits.map((c, col) => ({ id: c.id, message: c.message, col, lane: lane.get(c.id) ?? next, refs: refsAt(r, c.id), isHead: c.id === head }));
  const edges = commits.flatMap((c) => c.parents.filter((p) => byId.has(p)).map((p) => ({ from: p, to: c.id })));
  return { nodes, edges, lanes: Math.max(1, next) };
}
