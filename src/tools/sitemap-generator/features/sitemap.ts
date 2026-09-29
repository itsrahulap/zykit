// sitemap.xml generation, splitting and validation. Pure, no DOM.

export const CHANGEFREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'] as const;
export type ChangeFreq = (typeof CHANGEFREQS)[number];

export const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
export const MAX_URLS = 50_000;
export const MAX_BYTES = 50 * 1024 * 1024;

export interface Entry {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
}

export interface InputProblem {
  line: number;
  value: string;
  reason: string;
}

export interface ParsedList {
  entries: Entry[];
  problems: InputProblem[];
  duplicates: number;
  hosts: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

export function isW3cDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function normalizeUrl(s: string): string | null {
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.href;
  } catch {
    return null;
  }
}

/**
 * One URL per line, optionally followed by lastmod (YYYY-MM-DD), priority (0.0–1.0) and changefreq
 * in any order, separated by spaces, tabs or commas. With `extract`, URLs are pulled out of free text.
 */
export function parseUrlList(text: string, extract = false): ParsedList {
  const entries: Entry[] = [];
  const problems: InputProblem[] = [];
  const seen = new Set<string>();
  const hosts = new Set<string>();
  let duplicates = 0;
  const add = (e: Entry) => {
    if (seen.has(e.loc)) {
      duplicates++;
      return;
    }
    seen.add(e.loc);
    hosts.add(new URL(e.loc).host);
    entries.push(e);
  };

  if (extract) {
    for (const m of text.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
      const loc = normalizeUrl(m[0].replace(/[.,;:!?)\]]+$/, ''));
      if (loc) add({ loc });
    }
    return { entries, problems, duplicates, hosts: [...hosts] };
  }

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const [first, ...rest] = line.split(/[\s,]+/);
    const loc = normalizeUrl(first);
    if (!loc) {
      problems.push({ line: i + 1, value: first, reason: /^https?:\/\//i.test(first) ? 'Not a valid URL.' : 'Must be an absolute http(s) URL.' });
      return;
    }
    const e: Entry = { loc };
    for (const tok of rest) {
      const t = tok.toLowerCase();
      if (isW3cDate(tok)) e.lastmod = tok;
      else if ((CHANGEFREQS as readonly string[]).includes(t)) e.changefreq = t as ChangeFreq;
      else if (/^(0(\.\d+)?|1(\.0+)?)$/.test(tok)) e.priority = tok;
      else problems.push({ line: i + 1, value: tok, reason: 'Ignored: not a date, priority (0.0–1.0) or changefreq.' });
    }
    add(e);
  });
  return { entries, problems, duplicates, hosts: [...hosts] };
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export interface Defaults {
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
}

function entryXml(e: Entry, d: Defaults): string {
  const lastmod = e.lastmod ?? d.lastmod;
  const changefreq = e.changefreq ?? d.changefreq;
  const priority = e.priority ?? d.priority;
  let s = `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n`;
  if (lastmod) s += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
  if (changefreq) s += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) s += `    <priority>${priority}</priority>\n`;
  return `${s}  </url>\n`;
}

const HEAD = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NS}">\n`;
const TAIL = '</urlset>\n';

export interface SitemapFile {
  name: string;
  content: string;
  urls: number;
}

export interface BuildResult {
  files: SitemapFile[];
  index: SitemapFile | null;
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;

/** Build one sitemap, or several plus a sitemap index when the limits are exceeded. */
export function buildSitemaps(
  entries: Entry[],
  d: Defaults,
  opts: { baseUrl: string; maxUrls?: number; maxBytes?: number; lastmodIndex?: string } = { baseUrl: '' },
): BuildResult {
  const maxUrls = opts.maxUrls ?? MAX_URLS;
  const maxBytes = opts.maxBytes ?? MAX_BYTES;
  const chunks: { parts: string[]; bytes: number }[] = [];
  const fixed = byteLength(HEAD) + byteLength(TAIL);
  let cur = { parts: [] as string[], bytes: fixed };
  for (const e of entries) {
    const x = entryXml(e, d);
    const b = byteLength(x);
    if (cur.parts.length && (cur.parts.length >= maxUrls || cur.bytes + b > maxBytes)) {
      chunks.push(cur);
      cur = { parts: [], bytes: fixed };
    }
    cur.parts.push(x);
    cur.bytes += b;
  }
  chunks.push(cur);

  if (chunks.length === 1) return { files: [{ name: 'sitemap.xml', content: HEAD + chunks[0].parts.join('') + TAIL, urls: chunks[0].parts.length }], index: null };

  const files = chunks.map((c, i) => ({ name: `sitemap-${i + 1}.xml`, content: HEAD + c.parts.join('') + TAIL, urls: c.parts.length }));
  const base = opts.baseUrl.endsWith('/') ? opts.baseUrl : `${opts.baseUrl}/`;
  const body = files
    .map((f) => `  <sitemap>\n    <loc>${escapeXml(base + f.name)}</loc>\n${opts.lastmodIndex ? `    <lastmod>${escapeXml(opts.lastmodIndex)}</lastmod>\n` : ''}  </sitemap>\n`)
    .join('');
  const index = { name: 'sitemap-index.xml', content: `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${SITEMAP_NS}">\n${body}</sitemapindex>\n`, urls: files.length };
  return { files, index };
}

// ---------- Validation of an existing sitemap ----------

export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  text: string;
  line: number;
}

export class XmlError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.line = line;
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(s: string, lineOf: () => number): string {
  return s.replace(/&([^;&\s]*);?/g, (m, name: string) => {
    if (!m.endsWith(';')) throw new XmlError('Unescaped "&" (write &amp;).', lineOf());
    if (name in ENTITIES) return ENTITIES[name];
    const num = /^#x([0-9a-f]+)$/i.exec(name) ?? /^#(\d+)$/.exec(name);
    if (num) {
      const cp = parseInt(num[1], name[1] === 'x' || name[1] === 'X' ? 16 : 10);
      if (cp > 0x10ffff) throw new XmlError(`Invalid character reference &${name};`, lineOf());
      return String.fromCodePoint(cp);
    }
    throw new XmlError(`Unknown entity &${name};`, lineOf());
  });
}

/** Minimal well-formedness checking XML parser (no DTDs). Throws XmlError. */
export function parseXml(text: string): XmlElement {
  let i = 0;
  const n = text.length;
  const starts = [0];
  for (let k = text.indexOf('\n'); k >= 0; k = text.indexOf('\n', k + 1)) starts.push(k + 1);
  const lineAt = (pos: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const stack: XmlElement[] = [];
  let root: XmlElement | null = null;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  while (i < n) {
    const lt = text.indexOf('<', i);
    const chunk = lt < 0 ? text.slice(i) : text.slice(i, lt);
    if (chunk) {
      if (!stack.length) {
        if (chunk.trim()) throw new XmlError('Text outside the root element.', lineAt(i));
      } else {
        const start = i;
        stack[stack.length - 1].text += decodeEntities(chunk, () => lineAt(start));
      }
    }
    if (lt < 0) break;
    i = lt;
    if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i);
      if (end < 0) throw new XmlError('Unclosed processing instruction.', lineAt(i));
      if (text.startsWith('<?xml', i) && i > (text.charCodeAt(0) === 0xfeff ? 1 : 0)) throw new XmlError('The XML declaration must be at the very start.', lineAt(i));
      i = end + 2;
    } else if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i);
      if (end < 0) throw new XmlError('Unclosed comment.', lineAt(i));
      i = end + 3;
    } else if (text.startsWith('<![CDATA[', i)) {
      const end = text.indexOf(']]>', i);
      if (end < 0) throw new XmlError('Unclosed CDATA section.', lineAt(i));
      if (!stack.length) throw new XmlError('CDATA outside the root element.', lineAt(i));
      stack[stack.length - 1].text += text.slice(i + 9, end);
      i = end + 3;
    } else if (text.startsWith('<!', i)) {
      throw new XmlError('DOCTYPE and other declarations are not allowed in sitemaps.', lineAt(i));
    } else if (text.startsWith('</', i)) {
      const end = text.indexOf('>', i);
      if (end < 0) throw new XmlError('Unclosed end tag.', lineAt(i));
      const name = text.slice(i + 2, end).trim();
      const open = stack.pop();
      if (!open) throw new XmlError(`Unexpected </${name}>.`, lineAt(i));
      if (open.name !== name) throw new XmlError(`Expected </${open.name}> but found </${name}>.`, lineAt(i));
      i = end + 1;
    } else {
      const m = /^<([A-Za-z_][\w.:-]*)((?:\s+[A-Za-z_][\w.:-]*\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/.exec(text.slice(i, i + 4096));
      if (!m) throw new XmlError('Malformed tag.', lineAt(i));
      if (!stack.length && root) throw new XmlError('More than one root element.', lineAt(i));
      const attrs: Record<string, string> = {};
      const line = lineAt(i);
      for (const a of m[2].matchAll(/([A-Za-z_][\w.:-]*)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
        if (a[1] in attrs) throw new XmlError(`Duplicate attribute ${a[1]}.`, line);
        attrs[a[1]] = decodeEntities(a[3] ?? a[4] ?? '', () => line);
      }
      const el: XmlElement = { name: m[1], attrs, children: [], text: '', line };
      if (stack.length) stack[stack.length - 1].children.push(el);
      else root = el;
      if (!m[3]) stack.push(el);
      i += m[0].length;
    }
  }
  if (stack.length) throw new XmlError(`<${stack[stack.length - 1].name}> is never closed.`, stack[stack.length - 1].line);
  if (!root) throw new XmlError('No root element.', 1);
  return root;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  line?: number;
}

export interface Validation {
  kind: 'urlset' | 'sitemapindex' | null;
  count: number;
  issues: ValidationIssue[];
}

const local = (name: string) => name.slice(name.indexOf(':') + 1);

export function validateSitemap(text: string): Validation {
  const issues: ValidationIssue[] = [];
  let root: XmlElement;
  try {
    root = parseXml(text);
  } catch (e) {
    const err = e as XmlError;
    return { kind: null, count: 0, issues: [{ severity: 'error', message: `Not well-formed XML: ${err.message}`, line: err.line }] };
  }
  const rootName = local(root.name);
  if (rootName !== 'urlset' && rootName !== 'sitemapindex') {
    return { kind: null, count: 0, issues: [{ severity: 'error', message: `Root element is <${root.name}>; expected <urlset> or <sitemapindex>.`, line: root.line }] };
  }
  const kind = rootName;
  const prefix = root.name.includes(':') ? root.name.slice(0, root.name.indexOf(':')) : '';
  const ns = root.attrs[prefix ? `xmlns:${prefix}` : 'xmlns'];
  if (ns !== SITEMAP_NS) issues.push({ severity: 'error', message: `Missing or wrong namespace: xmlns should be "${SITEMAP_NS}".`, line: root.line });
  const itemName = kind === 'urlset' ? 'url' : 'sitemap';
  const items = root.children.filter((c) => local(c.name) === itemName);
  const seen = new Map<string, number>();
  const hosts = new Set<string>();
  for (const it of items) {
    const loc = it.children.find((c) => local(c.name) === 'loc');
    if (!loc) {
      issues.push({ severity: 'error', message: `<${itemName}> without <loc>.`, line: it.line });
      continue;
    }
    const v = loc.text.trim();
    if (!normalizeUrl(v)) issues.push({ severity: 'error', message: `Invalid URL in <loc>: ${v.slice(0, 200)}`, line: loc.line });
    else hosts.add(new URL(v).host);
    if (seen.has(v)) issues.push({ severity: 'warning', message: `Duplicate URL (first on line ${seen.get(v)}): ${v.slice(0, 200)}`, line: loc.line });
    else seen.set(v, loc.line);
    for (const c of it.children) {
      const name = local(c.name);
      const t = c.text.trim();
      if (name === 'lastmod' && !isW3cDate(t)) issues.push({ severity: 'warning', message: `lastmod "${t}" is not a W3C date (YYYY-MM-DD or full timestamp).`, line: c.line });
      if (name === 'changefreq' && !(CHANGEFREQS as readonly string[]).includes(t)) issues.push({ severity: 'warning', message: `changefreq "${t}" is not a valid value.`, line: c.line });
      if (name === 'priority' && !/^(0(\.\d+)?|1(\.0+)?)$/.test(t)) issues.push({ severity: 'warning', message: `priority "${t}" must be between 0.0 and 1.0.`, line: c.line });
    }
  }
  const other = root.children.filter((c) => local(c.name) !== itemName && !c.name.includes(':'));
  if (other.length) issues.push({ severity: 'warning', message: `Unexpected <${other[0].name}> inside <${root.name}>.`, line: other[0].line });
  if (items.length > MAX_URLS) issues.push({ severity: 'error', message: `${items.length.toLocaleString('en-US')} entries: the limit is 50,000 per file.` });
  if (byteLength(text) > MAX_BYTES) issues.push({ severity: 'error', message: 'File is larger than 50 MB uncompressed.' });
  if (!items.length) issues.push({ severity: 'warning', message: `No <${itemName}> entries.` });
  if (hosts.size > 1) issues.push({ severity: 'warning', message: `URLs span ${hosts.size} hosts; a sitemap should list URLs from its own host.` });
  return { kind, count: items.length, issues };
}
