// Layered layout for the dependency graph: operations in the first column, then each component in
// the column after the closest thing that references it. Plain coordinates; the page draws the SVG.

import type { ComponentNode, OperationNode } from './dependency-map';

export const NODE_W = 220;
export const NODE_H = 34;
const GAP_X = 90;
const GAP_Y = 12;
const PAD = 12;
/** Above this many nodes the graph is not drawn; filters narrow it down. */
export const MAX_GRAPH_NODES = 400;

export interface GraphNode {
  key: string;
  label: string;
  kind: 'operation' | 'component';
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

export function layoutGraph(operations: OperationNode[], components: ComponentNode[]): GraphLayout {
  const visible = new Map(components.map((c) => [c.key, c]));
  const depth = new Map<string, number>();
  let frontier = [...new Set(operations.flatMap((o) => o.directRefs))].filter((k) => visible.has(k));
  for (let d = 1; frontier.length; d++) {
    const next: string[] = [];
    for (const k of frontier) {
      if (depth.has(k)) continue;
      depth.set(k, d);
      for (const r of visible.get(k)!.refs) if (visible.has(r) && !depth.has(r)) next.push(r);
    }
    frontier = next;
  }

  const columns: GraphNode[][] = [operations.map((o) => ({ key: o.key, label: o.key, kind: 'operation' as const, x: 0, y: 0 }))];
  for (const c of components) {
    const col = depth.get(c.key) ?? 1;
    (columns[col] ??= []).push({ key: c.key, label: c.name, kind: 'component', x: 0, y: 0 });
  }
  const nodes: GraphNode[] = [];
  columns.forEach((column, col) =>
    (column ?? []).forEach((n, row) => {
      n.x = PAD + col * (NODE_W + GAP_X);
      n.y = PAD + row * (NODE_H + GAP_Y);
      nodes.push(n);
    }),
  );

  const edges: GraphEdge[] = [];
  for (const o of operations) for (const k of o.directRefs) if (visible.has(k)) edges.push({ from: o.key, to: k });
  for (const c of components) for (const k of c.refs) if (k !== c.key && visible.has(k)) edges.push({ from: c.key, to: k });

  const rows = Math.max(1, ...columns.map((c) => c?.length ?? 0));
  return { nodes, edges, width: PAD * 2 + columns.length * NODE_W + (columns.length - 1) * GAP_X, height: PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y };
}

/** Cubic curve from the right edge of `a` to the left edge of `b` (or between left edges for back edges). */
export function edgePath(a: GraphNode, b: GraphNode): string {
  const y1 = a.y + NODE_H / 2;
  const y2 = b.y + NODE_H / 2;
  if (b.x > a.x) {
    const x1 = a.x + NODE_W;
    const mid = (x1 + b.x) / 2;
    return `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${b.x},${y2}`;
  }
  const bend = Math.min(a.x, b.x) - 40;
  return `M${a.x},${y1} C${bend},${y1} ${bend},${y2} ${b.x},${y2}`;
}
