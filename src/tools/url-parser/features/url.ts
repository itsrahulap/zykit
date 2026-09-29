// URL parsing helpers built on the WHATWG URL API. Pure logic, no network.

export type ParseResult = { ok: true; url: URL; relative: boolean } | { ok: false; error: string };

export const MAX_URL_CHARS = 100_000;

export function parseUrl(input: string, base = ''): ParseResult {
  const s = input.trim();
  if (!s) return { ok: false, error: 'Enter a URL.' };
  if (s.length > MAX_URL_CHARS) return { ok: false, error: 'That URL is too long to parse here.' };
  try {
    return { ok: true, url: new URL(s), relative: false };
  } catch {
    // fall through to relative parsing
  }
  const b = base.trim();
  if (!b) {
    const looksRelative = /^([./?#]|[\w.-]+\/)/.test(s) || !/^[a-z][a-z\d+.-]*:/i.test(s);
    return {
      ok: false,
      error: looksRelative
        ? 'This looks like a relative URL (no scheme such as https://). Add a base URL to resolve it.'
        : 'This is not a valid URL.',
    };
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(b);
  } catch {
    return {
      ok: false,
      error: 'The base URL is not valid. It needs a scheme, e.g. https://example.com/.',
    };
  }
  try {
    return { ok: true, url: new URL(s, baseUrl), relative: true };
  } catch {
    return {
      ok: false,
      error: 'This is not a valid URL, even relative to the base.',
    };
  }
}

const DEFAULT_PORTS: Record<string, string> = {
  'http:': '80',
  'https:': '443',
  'ws:': '80',
  'wss:': '443',
  'ftp:': '21',
};

export function defaultPort(protocol: string): string | undefined {
  return DEFAULT_PORTS[protocol];
}

export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Decoded path segments ("/a/b%20c/" → ["a", "b c", ""]). Opaque paths (mailto:) give one segment. */
export function pathSegments(url: URL): string[] {
  const p = url.pathname;
  if (!p.startsWith('/')) return p ? [safeDecode(p)] : [];
  if (p === '/') return [];
  return p.slice(1).split('/').map(safeDecode);
}

export interface ParamRow {
  id: number;
  key: string;
  value: string;
}

export function paramRows(url: URL, startId = 0): ParamRow[] {
  return Array.from(url.searchParams, ([key, value], i) => ({
    id: startId + i,
    key,
    value,
  }));
}

/** URL with its query rebuilt from `rows` (order and duplicates kept). */
export function rebuild(url: URL, rows: ParamRow[]): string {
  const u = new URL(url.href);
  const sp = new URLSearchParams();
  for (const r of rows) if (r.key || r.value) sp.append(r.key, r.value);
  u.search = sp.toString();
  return u.href;
}

// ---- Punycode (RFC 3492) decoding, to show internationalised host names in Unicode ----

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;

function adapt(delta: number, numPoints: number, first: boolean): number {
  let d = first ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

function digit(c: number): number {
  if (c >= 48 && c < 58) return c - 22;
  if (c >= 65 && c < 91) return c - 65;
  if (c >= 97 && c < 123) return c - 97;
  return BASE;
}

export function punycodeDecode(input: string): string {
  const out: number[] = [];
  let i = 0;
  let n = 128;
  let bias = 72;
  const basic = input.lastIndexOf('-');
  for (let j = 0; j < Math.max(basic, 0); j++) out.push(input.charCodeAt(j));
  for (let idx = basic > 0 ? basic + 1 : 0; idx < input.length;) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (idx >= input.length) throw new Error('Invalid punycode');
      const d = digit(input.charCodeAt(idx++));
      if (d >= BASE) throw new Error('Invalid punycode');
      i += d * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (d < t) break;
      w *= BASE - t;
    }
    bias = adapt(i - oldi, out.length + 1, oldi === 0);
    n += Math.floor(i / (out.length + 1));
    i %= out.length + 1;
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}

/** "xn--mnchen-3ya.de" → "münchen.de". Labels that fail to decode are left as they are. */
export function hostToUnicode(host: string): string {
  return host
    .split('.')
    .map((label) => {
      if (!/^xn--/i.test(label)) return label;
      try {
        return punycodeDecode(label.slice(4).toLowerCase());
      } catch {
        return label;
      }
    })
    .join('.');
}
