// Standalone SVG built from the model (never from the live DOM). Every label is XML-escaped text
// inside <text>, so nothing a user typed or imported can become markup.

import { KIND_STYLE, KIND_LABELS, NODE_WIDTH, diagramBounds, edgeLine, nodeShape, nodeTextLayout, wrapLabel, type Diagram } from './model';

const PADDING = 32;

export const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Rough label width for the edge-label background (SVG can't measure text without a DOM). */
export const estimateTextWidth = (s: string, fontSize = 12) => Math.ceil(s.length * fontSize * 0.6);

export function toSvg(d: Diagram): { svg: string; width: number; height: number } {
  const b = diagramBounds(d) ?? { minX: 0, minY: 0, maxX: 200, maxY: 100 };
  const ox = b.minX - PADDING;
  const oy = b.minY - PADDING;
  const width = Math.ceil(b.maxX - b.minX + PADDING * 2);
  const height = Math.ceil(b.maxY - b.minY + PADDING * 2);
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${ox} ${oy} ${width} ${height}" font-family="system-ui, sans-serif">`,
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#475569"/></marker></defs>',
    `<rect x="${ox}" y="${oy}" width="${width}" height="${height}" fill="#ffffff"/>`,
  ];

  for (const g of d.groups) {
    out.push(
      `<rect x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}" rx="16" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="6 4"/>`,
      `<text x="${g.x + 12}" y="${g.y + 20}" font-size="13" font-weight="600" fill="#334155">${escapeXml(g.label)}</text>`,
    );
  }

  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  for (const e of d.edges) {
    const from = byId.get(e.from);
    const to = byId.get(e.to);
    if (!from || !to) continue;
    const { start, end, mid } = edgeLine(from, to);
    out.push(`<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#475569" stroke-width="1.5" marker-end="url(#arrow)"/>`);
    if (e.label) {
      const w = estimateTextWidth(e.label) + 10;
      out.push(
        `<rect x="${mid.x - w / 2}" y="${mid.y - 10}" width="${w}" height="20" rx="6" fill="#ffffff" stroke="#cbd5e1"/>`,
        `<text x="${mid.x}" y="${mid.y + 4}" font-size="12" text-anchor="middle" fill="#334155">${escapeXml(e.label)}</text>`,
      );
    }
  }

  for (const n of d.nodes) {
    const shape = nodeShape(n.kind);
    const style = KIND_STYLE[n.kind];
    const lines = wrapLabel(n.label);
    const layout = nodeTextLayout(lines.length);
    out.push(
      `<g transform="translate(${n.x} ${n.y})">`,
      `<path d="${shape.d}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.5"${shape.dashed ? ' stroke-dasharray="5 3"' : ''}/>`,
      `<text x="${NODE_WIDTH / 2}" y="${layout.captionY}" font-size="9" letter-spacing="1" text-anchor="middle" fill="${style.stroke}">${escapeXml(KIND_LABELS[n.kind].toUpperCase())}</text>`,
      ...lines.map((line, i) => `<text x="${NODE_WIDTH / 2}" y="${layout.lineY(i)}" font-size="13" font-weight="600" text-anchor="middle" fill="#0f172a">${escapeXml(line)}</text>`),
      '</g>',
    );
  }
  out.push('</svg>');
  return { svg: out.join('\n'), width, height };
}
