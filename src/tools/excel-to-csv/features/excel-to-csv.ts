// Minimal .xlsx reader: workbook → sheets → rows of display strings. Reuses the Office cleaner's ZIP reader
// and the XML ↔ JSON tool's parser (no entity expansion), so nothing here touches the DOM.

import { openZip, readText, ZipError } from '../../office-metadata-cleaner/features/zip-archive';
import { parseXml, type XmlNode } from '../../xml-json/features/xml';

export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_CELLS = 5_000_000;

export interface Sheet {
  name: string;
  hidden: boolean;
  rows: string[][];
}

export class ExcelError extends Error {}

type El = Extract<XmlNode, { type: 'element' }>;
const local = (name: string) => name.slice(name.indexOf(':') + 1);
const kids = (e: El, name?: string) => e.children.filter((c): c is El => c.type === 'element' && (!name || local(c.name) === name));
const kid = (e: El, name: string) => kids(e, name)[0];
const attr = (e: El, name: string) => e.attrs.find(([k]) => k === name || local(k) === name)?.[1];
const text = (n: XmlNode): string => (n.type === 'text' ? n.value : n.type === 'element' ? n.children.map(text).join('') : '');

function xml(src: string | null, part: string): El | null {
  if (src === null) return null;
  const r = parseXml(src);
  if (!r.ok) throw new ExcelError(`${part} is not valid XML: ${r.error.message}`);
  return r.doc.root;
}

/** "BC12" → [11, 54] (zero-based row, column). */
export function cellRef(ref: string): [number, number] | null {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64;
  return [Number(m[2]) - 1, col - 1];
}

// Built-in Excel number formats that are dates/times.
const DATE_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
export function isDateFormat(code: string): boolean {
  const bare = code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
  return /[dmyhs]/i.test(bare) && !/^general$/i.test(bare.trim());
}

/** Excel serial date → ISO string (time shown only when there is one). */
export function serialToIso(serial: number, date1904 = false): string {
  const ms = Math.round((serial + (date1904 ? 1462 : 0)) * 86_400_000) + Date.UTC(1899, 11, 30);
  const iso = new Date(ms).toISOString();
  return serial % 1 === 0 ? iso.slice(0, 10) : iso.slice(0, 19);
}

export async function readWorkbook(bytes: Uint8Array): Promise<Sheet[]> {
  if (bytes.length > MAX_FILE_BYTES) throw new ExcelError('The file is larger than 100 MB.');
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0)
    throw new ExcelError('This is a legacy .xls file or a password-protected workbook. Save it as .xlsx (without a password) and try again.');
  let zip;
  try {
    zip = openZip(bytes);
  } catch (e) {
    throw new ExcelError(e instanceof ZipError ? `Not a readable .xlsx file (${e.message}).` : 'Not a readable .xlsx file.');
  }
  const wb = xml(await readText(zip, 'xl/workbook.xml'), 'workbook.xml');
  if (!wb) throw new ExcelError('No xl/workbook.xml found. Is this an Excel .xlsx file?');
  const rels = xml(await readText(zip, 'xl/_rels/workbook.xml.rels'), 'workbook.xml.rels');
  const targets = new Map((rels ? kids(rels, 'Relationship') : []).map((r) => [attr(r, 'Id'), attr(r, 'Target') ?? '']));
  const date1904 = ['1', 'true'].includes(attr(kid(wb, 'workbookPr') ?? wb, 'date1904') ?? '');

  const sst = xml(await readText(zip, 'xl/sharedStrings.xml'), 'sharedStrings.xml');
  // Rich-text runs are joined; phonetic (rPh) guides are skipped.
  const strings = sst ? kids(sst, 'si').map((si) => kids(si).filter((c) => local(c.name) !== 'rPh').map(text).join('')) : [];

  const styles = xml(await readText(zip, 'xl/styles.xml'), 'styles.xml');
  const custom = new Map((styles && kid(styles, 'numFmts') ? kids(kid(styles, 'numFmts'), 'numFmt') : []).map((f) => [Number(attr(f, 'numFmtId')), attr(f, 'formatCode') ?? '']));
  const xfDate = (styles && kid(styles, 'cellXfs') ? kids(kid(styles, 'cellXfs'), 'xf') : []).map((xf) => {
    const id = Number(attr(xf, 'numFmtId') ?? 0);
    return DATE_IDS.has(id) || (custom.has(id) && isDateFormat(custom.get(id)!));
  });

  const sheets: Sheet[] = [];
  let cells = 0;
  for (const s of kids(kid(wb, 'sheets') ?? wb, 'sheet')) {
    const target = targets.get(attr(s, 'id')) ?? '';
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    const ws = xml(await readText(zip, path), path);
    const grid: string[][] = [];
    const data = ws && kid(ws, 'sheetData');
    for (const row of data ? kids(data, 'row') : []) {
      let next = 0;
      for (const c of kids(row, 'c')) {
        if (++cells > MAX_CELLS) throw new ExcelError('The workbook has more than 5 million cells.');
        const pos = cellRef(attr(c, 'r') ?? '');
        const r = pos ? pos[0] : Number(attr(row, 'r') ?? grid.length + 1) - 1;
        const col = pos ? pos[1] : next;
        next = col + 1;
        const t = attr(c, 't');
        const v = kid(c, 'v') ? text(kid(c, 'v')) : '';
        let out = v;
        if (t === 's') out = strings[Number(v)] ?? '';
        else if (t === 'inlineStr') out = kid(c, 'is') ? text(kid(c, 'is')) : '';
        else if (t === 'b') out = v === '1' ? 'TRUE' : 'FALSE';
        else if (!t || t === 'n') {
          const n = Number(v);
          if (v !== '' && Number.isFinite(n) && xfDate[Number(attr(c, 's') ?? 0)]) out = serialToIso(n, date1904);
        }
        (grid[r] ??= [])[col] = out;
      }
    }
    sheets.push({ name: attr(s, 'name') ?? `Sheet${sheets.length + 1}`, hidden: !!attr(s, 'state') && attr(s, 'state') !== 'visible', rows: tidy(grid, ws) });
  }
  return sheets;
}

/** Fill holes, copy merged-cell values into the whole merged range and drop trailing empty rows/columns. */
function tidy(grid: string[][], ws: El | null): string[][] {
  for (const m of ws && kid(ws, 'mergeCells') ? kids(kid(ws, 'mergeCells'), 'mergeCell') : []) {
    const [a, b] = (attr(m, 'ref') ?? '').split(':').map(cellRef);
    if (!a || !b) continue;
    const v = grid[a[0]]?.[a[1]] ?? '';
    for (let r = a[0]; r <= b[0]; r++) for (let c = a[1]; c <= b[1]; c++) (grid[r] ??= [])[c] = v;
  }
  let width = 0;
  const rows = Array.from({ length: grid.length }, (_, i) => {
    const row = Array.from({ length: grid[i]?.length ?? 0 }, (_, j) => grid[i][j] ?? '');
    while (row.length && row[row.length - 1] === '') row.pop();
    width = Math.max(width, row.length);
    return row;
  });
  while (rows.length && rows[rows.length - 1].length === 0) rows.pop();
  return rows.map((r) => [...r, ...Array<string>(width - r.length).fill('')]);
}

/** Rows → array of objects keyed by the first row (blank or duplicate headers get a column name). */
export function toObjects(rows: string[][]): Record<string, string>[] {
  const seen = new Map<string, number>();
  const keys = (rows[0] ?? []).map((h, i) => {
    const base = h.trim() || `column_${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  });
  return rows.slice(1).map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}
