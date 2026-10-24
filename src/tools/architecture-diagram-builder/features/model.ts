// The diagram model, node shapes and canvas geometry. Pure TypeScript: shared by the React canvas,
// the SVG/PNG export and the unit tests.

export const NODE_KINDS = ['frontend', 'service', 'database', 'cache', 'queue', 'external', 'generic'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export const KIND_LABELS: Record<NodeKind, string> = {
  frontend: 'Frontend',
  service: 'Service',
  database: 'Database',
  cache: 'Cache',
  queue: 'Queue',
  external: 'External API',
  generic: 'Generic',
};

export interface DiagramNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** Top-left corner in world coordinates. */
  x: number;
  y: number;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

/** A boundary rectangle. Membership is geometric: a node belongs to a group when its centre is inside. */
export interface DiagramGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
}

export const LIMITS = {
  nodes: 200,
  edges: 500,
  groups: 50,
  label: 80,
  /** World coordinates are clamped to ±coordinate so a hostile file can't create absurd geometry. */
  coordinate: 20_000,
  minGroupSize: 120,
  maxGroupSize: 10_000,
} as const;

export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 64;
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2.5;

export const EMPTY_DIAGRAM: Diagram = { nodes: [], edges: [], groups: [] };

/** Colours for the exported SVG/PNG (light theme), and Tailwind classes for the live canvas. */
export const KIND_STYLE: Record<NodeKind, { fill: string; stroke: string; className: string }> = {
  frontend: { fill: '#e0f2fe', stroke: '#0284c7', className: 'fill-sky-50 stroke-sky-600 dark:fill-sky-950 dark:stroke-sky-400' },
  service: { fill: '#d1fae5', stroke: '#059669', className: 'fill-emerald-50 stroke-emerald-600 dark:fill-emerald-950 dark:stroke-emerald-400' },
  database: { fill: '#ede9fe', stroke: '#7c3aed', className: 'fill-violet-50 stroke-violet-600 dark:fill-violet-950 dark:stroke-violet-400' },
  cache: { fill: '#fee2e2', stroke: '#dc2626', className: 'fill-red-50 stroke-red-600 dark:fill-red-950 dark:stroke-red-400' },
  queue: { fill: '#fef3c7', stroke: '#d97706', className: 'fill-amber-50 stroke-amber-600 dark:fill-amber-950 dark:stroke-amber-400' },
  external: { fill: '#f1f5f9', stroke: '#475569', className: 'fill-slate-50 stroke-slate-600 dark:fill-slate-900 dark:stroke-slate-400' },
  generic: { fill: '#ffffff', stroke: '#334155', className: 'fill-white stroke-slate-700 dark:fill-slate-900 dark:stroke-slate-300' },
};

/** SVG path for a node of `kind`, in node-local coordinates (0,0 to NODE_WIDTH,NODE_HEIGHT). */
export function nodeShape(kind: NodeKind): { d: string; dashed: boolean } {
  const w = NODE_WIDTH;
  const h = NODE_HEIGHT;
  switch (kind) {
    case 'frontend': // browser window: rounded box with a title bar
      return { d: `M0 8Q0 0 8 0H${w - 8}Q${w} 0 ${w} 8V${h - 8}Q${w} ${h} ${w - 8} ${h}H8Q0 ${h} 0 ${h - 8}ZM0 14H${w}`, dashed: false };
    case 'service': // pill
      return { d: `M20 0H${w - 20}A20 20 0 0 1 ${w} 20V${h - 20}A20 20 0 0 1 ${w - 20} ${h}H20A20 20 0 0 1 0 ${h - 20}V20A20 20 0 0 1 20 0Z`, dashed: false };
    case 'database': // cylinder
      return { d: `M0 9A${w / 2} 9 0 0 1 ${w} 9V${h - 9}A${w / 2} 9 0 0 1 0 ${h - 9}ZM0 9A${w / 2} 9 0 0 0 ${w} 9`, dashed: false };
    case 'cache': // hexagon
      return { d: `M16 0H${w - 16}L${w} ${h / 2}L${w - 16} ${h}H16L0 ${h / 2}Z`, dashed: false };
    case 'queue': // box with message slots on the right
      return { d: `M0 0H${w}V${h}H0ZM${w - 12} 0V${h}M${w - 24} 0V${h}`, dashed: false };
    case 'external': // dashed parallelogram: outside your boundary
      return { d: `M14 0H${w}L${w - 14} ${h}H0Z`, dashed: true };
    case 'generic':
      return { d: `M4 0H${w - 4}Q${w} 0 ${w} 4V${h - 4}Q${w} ${h} ${w - 4} ${h}H4Q0 ${h} 0 ${h - 4}V4Q0 0 4 0Z`, dashed: false };
  }
}

/** Splits a label into at most `maxLines` lines of `maxChars`, breaking on spaces and ending with "…" if cut. */
export function wrapLabel(label: string, maxChars = 18, maxLines = 2): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    while (current.length > maxChars) {
      lines.push(current.slice(0, maxChars));
      current = current.slice(maxChars);
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, maxChars - 1)}…`;
  return kept;
}

export interface Point {
  x: number;
  y: number;
}

export const nodeCenter = (n: Pick<DiagramNode, 'x' | 'y'>): Point => ({ x: n.x + NODE_WIDTH / 2, y: n.y + NODE_HEIGHT / 2 });

/** Where the ray from the node's centre towards `toward` leaves the node's bounding box. */
function boxExit(n: DiagramNode, toward: Point): Point {
  const c = nodeCenter(n);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const scale = Math.min(dx === 0 ? Infinity : NODE_WIDTH / 2 / Math.abs(dx), dy === 0 ? Infinity : NODE_HEIGHT / 2 / Math.abs(dy));
  return { x: c.x + dx * scale, y: c.y + dy * scale };
}

/** Straight edge between two nodes, clipped to their boxes so the arrowhead sits on the border. */
export function edgeLine(from: DiagramNode, to: DiagramNode): { start: Point; end: Point; mid: Point } {
  const start = boxExit(from, nodeCenter(to));
  const end = boxExit(to, nodeCenter(from));
  return { start, end, mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } };
}

export const isInside = (p: Point, g: DiagramGroup) => p.x >= g.x && p.x <= g.x + g.width && p.y >= g.y && p.y <= g.y + g.height;

/** Nodes whose centre lies inside the group. */
export const groupMembers = (d: Diagram, g: DiagramGroup) => d.nodes.filter((n) => isInside(nodeCenter(n), g));

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Bounding box of everything in the diagram, or null when it is empty. */
export function diagramBounds(d: Diagram): Bounds | null {
  const boxes = [
    ...d.nodes.map((n) => [n.x, n.y, n.x + NODE_WIDTH, n.y + NODE_HEIGHT]),
    ...d.groups.map((g) => [g.x, g.y, g.x + g.width, g.y + g.height]),
  ];
  if (!boxes.length) return null;
  return {
    minX: Math.min(...boxes.map((b) => b[0])),
    minY: Math.min(...boxes.map((b) => b[1])),
    maxX: Math.max(...boxes.map((b) => b[2])),
    maxY: Math.max(...boxes.map((b) => b[3])),
  };
}

/** Pan/zoom of the canvas: screen = world * zoom + (x, y). */
export interface View {
  x: number;
  y: number;
  zoom: number;
}

export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** The view that centres the diagram in a viewport of `width`×`height` px, zoomed to fit with `padding`. */
export function fitView(d: Diagram, width: number, height: number, padding = 24): View {
  const b = diagramBounds(d);
  if (!b || width <= 0 || height <= 0) return { x: 0, y: 0, zoom: 1 };
  const contentW = b.maxX - b.minX;
  const contentH = b.maxY - b.minY;
  const zoom = clampZoom(Math.min(1, (width - padding * 2) / contentW, (height - padding * 2) / contentH));
  return {
    x: (width - contentW * zoom) / 2 - b.minX * zoom,
    y: (height - contentH * zoom) / 2 - b.minY * zoom,
    zoom,
  };
}

/** Zoom by `factor` keeping the screen point (px, py) fixed. */
export function zoomAt(v: View, factor: number, px: number, py: number): View {
  const zoom = clampZoom(v.zoom * factor);
  const k = zoom / v.zoom;
  return { zoom, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
}

/** Baselines (node-local y) for the kind caption and each label line, shared by canvas and export. */
export function nodeTextLayout(lineCount: number): { captionY: number; lineY: (i: number) => number } {
  const captionY = 24 - (lineCount - 1) * 6;
  return { captionY, lineY: (i) => captionY + 20 + i * 16 };
}
