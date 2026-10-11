// Pure logic for Duplicate File Finder: size grouping, candidate selection, duplicate groups and reports.
// No DOM, so it is unit-testable in Node.

export const MAX_FILE_BYTES = 2 * 1024 ** 3;
export const MAX_TOTAL_BYTES = 8 * 1024 ** 3;
export const MAX_FILES = 20_000;

export interface Entry {
  id: number;
  /** Relative path for folders and dropped folders, otherwise the file name. */
  path: string;
  size: number;
}

export interface Candidates {
  /** Files that share a size with another file and are small enough to hash. */
  toHash: Entry[];
  empty: number;
  tooLarge: Entry[];
  /** Candidates left out because hashing them would pass MAX_TOTAL_BYTES. */
  overBudget: Entry[];
}

export interface DupGroup {
  hash: string;
  size: number;
  paths: string[];
  /** Bytes freed by keeping one copy: size * (copies - 1). */
  wasted: number;
}

export function groupBySize(entries: Entry[]): Map<number, Entry[]> {
  const bySize = new Map<number, Entry[]>();
  for (const e of entries) bySize.set(e.size, [...(bySize.get(e.size) ?? []), e]);
  return bySize;
}

export function pickCandidates(entries: Entry[], maxFile = MAX_FILE_BYTES, maxTotal = MAX_TOTAL_BYTES): Candidates {
  const out: Candidates = { toHash: [], empty: 0, tooLarge: [], overBudget: [] };
  const nonEmpty = entries.filter((e) => e.size > 0);
  out.empty = entries.length - nonEmpty.length;
  let used = 0;
  // Smallest sizes first, so the byte budget covers as many groups as possible.
  const groups = [...groupBySize(nonEmpty)].filter(([, g]) => g.length > 1).sort((a, b) => a[0] - b[0]);
  for (const [size, g] of groups) {
    if (size > maxFile) out.tooLarge.push(...g);
    else if (used + size * g.length > maxTotal) out.overBudget.push(...g);
    else {
      used += size * g.length;
      out.toHash.push(...g);
    }
  }
  return out;
}

/** Groups hashed entries with equal size and hash; groups of one are dropped, biggest waste first. */
export function groupDuplicates(entries: Entry[], hashes: ReadonlyMap<number, string>): DupGroup[] {
  const by = new Map<string, Entry[]>();
  for (const e of entries) {
    const h = hashes.get(e.id);
    if (h) by.set(`${e.size}:${h}`, [...(by.get(`${e.size}:${h}`) ?? []), e]);
  }
  const groups: DupGroup[] = [];
  for (const g of by.values()) {
    if (g.length < 2) continue;
    groups.push({
      hash: hashes.get(g[0].id)!,
      size: g[0].size,
      paths: g.map((e) => e.path).sort((a, b) => a.localeCompare(b)),
      wasted: g[0].size * (g.length - 1),
    });
  }
  return groups.sort((a, b) => b.wasted - a.wasted || a.hash.localeCompare(b.hash));
}

export const totalWasted = (groups: DupGroup[]) => groups.reduce((n, g) => n + g.wasted, 0);

export function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

// A leading = + - @ makes spreadsheets run a cell as a formula, so those cells get a leading quote.
const cell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(groups: DupGroup[]): string {
  const rows = ['group,sha256,size_bytes,copies,wasted_bytes,path'];
  groups.forEach((g, i) => g.paths.forEach((p) => rows.push([i + 1, g.hash, g.size, g.paths.length, g.wasted, p].map(cell).join(','))));
  return rows.join('\r\n') + '\r\n';
}

export function toJson(groups: DupGroup[]): string {
  return JSON.stringify({ algorithm: 'SHA-256', wastedBytes: totalWasted(groups), groups }, null, 2);
}
