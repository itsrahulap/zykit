// Immutable edits to a Diagram, and the undo/redo history that wraps them.

import {
  LIMITS,
  NODE_HEIGHT,
  NODE_WIDTH,
  groupMembers,
  type Diagram,
  type DiagramEdge,
  type DiagramGroup,
  type DiagramNode,
  type NodeKind,
} from './model';

export type Selection = { type: 'node' | 'edge' | 'group'; id: string } | null;

const clampCoordinate = (v: number) => Math.round(Math.min(LIMITS.coordinate, Math.max(-LIMITS.coordinate, v)));
// oxlint-disable-next-line no-control-regex
export const clampLabel = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').slice(0, LIMITS.label);

/** First `${prefix}-N` not used by any node, edge or group. */
export function nextId(d: Diagram, prefix: string): string {
  const used = new Set([...d.nodes, ...d.edges, ...d.groups].map((x) => x.id));
  let i = 1;
  while (used.has(`${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
}

export class DiagramLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiagramLimitError';
  }
}

export function addNode(d: Diagram, kind: NodeKind, label: string, x: number, y: number): { diagram: Diagram; id: string } {
  if (d.nodes.length >= LIMITS.nodes) throw new DiagramLimitError(`A diagram can have at most ${LIMITS.nodes} nodes.`);
  const id = nextId(d, 'node');
  const node: DiagramNode = { id, kind, label: clampLabel(label), x: clampCoordinate(x), y: clampCoordinate(y) };
  return { diagram: { ...d, nodes: [...d.nodes, node] }, id };
}

export function addGroup(d: Diagram, label: string, x: number, y: number, width = 360, height = 220): { diagram: Diagram; id: string } {
  if (d.groups.length >= LIMITS.groups) throw new DiagramLimitError(`A diagram can have at most ${LIMITS.groups} groups.`);
  const id = nextId(d, 'group');
  const group: DiagramGroup = { id, label: clampLabel(label), x: clampCoordinate(x), y: clampCoordinate(y), width, height };
  return { diagram: { ...d, groups: [...d.groups, group] }, id };
}

/** Adds a directed edge. Self-loops and exact duplicates are refused (null) rather than drawn twice. */
export function addEdge(d: Diagram, from: string, to: string, label = ''): { diagram: Diagram; id: string } | null {
  if (from === to || !d.nodes.some((n) => n.id === from) || !d.nodes.some((n) => n.id === to)) return null;
  if (d.edges.some((e) => e.from === from && e.to === to)) return null;
  if (d.edges.length >= LIMITS.edges) throw new DiagramLimitError(`A diagram can have at most ${LIMITS.edges} edges.`);
  const id = nextId(d, 'edge');
  return { diagram: { ...d, edges: [...d.edges, { id, from, to, label: clampLabel(label) }] }, id };
}

export function updateNode(d: Diagram, id: string, patch: Partial<Pick<DiagramNode, 'label' | 'kind'>>): Diagram {
  const clean = patch.label === undefined ? patch : { ...patch, label: clampLabel(patch.label) };
  return { ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...clean } : n)) };
}

export function updateEdge(d: Diagram, id: string, patch: Partial<Pick<DiagramEdge, 'label'>>): Diagram {
  const clean = patch.label === undefined ? patch : { ...patch, label: clampLabel(patch.label) };
  return { ...d, edges: d.edges.map((e) => (e.id === id ? { ...e, ...clean } : e)) };
}

const clampSize = (v: number) => Math.round(Math.min(LIMITS.maxGroupSize, Math.max(LIMITS.minGroupSize, v)));

export function updateGroup(d: Diagram, id: string, patch: Partial<Pick<DiagramGroup, 'label' | 'width' | 'height'>>): Diagram {
  return {
    ...d,
    groups: d.groups.map((g) =>
      g.id === id
        ? {
            ...g,
            label: patch.label === undefined ? g.label : clampLabel(patch.label),
            width: patch.width === undefined ? g.width : clampSize(patch.width),
            height: patch.height === undefined ? g.height : clampSize(patch.height),
          }
        : g,
    ),
  };
}

/**
 * Moves the selected item by (dx, dy). Moving a group moves the nodes inside it, measured
 * against `base` so a drag computed from its starting diagram doesn't pick up nodes it passes over.
 */
export function moveItem(base: Diagram, selection: NonNullable<Selection>, dx: number, dy: number): Diagram {
  if (selection.type === 'edge') return base;
  let nodeIds = new Set<string>();
  if (selection.type === 'node') nodeIds.add(selection.id);
  const group = selection.type === 'group' ? base.groups.find((g) => g.id === selection.id) : undefined;
  if (group) nodeIds = new Set(groupMembers(base, group).map((n) => n.id));
  return {
    ...base,
    nodes: base.nodes.map((n) => (nodeIds.has(n.id) ? { ...n, x: clampCoordinate(n.x + dx), y: clampCoordinate(n.y + dy) } : n)),
    groups: base.groups.map((g) => (g === group ? { ...g, x: clampCoordinate(g.x + dx), y: clampCoordinate(g.y + dy) } : g)),
  };
}

/** Removes an item. Removing a node removes every edge attached to it; removing a group keeps its nodes. */
export function deleteItem(d: Diagram, selection: NonNullable<Selection>): Diagram {
  const { type, id } = selection;
  if (type === 'node') return { ...d, nodes: d.nodes.filter((n) => n.id !== id), edges: d.edges.filter((e) => e.from !== id && e.to !== id) };
  if (type === 'edge') return { ...d, edges: d.edges.filter((e) => e.id !== id) };
  return { ...d, groups: d.groups.filter((g) => g.id !== id) };
}

/** A free spot for a new node: right of everything, or the origin of an empty diagram. */
export function freeSpot(d: Diagram): { x: number; y: number } {
  if (!d.nodes.length) return { x: 40, y: 40 };
  const maxX = Math.max(...d.nodes.map((n) => n.x));
  const minY = Math.min(...d.nodes.map((n) => n.y));
  return { x: maxX + NODE_WIDTH + 60, y: minY + NODE_HEIGHT };
}

// ---- Undo / redo ----

export interface History {
  past: Diagram[];
  present: Diagram;
  future: Diagram[];
}

export const HISTORY_LIMIT = 100;

export const createHistory = (present: Diagram): History => ({ past: [], present, future: [] });

/** Records `next` as a new step. A no-op edit (same object) leaves the history alone. */
export function commit(h: History, next: Diagram, before: Diagram = h.present): History {
  if (next === before) return h;
  return { past: [...h.past, before].slice(-HISTORY_LIMIT), present: next, future: [] };
}

/** Replaces the present without a history step (used while dragging; `commit` once on release). */
export const preview = (h: History, next: Diagram): History => ({ ...h, present: next });

export function undo(h: History): History {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
}

export function redo(h: History): History {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}
