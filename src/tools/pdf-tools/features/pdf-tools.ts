// Pure logic for PDF Merge & Split: page ranges, output names and page-size labels.
// No DOM and no pdf-lib, so it's cheap to import and unit-testable in Node.

/** Largest PDF the tool opens, and the total across files. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
/** Most pages one file may have (the page grid renders a tile per page). */
export const MAX_PAGES = 5000;

export type Rotation = 0 | 90 | 180 | 270;

/** Normalise any multiple of 90 to 0/90/180/270. */
export function normRotation(deg: number): Rotation {
  return ((((Math.round(deg / 90) * 90) % 360) + 360) % 360) as Rotation;
}

export class RangeSyntaxError extends Error {}

/**
 * Parse "1-3, 5, 8-" into groups of 0-based page indices, one group per comma-separated part.
 * Supports `n`, `a-b`, `a-` (to the end) and `-b` (from the start). Page numbers are 1-based.
 */
export function parseRanges(spec: string, pageCount: number): number[][] {
  const parts = spec
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) throw new RangeSyntaxError('Enter page ranges, for example 1-3, 5, 8-.');
  return parts.map((part) => {
    const m = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part) ?? /^(\d+)$/.exec(part);
    if (!m) throw new RangeSyntaxError(`"${part}" isn't a page or range. Use forms like 4, 1-3 or 8-.`);
    const isRange = part.includes('-') || part.includes('–');
    const a = m[1] ? Number(m[1]) : 1;
    const b = isRange ? (m[2] ? Number(m[2]) : pageCount) : a;
    if (isRange && !m[1] && !m[2]) throw new RangeSyntaxError(`"${part}" needs a start or an end page.`);
    for (const n of [a, b])
      if (n < 1 || n > pageCount) throw new RangeSyntaxError(`Page ${n} doesn't exist: this document has ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}.`);
    if (a > b) throw new RangeSyntaxError(`"${part}" goes backwards; write it as ${b}-${a}.`);
    return Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i);
  });
}

/** One group per page. */
export function everyPage(pageCount: number): number[][] {
  return Array.from({ length: pageCount }, (_, i) => [i]);
}

/** "report.pdf" → "report"; characters file systems reject become "-". */
export function baseName(fileName: string): string {
  const base = fileName
    .replace(/\.pdf$/i, '')
    // oxlint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.-]+|[.-]+$/g, '');
  return base || 'document';
}

/** 0-based indices → "1-3_5_8-10" (1-based, consecutive runs collapsed). */
export function rangeLabel(indices: readonly number[]): string {
  const out: string[] = [];
  for (let i = 0; i < indices.length; ) {
    let j = i;
    while (j + 1 < indices.length && indices[j + 1] === indices[j] + 1) j++;
    out.push(i === j ? `${indices[i] + 1}` : `${indices[i] + 1}-${indices[j] + 1}`);
    i = j + 1;
  }
  return out.join('_');
}

/** Name for one output of a split: "report-page-4.pdf" or "report-pages-1-3.pdf". */
export function splitName(base: string, group: readonly number[]): string {
  return group.length === 1 ? `${base}-page-${group[0] + 1}.pdf` : `${base}-pages-${rangeLabel(group)}.pdf`;
}

/** Output names for the other operations. */
export const outputNames = {
  merge: (bases: readonly string[]) => (bases.length ? `${bases[0]}-merged.pdf` : 'merged.pdf'),
  splitZip: (base: string) => `${base}-split.zip`,
  extract: (base: string, indices: readonly number[]) => `${base}-pages-${rangeLabel(indices)}.pdf`,
  edited: (base: string) => `${base}-edited.pdf`,
};

const SIZES: [string, number, number][] = [
  ['A3', 842, 1191],
  ['A4', 595, 842],
  ['A5', 420, 595],
  ['Letter', 612, 792],
  ['Legal', 612, 1008],
  ['Tabloid', 792, 1224],
];

/** "A4 portrait", "Letter landscape" or "210 × 99 mm" for a page size in points. */
export function pageSizeLabel(width: number, height: number): string {
  const [short, long] = width <= height ? [width, height] : [height, width];
  const orientation = width === height ? '' : width < height ? ' portrait' : ' landscape';
  const named = SIZES.find(([, w, h]) => Math.abs(w - short) <= 3 && Math.abs(h - long) <= 3);
  if (named) return `${named[0]}${orientation}`;
  const mm = (pt: number) => Math.round((pt * 25.4) / 72);
  return `${mm(width)} × ${mm(height)} mm`;
}

/** Move the item at `from` to `to` (both indices into the array). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = list.slice();
  if (from < 0 || from >= out.length || to < 0 || to >= out.length || from === to) return out;
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}
