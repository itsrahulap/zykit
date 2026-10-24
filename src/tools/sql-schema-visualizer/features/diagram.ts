// Diagram geometry (layered auto-layout and FK edge paths) and the exports built from it: a
// standalone SVG string and a Mermaid erDiagram. Both are generated from the parsed model, never
// from user markup, and every piece of user text is escaped for its target format.

import { tableLabel, type ForeignKey, type ParsedSchema, type SqlColumn, type SqlTable } from './parser';

export interface Metrics {
  header: number;
  row: number;
  padBottom: number;
  minWidth: number;
  maxWidth: number;
  /** Every box gets this width (used for the Query Builder, whose cards are fixed-width). */
  fixedWidth?: number;
  gapX: number;
  gapY: number;
}

export const DIAGRAM_METRICS: Metrics = { header: 34, row: 22, padBottom: 8, minWidth: 190, maxWidth: 360, gapX: 96, gapY: 40 };
const CHAR_W = 7.4;
export const MARKER_W = 44;

export interface Row {
  column: SqlColumn;
  markers: string[];
  /** Clipped to fit the box; the full text is in `column`. */
  name: string;
  type: string;
}

export interface TableShape {
  table: SqlTable;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rows: Row[];
}

export interface EdgeShape {
  fk: ForeignKey;
  d: string;
}

export interface Diagram {
  tables: TableShape[];
  edges: EdgeShape[];
  width: number;
  height: number;
}

export const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, Math.max(1, max - 1))}…`);

function markersFor(s: ParsedSchema, t: SqlTable, c: SqlColumn): string[] {
  const m: string[] = [];
  if (c.primaryKey) m.push('PK');
  if (s.foreignKeys.some((fk) => fk.fromTable === t.id && fk.fromColumns.includes(c.name))) m.push('FK');
  if (c.unique && !c.primaryKey) m.push('UQ');
  return m;
}

/**
 * Layered layout: referenced (parent) tables sit left of the tables that point at them. Layers come
 * from a topological order (Kahn), so FK cycles can't loop; tall layers wrap into extra columns.
 */
export function layoutDiagram(s: ParsedSchema, metrics: Metrics = DIAGRAM_METRICS): Diagram {
  const ids = s.tables.map((t) => t.id);
  const parents = new Map(ids.map((id) => [id, new Set<string>()]));
  for (const fk of s.foreignKeys) if (fk.fromTable !== fk.toTable) parents.get(fk.fromTable)!.add(fk.toTable);

  const indegree = new Map(ids.map((id) => [id, parents.get(id)!.size]));
  const order: string[] = [];
  const queue = ids.filter((id) => !indegree.get(id));
  const placed = new Set<string>();
  while (order.length < ids.length) {
    // In a cycle nothing has indegree 0: take the first unplaced table and carry on.
    const next = queue.shift() ?? ids.find((id) => !placed.has(id))!;
    if (placed.has(next)) continue;
    placed.add(next);
    order.push(next);
    for (const [child, ps] of parents) {
      if (!ps.has(next) || placed.has(child)) continue;
      indegree.set(child, indegree.get(child)! - 1);
      if (indegree.get(child) === 0) queue.push(child);
    }
  }
  const layer = new Map<string, number>();
  for (const id of order) layer.set(id, Math.max(0, ...[...parents.get(id)!].filter((p) => layer.has(p)).map((p) => layer.get(p)! + 1)));

  const shapes = new Map<string, TableShape>();
  for (const t of s.tables) {
    const rows = t.columns.map((column) => ({ column, markers: markersFor(s, t, column), name: column.name, type: column.type }));
    const label = tableLabel(t);
    const widest = Math.max(label.length * (CHAR_W + 1), ...rows.map((r) => (r.name.length + r.type.length + 2) * CHAR_W + MARKER_W));
    const w = metrics.fixedWidth ?? Math.round(Math.min(metrics.maxWidth, Math.max(metrics.minWidth, widest + 24)));
    const chars = Math.floor((w - MARKER_W - 16) / CHAR_W);
    for (const r of rows) {
      r.type = clip(r.type, Math.max(6, Math.min(r.type.length, chars - Math.min(r.name.length, Math.ceil(chars * 0.55)) - 2)));
      r.name = clip(r.name, Math.max(4, chars - r.type.length - 2));
    }
    const h = metrics.header + Math.max(1, rows.length) * metrics.row + metrics.padBottom;
    shapes.set(t.id, { table: t, label: clip(label, Math.floor((w - 20) / (CHAR_W + 1))), x: 0, y: 0, w, h, rows });
  }

  const layers: string[][] = [];
  for (const id of order) (layers[layer.get(id)!] ??= []).push(id);
  const maxPerColumn = Math.max(4, Math.ceil(Math.sqrt(ids.length)));
  const rank = new Map<string, number>();
  let x = 0;
  let width = 0;
  let height = 0;
  for (const layerIds of layers.filter(Boolean)) {
    // Order a layer by where its parents sit, which keeps edges short and reduces crossings.
    const avgParent = (id: string) => {
      const ranks = [...parents.get(id)!].filter((p) => rank.has(p)).map((p) => rank.get(p)!);
      return ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : Infinity;
    };
    const sorted = [...layerIds].sort((a, b) => avgParent(a) - avgParent(b));
    for (let start = 0; start < sorted.length; start += maxPerColumn) {
      const column = sorted.slice(start, start + maxPerColumn).map((id) => shapes.get(id)!);
      let y = 0;
      for (const shape of column) {
        shape.x = x;
        shape.y = y;
        rank.set(shape.table.id, rank.size);
        y += shape.h + metrics.gapY;
      }
      const colWidth = Math.max(...column.map((c) => c.w));
      width = x + colWidth;
      height = Math.max(height, y - metrics.gapY);
      x += colWidth + metrics.gapX;
    }
  }

  const rowY = (shape: TableShape, name: string) => {
    const i = shape.table.columns.findIndex((c) => c.name === name);
    return shape.y + (i < 0 ? metrics.header / 2 : metrics.header + i * metrics.row + metrics.row / 2);
  };
  const edges = s.foreignKeys.flatMap((fk): EdgeShape[] => {
    const from = shapes.get(fk.fromTable);
    const to = shapes.get(fk.toTable);
    if (!from || !to) return [];
    const y1 = rowY(from, fk.fromColumns[0]);
    const y2 = rowY(to, fk.toColumns[0]);
    if (from === to) {
      const sx = from.x + from.w;
      return [{ fk, d: `M ${sx} ${y1} C ${sx + 48} ${y1}, ${sx + 48} ${y2}, ${sx} ${y2}` }];
    }
    let sx: number, tx: number, bend: number;
    if (to.x + to.w <= from.x) [sx, tx, bend] = [from.x, to.x + to.w, -1];
    else if (from.x + from.w <= to.x) [sx, tx, bend] = [from.x + from.w, to.x, 1];
    else [sx, tx, bend] = [from.x + from.w, to.x + to.w, 0];
    const dx = bend === 0 ? 56 : Math.max(32, Math.abs(tx - sx) / 2) * bend;
    return [{ fk, d: `M ${sx} ${y1} C ${sx + dx} ${y1}, ${tx - (bend === 0 ? -dx : dx)} ${y2}, ${tx} ${y2}` }];
  });

  return { tables: [...shapes.values()], edges, width, height };
}

/** The seed tables plus every table they share a foreign key with. */
export function connectedTables(s: ParsedSchema, seeds: Set<string>): Set<string> {
  const out = new Set(seeds);
  for (const fk of s.foreignKeys) {
    if (seeds.has(fk.fromTable)) out.add(fk.toTable);
    if (seeds.has(fk.toTable)) out.add(fk.fromTable);
  }
  return out;
}

// ---- SVG export ----

const xml = (s: string) =>
  s
    // Characters XML 1.0 forbids (a quoted identifier can contain them) would make the file unreadable.
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '�')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const EXPORT_PADDING = 24;

/** A standalone SVG document of the diagram, light theme, system fonts only. */
export function diagramToSvg(d: Diagram, metrics: Metrics = DIAGRAM_METRICS): { text: string; width: number; height: number } {
  const p = EXPORT_PADDING;
  const w = Math.ceil(d.width + p * 2 + 64);
  const h = Math.ceil(d.height + p * 2);
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${-p} ${-p} ${w} ${h}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="12">`,
    `<defs><marker id="fk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#64748b"/></marker></defs>`,
    `<rect x="${-p}" y="${-p}" width="${w}" height="${h}" fill="#ffffff"/>`,
  ];
  for (const e of d.edges) out.push(`<path d="${e.d}" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#fk-arrow)"/>`);
  for (const t of d.tables) {
    out.push(
      `<g><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="10" fill="#ffffff" stroke="#cbd5e1"/>`,
      `<path d="M ${t.x} ${t.y + metrics.header} V ${t.y + 10} Q ${t.x} ${t.y} ${t.x + 10} ${t.y} H ${t.x + t.w - 10} Q ${t.x + t.w} ${t.y} ${t.x + t.w} ${t.y + 10} V ${t.y + metrics.header} Z" fill="#047857"/>`,
      `<text x="${t.x + 12}" y="${t.y + metrics.header / 2 + 5}" fill="#ffffff" font-weight="700" font-size="13">${xml(t.label)}</text>`,
    );
    t.rows.forEach((r, i) => {
      const y = t.y + metrics.header + i * metrics.row + metrics.row / 2 + 4;
      if (r.markers.length) out.push(`<text x="${t.x + 8}" y="${y}" fill="#b45309" font-size="9" font-weight="700">${r.markers.join(' ')}</text>`);
      out.push(
        `<text x="${t.x + MARKER_W}" y="${y}" fill="#0f172a"${r.column.primaryKey ? ' font-weight="700"' : ''}>${xml(r.name)}</text>`,
        `<text x="${t.x + t.w - 10}" y="${y}" fill="#64748b" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11">${xml(r.type)}</text>`,
      );
    });
    out.push('</g>');
  }
  out.push('</svg>');
  return { text: out.join('\n'), width: w, height: h };
}

// ---- Mermaid export ----

/**
 * Mermaid erDiagram names must look like `[A-Za-z_][A-Za-z0-9_-]*`, and types allow `()[]` too.
 * Anything else becomes `_`; clashes get a numeric suffix. Renamed attributes keep the original
 * name in their comment string, where `"` is written as Mermaid's `#quot;` entity.
 */
const mermaidWord = (s: string, extra = '') => {
  const w = s.replace(new RegExp(`[^A-Za-z0-9_${extra}]`, 'g'), '_');
  return /^[A-Za-z_]/.test(w) ? w : `_${w}`;
};
// oxlint-disable-next-line no-control-regex -- control characters would break the quoted string
const mermaidString = (s: string) => s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/"/g, '#quot;');

function uniqueName(base: string, used: Set<string>) {
  let name = base;
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base}_${i}`;
  used.add(name.toLowerCase());
  return name;
}

export interface MermaidResult {
  text: string;
  /** How many table or column names had to change to be valid Mermaid. */
  renamed: number;
}

export function toMermaid(s: ParsedSchema): MermaidResult {
  const lines = ['erDiagram'];
  const used = new Set<string>();
  const entity = new Map<string, string>();
  let renamed = 0;
  for (const t of s.tables) {
    const label = tableLabel(t);
    const name = uniqueName(mermaidWord(label, '-'), used);
    if (name !== label) renamed++;
    entity.set(t.id, name);
  }
  for (const t of s.tables) {
    lines.push(`  ${entity.get(t.id)} {`);
    const usedCols = new Set<string>();
    for (const c of t.columns) {
      const name = uniqueName(mermaidWord(c.name, '-'), usedCols);
      const type = mermaidWord(c.type.replace(/\s+/g, '_'), '\\-\\[\\]\\(\\)');
      const keys = [
        c.primaryKey && 'PK',
        s.foreignKeys.some((fk) => fk.fromTable === t.id && fk.fromColumns.includes(c.name)) && 'FK',
        c.unique && !c.primaryKey && 'UK',
      ].filter(Boolean);
      if (name !== c.name) renamed++;
      lines.push(`    ${type} ${name}${keys.length ? ` ${keys.join(', ')}` : ''}${name !== c.name ? ` "${mermaidString(c.name)}"` : ''}`);
    }
    lines.push('  }');
  }
  const tableById = new Map(s.tables.map((t) => [t.id, t]));
  for (const fk of s.foreignKeys) {
    const child = tableById.get(fk.fromTable)!;
    const cols = fk.fromColumns.map((n) => child.columns.find((c) => c.name === n)!);
    const optional = cols.some((c) => !c.notNull);
    const oneToOne =
      (child.primaryKey.length === fk.fromColumns.length && child.primaryKey.every((n) => fk.fromColumns.includes(n))) ||
      child.uniques.some((u) => u.length === fk.fromColumns.length && u.every((n) => fk.fromColumns.includes(n)));
    const cardinality = `${optional ? '|o' : '||'}--${oneToOne ? 'o|' : 'o{'}`;
    const label = fk.name ?? fk.fromColumns.join(', ');
    lines.push(`  ${entity.get(fk.toTable)} ${cardinality} ${entity.get(fk.fromTable)} : "${mermaidString(label)}"`);
  }
  return { text: `${lines.join('\n')}\n`, renamed };
}
