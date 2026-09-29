// Parsers for structured header values: directives, CSP, cookies, HSTS, media types.

export interface Directive {
  name: string;
  value?: string;
}

/** Splits on commas that are not inside double quotes. */
export function splitList(value: string, sep = ','): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (const ch of value) {
    if (ch === '"') quoted = !quoted;
    if (ch === sep && !quoted) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

const unquote = (s: string) => (s.length >= 2 && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s);

/** "public, max-age=300" → [{name:'public'},{name:'max-age',value:'300'}] (names lower-cased). */
export function parseDirectives(value: string, sep = ','): Directive[] {
  return splitList(value, sep).map((part) => {
    const i = part.indexOf('=');
    if (i < 0) return { name: part.toLowerCase() };
    return { name: part.slice(0, i).trim().toLowerCase(), value: unquote(part.slice(i + 1).trim()) };
  });
}

export const directive = (list: Directive[], name: string) => list.find((d) => d.name === name);

/** Seconds as "5 minutes", "1 year"… */
export function humanDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'forever';
  const units: [number, string][] = [
    [31_536_000, 'year'],
    [86_400, 'day'],
    [3_600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];
  if (seconds <= 0) return '0 seconds';
  for (const [n, name] of units) {
    if (seconds >= n) {
      const v = Math.round((seconds / n) * 10) / 10;
      return `${v} ${name}${v === 1 ? '' : 's'}`;
    }
  }
  return `${seconds} seconds`;
}

const CACHE_DIRECTIVES: Record<string, string> = {
  'max-age': 'Fresh for this many seconds',
  's-maxage': 'Fresh in shared caches (CDNs) for this many seconds',
  public: 'Any cache may store it, even for authenticated requests',
  private: 'Only the browser may store it, not shared caches',
  'no-cache': 'May be stored, but must be revalidated before every use',
  'no-store': 'Must not be stored anywhere',
  'must-revalidate': 'Once stale, must be revalidated (no serving stale)',
  'proxy-revalidate': 'Like must-revalidate, for shared caches only',
  immutable: "Won't change while fresh: skip revalidation on reload",
  'stale-while-revalidate': 'May serve stale for this many seconds while refetching in the background',
  'stale-if-error': 'May serve stale for this many seconds if the origin errors',
  'no-transform': 'Proxies must not modify the body (e.g. recompress images)',
  'must-understand': 'Only cache if the status code is understood',
  'only-if-cached': 'Request: only answer from cache',
  'max-stale': 'Request: accept stale responses',
  'min-fresh': 'Request: want responses fresh for at least this long',
};

export type Row = [string, string];

export function describeCacheControl(value: string): Row[] {
  return parseDirectives(value).map((d) => {
    const base = CACHE_DIRECTIVES[d.name] ?? 'Unknown directive';
    const n = d.value !== undefined ? Number(d.value) : NaN;
    const extra = d.value !== undefined ? (Number.isFinite(n) ? ` (${humanDuration(n)})` : ` (${d.value})`) : '';
    return [d.value !== undefined ? `${d.name}=${d.value}` : d.name, base + extra];
  });
}

// ---------- CSP ----------

export interface CspDirective {
  name: string;
  sources: string[];
}

export function parseCsp(value: string): CspDirective[] {
  const seen = new Set<string>();
  const out: CspDirective[] = [];
  for (const part of value.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (!name) continue;
    const n = name.toLowerCase();
    if (seen.has(n)) continue; // browsers ignore repeated directives
    seen.add(n);
    out.push({ name: n, sources });
  }
  return out;
}

// ---------- Set-Cookie ----------

export interface Cookie {
  name: string;
  value: string;
  attributes: Record<string, string | true>;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  /** Max-Age seconds, or undefined. */
  maxAge?: number;
  expires?: string;
  domain?: string;
  path?: string;
  partitioned: boolean;
}

export function parseSetCookie(value: string): Cookie {
  const [pair, ...attrs] = value.split(';');
  const eq = pair.indexOf('=');
  const name = eq < 0 ? '' : pair.slice(0, eq).trim();
  const val = eq < 0 ? pair.trim() : pair.slice(eq + 1).trim();
  const attributes: Record<string, string | true> = {};
  for (const a of attrs) {
    const i = a.indexOf('=');
    const k = (i < 0 ? a : a.slice(0, i)).trim().toLowerCase();
    if (!k) continue;
    attributes[k] = i < 0 ? true : a.slice(i + 1).trim();
  }
  const str = (k: string) => (typeof attributes[k] === 'string' ? (attributes[k] as string) : undefined);
  const ma = str('max-age');
  return {
    name,
    value: val,
    attributes,
    secure: 'secure' in attributes,
    httpOnly: 'httponly' in attributes,
    sameSite: str('samesite'),
    maxAge: ma !== undefined && /^-?\d+$/.test(ma) ? Number(ma) : undefined,
    expires: str('expires'),
    domain: str('domain'),
    path: str('path'),
    partitioned: 'partitioned' in attributes,
  };
}

export function describeCookie(c: Cookie): Row[] {
  const rows: Row[] = [['Cookie', `${c.name || '(no name)'} = ${c.value.length > 40 ? `${c.value.slice(0, 40)}…` : c.value}`]];
  rows.push(['Lifetime', c.maxAge !== undefined ? (c.maxAge <= 0 ? 'Deleted immediately' : humanDuration(c.maxAge)) : c.expires ? `Until ${c.expires}` : 'Session (until the browser closes)']);
  rows.push(['Secure', c.secure ? 'Yes: HTTPS only' : 'No: also sent over plain HTTP']);
  rows.push(['HttpOnly', c.httpOnly ? 'Yes: hidden from JavaScript' : 'No: readable by JavaScript']);
  rows.push(['SameSite', c.sameSite ?? 'Not set (browsers default to Lax)']);
  if (c.domain) rows.push(['Domain', `${c.domain} (and its subdomains)`]);
  if (c.path) rows.push(['Path', c.path]);
  if (c.partitioned) rows.push(['Partitioned', 'Yes: CHIPS, stored per top-level site']);
  return rows;
}

// ---------- HSTS, media type, misc ----------

export function parseHsts(value: string): { maxAge: number | null; includeSubDomains: boolean; preload: boolean } {
  const d = parseDirectives(value, ';');
  const ma = directive(d, 'max-age')?.value;
  return {
    maxAge: ma !== undefined && /^\d+$/.test(ma) ? Number(ma) : null,
    includeSubDomains: !!directive(d, 'includesubdomains'),
    preload: !!directive(d, 'preload'),
  };
}

export function parseMediaType(value: string): { type: string; params: Record<string, string> } {
  const [type, ...rest] = value.split(';');
  const params: Record<string, string> = {};
  for (const p of rest) {
    const i = p.indexOf('=');
    if (i > 0) params[p.slice(0, i).trim().toLowerCase()] = unquote(p.slice(i + 1).trim());
  }
  return { type: type.trim().toLowerCase(), params };
}

/** Structured rows for a header's value, or null when there's nothing to add. */
export function describeValue(name: string, value: string): Row[] | null {
  switch (name.toLowerCase()) {
    case 'cache-control':
      return describeCacheControl(value);
    case 'content-security-policy':
    case 'content-security-policy-report-only':
      return parseCsp(value).map((d) => [d.name, d.sources.join(' ') || '(no sources)']);
    case 'set-cookie':
      return describeCookie(parseSetCookie(value));
    case 'strict-transport-security': {
      const h = parseHsts(value);
      return [
        ['max-age', h.maxAge === null ? 'Missing or invalid' : `${h.maxAge} seconds (${Math.round(h.maxAge / 86400)} days)`],
        ['includeSubDomains', h.includeSubDomains ? 'Yes' : 'No'],
        ['preload', h.preload ? 'Yes (asks to be in browser preload lists)' : 'No'],
      ];
    }
    case 'content-type': {
      const m = parseMediaType(value);
      return [['Media type', m.type], ...Object.entries(m.params).map(([k, v]): Row => [k, v])];
    }
    case 'permissions-policy':
      return splitList(value).map((p): Row => {
        const i = p.indexOf('=');
        const feature = i < 0 ? p : p.slice(0, i);
        const allow = i < 0 ? '' : p.slice(i + 1).trim();
        return [feature.trim(), allow === '()' ? 'Disabled everywhere' : allow === '*' ? 'Allowed everywhere' : allow || '?'];
      });
    case 'vary':
    case 'access-control-allow-methods':
    case 'access-control-allow-headers':
    case 'access-control-expose-headers':
    case 'allow':
      return null;
    case 'age':
    case 'access-control-max-age':
    case 'retry-after':
      return /^\d+$/.test(value.trim()) ? [['Duration', humanDuration(Number(value))]] : null;
    case 'content-length':
      return /^\d+$/.test(value.trim()) ? [['Size', `${Number(value).toLocaleString('en-US')} bytes`]] : null;
    default:
      return null;
  }
}
