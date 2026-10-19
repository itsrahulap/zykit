// HAR (HTTP Archive) parsing: lean rows for the table, a summary, and per-entry detail on demand.

import { parseJsonText, type TextError } from '../../../shared/lib/textpos';

export const PHASES = ['blocked', 'dns', 'connect', 'ssl', 'send', 'wait', 'receive'] as const;
export type Phase = (typeof PHASES)[number];
export const MAX_PREVIEW = 100_000;

export interface HarRow {
  i: number;
  method: string;
  url: string;
  host: string;
  status: number;
  type: string;
  size: number;
  time: number;
  /** Milliseconds after the first request started. */
  start: number;
  phases: Record<Phase, number>;
  /** False when the HAR recorded no size (-1 or missing), so the UI shows "n/a" instead of 0. */
  sizeKnown: boolean;
  /** False when the HAR recorded no total time. */
  timeKnown: boolean;
}

export interface Group {
  name: string;
  count: number;
  size: number;
  time: number;
}

export interface HarSummary {
  requests: number;
  size: number;
  /** Wall-clock span from the first request start to the last end. */
  span: number;
  failed: number;
  slowest: HarRow[];
  byDomain: Group[];
  byType: Group[];
}

export interface HarDetail {
  requestHeaders: [string, string][];
  responseHeaders: [string, string][];
  query: [string, string][];
  postData: { mimeType: string; text: string } | null;
  preview: { text: string; note: string } | null;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const pairs = (v: unknown): [string, string][] => (Array.isArray(v) ? v.map((p) => [str(obj(p).name), str(obj(p).value)] as [string, string]) : []);

export function typeOf(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('html')) return 'html';
  if (m.includes('javascript') || m.includes('ecmascript')) return 'js';
  if (m.includes('css')) return 'css';
  if (m.includes('json')) return 'json';
  if (m.startsWith('image/')) return 'image';
  if (m.includes('font')) return 'font';
  if (m.startsWith('video/') || m.startsWith('audio/')) return 'media';
  if (m.includes('xml')) return 'xml';
  if (m.startsWith('text/')) return 'text';
  return 'other';
}

const isTextual = (mime: string) => /^text\/|json|xml|javascript|ecmascript|x-www-form-urlencoded|svg/i.test(mime);

export type HarParse = { ok: true; entries: unknown[]; doc: unknown } | { ok: false; error: TextError | { message: string } };

export function parseHar(text: string): HarParse {
  const parsed = parseJsonText(text);
  if (!parsed.ok) return parsed;
  const entries = obj(obj(parsed.value).log).entries;
  if (!Array.isArray(entries)) return { ok: false, error: { message: 'This is JSON, but not a HAR file: log.entries is missing.' } };
  return { ok: true, entries, doc: parsed.value };
}

export function buildRows(entries: unknown[]): HarRow[] {
  const starts = entries.map((e) => Date.parse(str(obj(e).startedDateTime)));
  const t0 = Math.min(...starts.filter((s) => !Number.isNaN(s)));
  return entries.map((e, i) => {
    const en = obj(e);
    const req = obj(en.request);
    const res = obj(en.response);
    const content = obj(res.content);
    const t = obj(en.timings);
    const url = str(req.url);
    let host = '';
    try {
      host = new URL(url).host;
    } catch {
      /* not a URL */
    }
    const time = Math.max(0, num(en.time));
    const known = (v: unknown) => typeof v === 'number' && v >= 0;
    const p = Object.fromEntries(PHASES.map((k) => [k, Math.max(0, num(t[k]))])) as Record<Phase, number>;
    p.connect = Math.max(0, p.connect - p.ssl); // HAR's connect includes ssl
    if (PHASES.every((k) => p[k] === 0)) p.wait = time;
    const transfer = num(en._transferSize);
    const body = num(res.bodySize);
    return {
      i,
      method: str(req.method) || '?',
      url,
      host,
      status: num(res.status),
      type: typeOf(str(content.mimeType)),
      size: transfer > 0 ? transfer : body > 0 ? body : Math.max(0, num(content.size)),
      time,
      start: Number.isNaN(starts[i]) ? 0 : starts[i] - t0,
      phases: p,
      sizeKnown: transfer > 0 || known(res.bodySize) || known(content.size),
      timeKnown: known(en.time),
    };
  });
}

const group = (rows: HarRow[], by: (r: HarRow) => string): Group[] => {
  const m = new Map<string, Group>();
  for (const r of rows) {
    const k = by(r) || '(none)';
    const g = m.get(k) ?? { name: k, count: 0, size: 0, time: 0 };
    g.count++;
    g.size += r.size;
    g.time += r.time;
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.count - a.count || b.size - a.size);
};

export function summarize(rows: HarRow[]): HarSummary {
  return {
    requests: rows.length,
    size: rows.reduce((s, r) => s + r.size, 0),
    span: rows.reduce((m, r) => Math.max(m, r.start + r.time), 0),
    failed: rows.filter((r) => r.status === 0 || r.status >= 400).length,
    slowest: [...rows].sort((a, b) => b.time - a.time).slice(0, 10),
    byDomain: group(rows, (r) => r.host).slice(0, 10),
    byType: group(rows, (r) => r.type),
  };
}

export function entryDetail(entry: unknown): HarDetail {
  const en = obj(entry);
  const req = obj(en.request);
  const res = obj(en.response);
  const content = obj(res.content);
  const post = obj(req.postData);
  const mime = str(content.mimeType);
  let preview: HarDetail['preview'] = null;
  const text = str(content.text);
  if (!text) preview = { text: '', note: 'No response body was saved in this HAR.' };
  else if (!isTextual(mime)) preview = { text: '', note: `Binary content (${mime || 'unknown type'}) is not shown.` };
  else {
    let t = text;
    if (str(content.encoding) === 'base64') {
      try {
        t = new TextDecoder().decode(Uint8Array.from(atob(text.slice(0, MAX_PREVIEW * 2)), (c) => c.charCodeAt(0)));
      } catch {
        t = '';
      }
    }
    preview = { text: t.slice(0, MAX_PREVIEW), note: t.length > MAX_PREVIEW ? `Showing the first ${MAX_PREVIEW.toLocaleString('en-US')} characters.` : '' };
  }
  return {
    requestHeaders: pairs(req.headers),
    responseHeaders: pairs(res.headers),
    query: pairs(req.queryString),
    postData: post.text !== undefined || post.mimeType !== undefined ? { mimeType: str(post.mimeType), text: str(post.text).slice(0, MAX_PREVIEW) } : null,
    preview,
  };
}

export type SortKey = 'i' | 'method' | 'url' | 'status' | 'type' | 'size' | 'time';
export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

/** Row positions matching `filter` (substring over method, URL, status, type), in sorted order. */
export function viewRows(rows: HarRow[], filter: string, sort: Sort | null): number[] {
  const f = filter.trim().toLowerCase();
  const idx: number[] = [];
  rows.forEach((r, k) => {
    if (!f || `${r.method} ${r.url} ${r.status} ${r.type}`.toLowerCase().includes(f)) idx.push(k);
  });
  if (sort) {
    const { key, dir } = sort;
    const m = dir === 'asc' ? 1 : -1;
    idx.sort((a, b) => {
      const x = rows[a][key];
      const y = rows[b][key];
      return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * m || a - b;
    });
  }
  return idx;
}

// ---------------------------------------------------------------------------------------------
// Sensitive values: hidden on screen by default and replaced in the redacted export.

export const REDACTED = '[REDACTED]';
const SENSITIVE_HEADER = /^(cookie|set-cookie|authorization|proxy-authorization)$|token|secret|api[-_]?key|session|csrf|xsrf|password|signature|auth/i;
const SENSITIVE_PARAM = /^(code|key|sig|state|nonce)$|token|secret|api[-_]?key|apikey|session|password|passwd|signature|auth|credential/i;

export const isSensitiveHeader = (name: string) => SENSITIVE_HEADER.test(name);
export const isSensitiveParam = (name: string) => SENSITIVE_PARAM.test(name);

const redactParams = (qs: string) =>
  qs
    .split('&')
    .map((part) => {
      const eq = part.indexOf('=');
      if (eq < 0) return part;
      let key = part.slice(0, eq);
      try {
        key = decodeURIComponent(key.replace(/\+/g, ' '));
      } catch {
        /* keep the raw key */
      }
      return isSensitiveParam(key) ? `${part.slice(0, eq)}=${REDACTED}` : part;
    })
    .join('&');

/** Replaces sensitive query/fragment parameter values and URL passwords; anything that isn't an absolute URL is returned as is. */
export function redactUrl(url: string): string {
  if (!/^[a-z][\w+.-]*:\/\//i.test(url)) return url;
  const hash = url.indexOf('#');
  let main = hash < 0 ? url : url.slice(0, hash);
  let frag = hash < 0 ? null : url.slice(hash + 1);
  main = main.replace(/^([a-z][\w+.-]*:\/\/[^/?#@:]*:)[^/?#@]*@/i, `$1${REDACTED}@`);
  const q = main.indexOf('?');
  if (q >= 0) main = main.slice(0, q + 1) + redactParams(main.slice(q + 1));
  if (frag !== null && frag.includes('=')) frag = redactParams(frag);
  return frag === null ? main : `${main}#${frag}`;
}

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * A copy of the HAR document with secrets replaced by `[REDACTED]`: sensitive headers, every cookie,
 * sensitive query parameters (also inside URLs, Referer, Location and Origin), URL passwords, and
 * all request bodies. With `bodies`, response bodies are removed too. The result is still valid HAR.
 */
export function redactHar(doc: unknown, bodies: boolean): string {
  const copy = structuredClone(doc);
  const log = obj(obj(copy).log);
  for (const pg of list(log.pages)) {
    const o = obj(pg);
    if (typeof o.title === 'string') o.title = redactUrl(o.title);
  }
  for (const e of list(log.entries)) {
    const en = obj(e);
    const req = obj(en.request);
    const res = obj(en.response);
    for (const h of [...list(req.headers), ...list(res.headers)]) {
      const o = obj(h);
      const name = str(o.name);
      if (isSensitiveHeader(name)) o.value = REDACTED;
      else if (/^(referer|location|origin|content-location)$/i.test(name) && typeof o.value === 'string') o.value = redactUrl(o.value);
    }
    for (const c of [...list(req.cookies), ...list(res.cookies)]) {
      const o = obj(c);
      if ('value' in o) o.value = REDACTED;
    }
    for (const p of list(req.queryString)) {
      const o = obj(p);
      if (isSensitiveParam(str(o.name))) o.value = REDACTED;
    }
    if (typeof req.url === 'string') req.url = redactUrl(req.url);
    if (typeof res.redirectURL === 'string') res.redirectURL = redactUrl(res.redirectURL);
    const post = obj(req.postData);
    if ('text' in post) post.text = REDACTED;
    for (const p of list(post.params)) {
      const o = obj(p);
      if ('value' in o) o.value = REDACTED;
    }
    if (bodies) {
      const content = obj(res.content);
      delete content.text;
      delete content.encoding;
    }
  }
  return JSON.stringify(copy, null, 2);
}
