// Email header analysis: unfolding (RFC 5322 §2.2.3), encoded words (RFC 2047), Received hops
// (RFC 5321 §4.4), Authentication-Results (RFC 8601), ARC (RFC 8617), Received-SPF (RFC 7208 §9.1),
// DMARC-style alignment (RFC 7489 §3.1) and a list of phishing red flags. Pure functions, no I/O.

export interface Header {
  name: string;
  /** Unfolded raw value. */
  raw: string;
  /** Value with RFC 2047 encoded words decoded. */
  value: string;
  /** 0-based position in the header block (0 = top). */
  index: number;
}

// ---------- unfolding ----------

/** Splits a header block into fields, joining folded lines. Stops at the first blank line (the body). */
export function parseHeaders(rawInput: string): { headers: Header[]; skipped: string[] } {
  const lines = rawInput.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  const headers: Header[] = [];
  const skipped: string[] = [];
  let started = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!started && !line.trim()) continue;
    if (!started && /^From /.test(line)) {
      started = true; // mbox separator line
      continue;
    }
    if (started && !line.trim()) break;
    started = true;
    if (/^[ \t]/.test(line)) {
      const last = headers[headers.length - 1];
      if (last) last.raw += ' ' + line.trim();
      else skipped.push(line);
      continue;
    }
    const m = /^([!-9;-~]+)[ \t]*:[ \t]*(.*)$/.exec(line);
    if (m) headers.push({ name: m[1], raw: m[2].trim(), value: '', index: headers.length });
    else skipped.push(line);
  }
  for (const h of headers) h.value = decodeEncodedWords(h.raw);
  return { headers, skipped };
}

export const getAll = (hs: Header[], name: string) => hs.filter((h) => h.name.toLowerCase() === name.toLowerCase());
export const getFirst = (hs: Header[], name: string) => getAll(hs, name)[0];

// ---------- RFC 2047 ----------

function decodeCharset(bytes: Uint8Array, charset: string): string {
  const cs = charset.toLowerCase().replace(/\*.*$/, ''); // drop RFC 2231 language suffix
  try {
    return new TextDecoder(cs).decode(bytes);
  } catch {
    return new TextDecoder('latin1').decode(bytes);
  }
}

function base64Bytes(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, '');
  const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const c of clean) {
    buf = (buf << 6) | map.indexOf(c);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function qBytes(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '_') out.push(0x20);
    else if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
      out.push(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else out.push(c.charCodeAt(0) & 0xff);
  }
  return new Uint8Array(out);
}

const ENCODED_WORD = /=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g;

/** Decodes RFC 2047 encoded words. Whitespace between adjacent encoded words is dropped. */
export function decodeEncodedWords(s: string): string {
  if (!s.includes('=?')) return s;
  // Adjacent words with the same charset are concatenated as bytes first, so multi-byte
  // characters split across words decode correctly.
  const joined = s.replace(/(=\?[^?\s]+\?[BbQq]\?[^?\s]*\?=)\s+(?==\?[^?\s]+\?[BbQq]\?[^?\s]*\?=)/g, '$1');
  let out = '';
  let last = 0;
  const run: { charset: string; bytes: number[] }[] = [];
  const flush = () => {
    const p = run.pop();
    if (p) out += decodeCharset(new Uint8Array(p.bytes), p.charset);
  };
  for (const m of joined.matchAll(ENCODED_WORD)) {
    const start = m.index;
    if (start > last) {
      flush();
      out += joined.slice(last, start);
    }
    const [, charset, enc, text] = m;
    const bytes = enc.toUpperCase() === 'B' ? base64Bytes(text) : qBytes(text);
    if (run[0] && run[0].charset.toLowerCase() === charset.toLowerCase()) run[0].bytes.push(...bytes);
    else {
      flush();
      run.push({ charset, bytes: Array.from(bytes) });
    }
    last = start + m[0].length;
  }
  flush();
  return out + joined.slice(last);
}

// ---------- dates ----------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const ZONES: Record<string, number> = { UT: 0, UTC: 0, GMT: 0, Z: 0, EST: -300, EDT: -240, CST: -360, CDT: -300, MST: -420, MDT: -360, PST: -480, PDT: -420 };

/** Parses an RFC 5322 date (with obsolete forms and trailing comments). Returns ms since epoch or null. */
export function parseEmailDate(input: string): number | null {
  const s = input.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const m = /(?:[A-Za-z]{3},?\s*)?(\d{1,2})[\s-]+([A-Za-z]{3})[A-Za-z]*[\s-]+(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*([+-]\d{4}|[A-Za-z]{1,5})?/.exec(s);
  if (!m) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : t;
  }
  const mon = MONTHS.indexOf(m[2].toLowerCase());
  if (mon < 0) return null;
  let year = Number(m[3]);
  if (m[3].length <= 2) year += year < 50 ? 2000 : 1900;
  else if (m[3].length === 3) year += 1900;
  let offset = 0;
  const z = m[7];
  if (z && /^[+-]\d{4}$/.test(z)) offset = (z[0] === '-' ? -1 : 1) * (Number(z.slice(1, 3)) * 60 + Number(z.slice(3, 5)));
  else if (z) offset = ZONES[z.toUpperCase()] ?? 0;
  const utc = Date.UTC(year, mon, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  return utc - offset * 60_000;
}

// ---------- addresses and domains ----------

export interface Address {
  name: string;
  address: string;
  domain: string;
}

/** First mailbox in an address header: `"Name" <a@b>`, `a@b (Name)` or `<a@b>`. */
export function parseAddress(value: string): Address | null {
  // Look for <addr> outside quoted display names, which may themselves contain "<x@y>".
  const masked = value.replace(/"(?:[^"\\]|\\.)*"/g, (q) => '_'.repeat(q.length));
  const angle = /<\s*([^<>\s]*@[^<>\s]*)\s*>/.exec(masked);
  let address: string;
  let name = '';
  if (angle) {
    address = angle[1];
    name = value.slice(0, angle.index).trim();
  } else {
    const bare = /([^\s<>(),;:"]+@[^\s<>(),;:"]+)/.exec(value);
    if (!bare) return null;
    address = bare[1];
    const comment = /\(([^)]*)\)/.exec(value);
    if (comment) name = comment[1];
  }
  name = name.replace(/^"(.*)"$/, '$1').replace(/\\(.)/g, '$1').trim();
  return { name, address, domain: domainOf(address) };
}

export const domainOf = (addr: string) => (addr.split('@').pop() ?? '').replace(/[>.\s]+$/, '').toLowerCase();

// Common public-suffix pairs, for an approximate organizational domain (no full PSL offline).
const TWO_LEVEL = /\.(co|com|net|org|gov|ac|edu|ne|or|go)\.[a-z]{2}$/;

export function orgDomain(domain: string): string {
  const d = domain.toLowerCase().replace(/\.$/, '');
  const parts = d.split('.');
  if (parts.length <= 2) return d;
  return parts.slice(TWO_LEVEL.test(d) ? -3 : -2).join('.');
}

/** Relaxed alignment: same organizational domain. */
export const aligned = (a?: string, b?: string) => !!a && !!b && orgDomain(a) === orgDomain(b);

// ---------- Received ----------

export interface Hop {
  /** 1 = first hop (the bottom Received header). */
  number: number;
  raw: string;
  from?: string;
  by?: string;
  with?: string;
  id?: string;
  for?: string;
  via?: string;
  ip?: string;
  date?: number;
  /** Seconds since the previous hop; undefined for the first hop or when a date is missing. */
  delay?: number;
  skew: boolean;
}

/** Splits a value on ';' outside comments and quotes. */
function splitTopLevel(s: string, sep = ';'): string[] {
  const out: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      cur += c + s[++i];
      continue;
    }
    if (c === '"' && depth === 0) quoted = !quoted;
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')' && depth > 0) depth--;
    if (c === sep && depth === 0 && !quoted) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const RECEIVED_KEYS = ['from', 'by', 'via', 'with', 'id', 'for'] as const;

export function parseReceived(value: string, number = 0): Hop {
  const parts = splitTopLevel(value);
  const datePart = parts.length > 1 ? parts.pop()!.trim() : '';
  const body = parts.join(';');
  const fields: Partial<Record<(typeof RECEIVED_KEYS)[number], string>> = {};
  // Walk the body at comment depth 0 and cut it at the clause keywords.
  let depth = 0;
  let key: (typeof RECEIVED_KEYS)[number] | null = null;
  let cur = '';
  const save = () => {
    if (key && !fields[key]) fields[key] = cur.trim().replace(/\s+/g, ' ');
  };
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '(') depth++;
    if (c === ')' && depth > 0) depth--;
    if (depth === 0 && (i === 0 || /\s/.test(body[i - 1]))) {
      const k = RECEIVED_KEYS.find((w) => body.slice(i, i + w.length + 1).toLowerCase() === w + ' ' || body.slice(i, i + w.length + 1).toLowerCase() === w + '\t');
      if (k) {
        save();
        key = k;
        cur = '';
        i += k.length;
        continue;
      }
    }
    cur += c;
  }
  save();
  const ipSource = fields.from ?? '';
  const ip =
    /\[(?:IPv6:)?([0-9a-fA-F:.]+)\]/.exec(ipSource)?.[1] ??
    /\b((?:\d{1,3}\.){3}\d{1,3})\b/.exec(ipSource)?.[1] ??
    /\b([0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{0,4}){2,7})\b/.exec(ipSource)?.[1];
  const date = datePart ? parseEmailDate(datePart) ?? undefined : undefined;
  return { number, raw: value, ...fields, ip, date, skew: false };
}

/** Clock-skew tolerance: a hop may appear this many seconds before the previous one without a flag. */
export const SKEW_TOLERANCE = 60;

/** Hops in delivery order (bottom Received header first) with per-hop delays and skew flags. */
export function buildHops(headers: Header[]): Hop[] {
  const received = getAll(headers, 'Received').reverse();
  const hops = received.map((h, i) => parseReceived(h.value, i + 1));
  let prev: number | undefined;
  for (const hop of hops) {
    if (hop.date !== undefined && prev !== undefined) {
      hop.delay = Math.round((hop.date - prev) / 1000);
      hop.skew = hop.delay < -SKEW_TOLERANCE;
    }
    if (hop.date !== undefined) prev = hop.date;
  }
  return hops;
}

// ---------- authentication results ----------

export type Mechanism = 'spf' | 'dkim' | 'dmarc' | 'arc' | 'other';

export interface AuthResult {
  method: string;
  result: string;
  /** The domain this result is about (SPF mailfrom/helo, DKIM d=, DMARC header.from). */
  domain?: string;
  /** Extra details: selector, policy, client IP, reason… */
  props: Record<string, string>;
  comment?: string;
  /** Header it came from, e.g. "Authentication-Results" or "ARC-Authentication-Results i=1". */
  source: string;
  /** Who added it (authserv-id). */
  authserv?: string;
  /** Position of the source header (0 = top, most recent). */
  headerIndex: number;
}

function stripComments(s: string): { text: string; comments: string[] } {
  const comments: string[] = [];
  let depth = 0;
  let text = '';
  let cur = '';
  for (const c of s) {
    if (c === '(') {
      if (depth++ > 0) cur += c;
      continue;
    }
    if (c === ')' && depth > 0) {
      if (--depth === 0) {
        comments.push(cur.trim());
        cur = '';
        text += ' ';
      } else cur += c;
      continue;
    }
    if (depth) cur += c;
    else text += c;
  }
  return { text: text.replace(/\s+/g, ' ').trim(), comments };
}

const unq = (v: string) => v.replace(/^"(.*)"$/, '$1');

function domainFor(method: string, props: Record<string, string>): string | undefined {
  const pick = (...keys: string[]) => keys.map((k) => props[k]).find(Boolean);
  if (method === 'spf') {
    const v = pick('smtp.mailfrom', 'smtp.helo');
    return v ? domainOf(v) : undefined;
  }
  if (method === 'dkim' || method === 'arc') {
    const d = pick('header.d', 'header.i', 'header.oldest-pass');
    return d ? domainOf(d).replace(/^@/, '') : undefined;
  }
  if (method === 'dmarc') {
    const v = pick('header.from');
    return v ? domainOf(v) : undefined;
  }
  return undefined;
}

/** Parses one Authentication-Results (or ARC-Authentication-Results) value. */
export function parseAuthResults(value: string, source = 'Authentication-Results', headerIndex = 0): AuthResult[] {
  const parts = splitTopLevel(value).map((p) => p.trim()).filter(Boolean);
  let instance = '';
  if (parts[0] && /^i\s*=\s*\d+$/i.test(stripComments(parts[0]).text)) instance = stripComments(parts.shift()!).text.replace(/\s/g, '');
  // The authserv-id comes first, but Microsoft 365 omits it and starts straight with "spf=…".
  const authserv = parts.length && !/^[a-z0-9_-]+\s*=/i.test(stripComments(parts[0]).text) ? stripComments(parts.shift()!).text.split(/\s+/)[0] : undefined;
  const out: AuthResult[] = [];
  for (const part of parts) {
    const { text, comments } = stripComments(part);
    const m = /^([a-z0-9_-]+)\s*=\s*([a-z0-9_-]+)\s*(.*)$/i.exec(text);
    if (!m) continue;
    const method = m[1].toLowerCase();
    if (method === 'none') continue;
    const props: Record<string, string> = {};
    for (const pm of m[3].matchAll(/([a-z0-9_.-]+)\s*=\s*("(?:[^"\\]|\\.)*"|[^\s;]+)/gi)) props[pm[1].toLowerCase()] = unq(pm[2]);
    out.push({
      method,
      result: m[2].toLowerCase(),
      domain: domainFor(method, props),
      props,
      comment: comments.join('; ') || undefined,
      source: instance ? `${source} ${instance}` : source,
      authserv,
      headerIndex,
    });
  }
  return out;
}

/** Received-SPF: "Pass (comment) client-ip=…; envelope-from=…; helo=…". */
export function parseReceivedSpf(value: string, headerIndex = 0): AuthResult | null {
  const { text, comments } = stripComments(value);
  const m = /^([a-z]+)\b\s*(.*)$/i.exec(text);
  if (!m) return null;
  const props: Record<string, string> = {};
  for (const pm of m[2].matchAll(/([a-z0-9_.-]+)\s*=\s*("(?:[^"\\]|\\.)*"|[^\s;]+)/gi)) props[pm[1].toLowerCase()] = unq(pm[2]);
  let from = props['envelope-from'] ?? '';
  if (!from) from = /domain of\s+(\S+@\S+?|\S+?)\s+(?:designates|does not|is neither)/i.exec(comments.join(' '))?.[1] ?? '';
  const domain = (from ? domainOf(from.replace(/[<>]/g, '')) : '') || (props.helo ? props.helo.toLowerCase() : undefined);
  return { method: 'spf', result: m[1].toLowerCase(), domain, props, comment: comments.join('; ') || undefined, source: 'Received-SPF', headerIndex };
}

/** Tag list (DKIM-Signature, ARC-Seal …): "v=1; a=rsa-sha256; d=example.com; …". */
export function parseTags(value: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const part of value.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).replace(/\s+/g, '').trim();
  }
  return tags;
}

export interface DkimSignature {
  domain: string;
  selector: string;
  algorithm: string;
}

export interface ArcSet {
  instance: number;
  cv?: string;
  sealDomain?: string;
}

// ---------- the analysis ----------

export type Verdict = 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'temperror' | 'permerror' | 'policy' | 'missing' | string;

export interface MechanismSummary {
  result: Verdict;
  domain?: string;
  source?: string;
}

export interface RedFlag {
  level: 'high' | 'medium' | 'low';
  text: string;
}

export interface KeyHeader {
  name: string;
  value: string;
  note?: string;
  warn?: boolean;
}

export interface Analysis {
  headers: Header[];
  skipped: string[];
  hops: Hop[];
  /** Seconds from first to last dated hop. */
  totalDelay?: number;
  auth: AuthResult[];
  dkimSignatures: DkimSignature[];
  arc: ArcSet[];
  spf: MechanismSummary;
  dkim: MechanismSummary;
  dmarc: MechanismSummary;
  from: Address | null;
  replyTo: Address | null;
  returnPath: string;
  messageIdDomain: string;
  alignment: { spfDomain?: string; spfAligned: boolean; dkimDomains: string[]; dkimAligned: boolean };
  keyHeaders: KeyHeader[];
  flags: RedFlag[];
  subject: string;
  date?: number;
}

const BAD = new Set(['fail', 'softfail', 'permerror', 'temperror', 'hardfail']);

function summarise(results: AuthResult[], method: string): MechanismSummary {
  const list = results.filter((r) => r.method === method);
  if (!list.length) return { result: 'missing' };
  // Prefer the topmost header (added by the final receiving server); within it, a pass beats others.
  const top = Math.min(...list.map((r) => r.headerIndex));
  const own = list.filter((r) => r.headerIndex === top);
  const pick = own.find((r) => r.result === 'pass') ?? own[0];
  return { result: pick.result, domain: pick.domain, source: pick.source };
}

const isPrivateHost = (ip?: string) => !!ip && /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd][0-9a-f]{2}:)/i.test(ip);

export function analyzeHeaders(raw: string, now = Date.now()): Analysis {
  const { headers, skipped } = parseHeaders(raw);
  const hops = buildHops(headers);
  const dated = hops.filter((h) => h.date !== undefined);
  const totalDelay = dated.length >= 2 ? Math.round((dated[dated.length - 1].date! - dated[0].date!) / 1000) : undefined;

  const auth: AuthResult[] = [];
  for (const h of headers) {
    const n = h.name.toLowerCase();
    if (n === 'authentication-results') auth.push(...parseAuthResults(h.value, 'Authentication-Results', h.index));
    else if (n === 'arc-authentication-results') auth.push(...parseAuthResults(h.value, 'ARC-Authentication-Results', h.index));
    else if (n === 'received-spf') {
      const r = parseReceivedSpf(h.value, h.index);
      if (r) auth.push(r);
    }
  }
  // ARC-Authentication-Results are copies made by earlier hops; the summary uses Authentication-Results
  // and Received-SPF, falling back to ARC only when nothing else is present.
  // Lower Authentication-Results headers can be forged by the sender, so only the topmost
  // Authentication-Results (same authserv-id) and the topmost Received-SPF count.
  const ar = auth.filter((a) => a.source === 'Authentication-Results');
  const topAr = ar.length ? Math.min(...ar.map((a) => a.headerIndex)) : -1;
  const topServ = ar.find((a) => a.headerIndex === topAr)?.authserv;
  const spfHeaders = auth.filter((a) => a.source === 'Received-SPF');
  const topSpf = spfHeaders.length ? Math.min(...spfHeaders.map((a) => a.headerIndex)) : -1;
  const primary = auth.filter((a) =>
    a.source === 'Received-SPF' ? a.headerIndex === topSpf : a.source === 'Authentication-Results' && (a.headerIndex === topAr || (!!topServ && a.authserv === topServ)),
  );
  const basis = primary.length ? primary : auth;

  const dkimSignatures = getAll(headers, 'DKIM-Signature').map((h) => {
    const t = parseTags(h.raw);
    return { domain: (t.d ?? '').toLowerCase(), selector: t.s ?? '', algorithm: t.a ?? '' };
  });
  const arc = getAll(headers, 'ARC-Seal')
    .map((h) => {
      const t = parseTags(h.raw);
      return { instance: Number(t.i), cv: t.cv, sealDomain: t.d?.toLowerCase() };
    })
    .sort((a, b) => a.instance - b.instance);

  const spf = summarise(basis, 'spf');
  const dkim = summarise(basis, 'dkim');
  const dmarc = summarise(basis, 'dmarc');

  const fromH = getFirst(headers, 'From');
  const from = fromH ? parseAddress(fromH.value) : null;
  const replyToH = getFirst(headers, 'Reply-To');
  const replyTo = replyToH ? parseAddress(replyToH.value) : null;
  const returnPathRaw = getFirst(headers, 'Return-Path')?.value ?? '';
  const returnPath = parseAddress(returnPathRaw)?.address ?? (returnPathRaw.replace(/[<>\s]/g, '') || '');
  const msgId = getFirst(headers, 'Message-ID')?.value ?? '';
  const messageIdDomain = /@([^>\s]+)>?/.exec(msgId)?.[1]?.toLowerCase() ?? '';
  const subject = getFirst(headers, 'Subject')?.value ?? '';
  const dateH = getFirst(headers, 'Date');
  const date = dateH ? parseEmailDate(dateH.value) ?? undefined : undefined;

  const spfDomain = spf.domain ?? (returnPath ? domainOf(returnPath) : undefined);
  const dkimPass = basis.filter((r) => r.method === 'dkim' && r.result === 'pass' && r.domain).map((r) => r.domain!);
  const dkimDomains = [...new Set(dkimPass.length ? dkimPass : dkimSignatures.map((s) => s.domain).filter(Boolean))];
  const fromDomain = from?.domain;
  const alignment = {
    spfDomain,
    spfAligned: aligned(fromDomain, spfDomain) && spf.result === 'pass',
    dkimDomains,
    dkimAligned: dkimPass.some((d) => aligned(fromDomain, d)),
  };

  // ----- key headers -----
  const keyHeaders: KeyHeader[] = [];
  const add = (name: string, value: string | undefined, note?: string, warn?: boolean) => value && keyHeaders.push({ name, value, note, warn });
  add('From', fromH?.value);
  add('Sender', getFirst(headers, 'Sender')?.value);
  const replyMismatch = !!(replyTo && from && !aligned(replyTo.domain, from.domain));
  add('Reply-To', replyToH?.value, replyMismatch ? `Replies go to ${replyTo!.domain}, not ${from!.domain}.` : undefined, replyMismatch);
  const rpMismatch = !!(returnPath && fromDomain && !aligned(domainOf(returnPath), fromDomain));
  add('Return-Path', returnPathRaw, rpMismatch ? `Bounces go to ${domainOf(returnPath)} (normal for mailing services, suspicious otherwise).` : undefined, rpMismatch);
  add('To', getFirst(headers, 'To')?.value);
  add('Subject', subject);
  const dateNote = date === undefined && dateH ? 'Could not parse this date.' : date !== undefined && date > now + 15 * 60_000 ? 'This date is in the future.' : undefined;
  add('Date', dateH?.value, dateNote, !!dateNote);
  const midMismatch = !!(messageIdDomain && fromDomain && !aligned(messageIdDomain, fromDomain));
  add('Message-ID', msgId, messageIdDomain ? `Domain: ${messageIdDomain}${midMismatch ? ' (differs from the From domain)' : ''}` : undefined);
  add('X-Mailer', getFirst(headers, 'X-Mailer')?.value);
  add('User-Agent', getFirst(headers, 'User-Agent')?.value);
  add('List-Unsubscribe', getFirst(headers, 'List-Unsubscribe')?.value, getFirst(headers, 'List-Unsubscribe-Post') ? 'One-click unsubscribe (RFC 8058) supported.' : undefined);
  add('X-Originating-IP', getFirst(headers, 'X-Originating-IP')?.value);

  // ----- red flags -----
  const flags: RedFlag[] = [];
  const flag = (level: RedFlag['level'], text: string) => flags.push({ level, text });
  if (!headers.length) return { headers, skipped, hops, auth, dkimSignatures, arc, spf, dkim, dmarc, from, replyTo, returnPath, messageIdDomain, alignment, keyHeaders, flags, subject, date };

  if (!fromH) flag('high', 'There is no From header.');
  if (BAD.has(dmarc.result)) flag('high', `DMARC ${dmarc.result} for ${dmarc.domain ?? fromDomain ?? 'the sender'}: the receiving server could not confirm the From domain.`);
  if (BAD.has(spf.result)) flag(spf.result === 'softfail' ? 'medium' : 'high', `SPF ${spf.result}: the sending server is not authorised by ${spf.domain ?? 'the envelope sender domain'}.`);
  if (BAD.has(dkim.result)) flag('high', `DKIM ${dkim.result}${dkim.domain ? ` for ${dkim.domain}` : ''}: the signature didn’t verify, so the message may have been altered.`);
  if (spf.result === 'missing' && dkim.result === 'missing' && dmarc.result === 'missing')
    flag('medium', 'No SPF, DKIM or DMARC results were found. Paste the full headers from your mailbox, including Authentication-Results.');
  else if (fromDomain && !alignment.spfAligned && !alignment.dkimAligned && dmarc.result !== 'pass')
    flag('high', `Neither SPF nor DKIM passed for a domain aligned with the From domain (${fromDomain}).`);
  if (replyMismatch) flag('medium', `Reply-To (${replyTo!.address}) is on a different domain from From (${from!.address}).`);
  if (from?.name) {
    const shown = /[^\s<>"]+@[^\s<>"]+/.exec(from.name)?.[0];
    if (shown && shown.toLowerCase() !== from.address.toLowerCase()) flag('high', `The display name shows "${shown}", but the real sender is ${from.address}.`);
  }
  if (fromDomain && /(^|\.)xn--/.test(fromDomain)) flag('high', `The From domain ${fromDomain} uses Punycode (xn--) and may imitate another domain.`);
  if (rpMismatch && !alignment.dkimAligned) flag('low', `Return-Path domain (${domainOf(returnPath)}) differs from the From domain.`);
  if (midMismatch && !alignment.dkimAligned) flag('low', `Message-ID domain (${messageIdDomain}) differs from the From domain.`);
  if (!msgId) flag('low', 'There is no Message-ID header; legitimate mail servers almost always add one.');
  const skewed = hops.filter((h) => h.skew);
  if (skewed.length) flag('medium', `Clock skew: hop ${skewed.map((h) => h.number).join(', ')} is timestamped before the previous hop. One of the servers has a wrong clock, or headers were forged.`);
  if (date !== undefined && date > now + 15 * 60_000) flag('medium', 'The Date header is in the future.');
  if (date !== undefined && dated[0] && dated[0].date! - date > 24 * 3600_000) flag('low', 'The Date header is more than a day before the first Received hop.');
  if (date !== undefined && dated[0] && date - dated[0].date! > 15 * 60_000) flag('medium', 'The Date header is later than the first Received hop.');
  const firstPublic = hops.find((h) => h.ip && !isPrivateHost(h.ip));
  if (!hops.length) flag('low', 'There are no Received headers, so the route can’t be traced.');
  else if (!firstPublic) flag('low', 'No public sending IP address was found in the Received headers.');
  if (getAll(headers, 'Authentication-Results').length > 1) {
    const ids = [...new Set(getAll(headers, 'Authentication-Results').map((h) => parseAuthResults(h.value)[0]?.authserv).filter(Boolean))];
    if (ids.length > 1) flag('low', `Authentication-Results come from several servers (${ids.join(', ')}). Only trust the ones added by your own mail provider (the topmost).`);
  }
  if (arc.some((a) => a.cv === 'fail')) flag('medium', 'An ARC-Seal reports cv=fail: the forwarding chain is broken.');

  const order = { high: 0, medium: 1, low: 2 };
  flags.sort((a, b) => order[a.level] - order[b.level]);
  return { headers, skipped, hops, totalDelay, auth, dkimSignatures, arc, spf, dkim, dmarc, from, replyTo, returnPath, messageIdDomain, alignment, keyHeaders, flags, subject, date };
}

/** "3 s", "2 min 5 s", "1 h 4 min", "-12 s". */
export function formatDelay(sec: number): string {
  const sign = sec < 0 ? '-' : '';
  let s = Math.abs(sec);
  if (s < 60) return `${sign}${s} s`;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  if (h) return `${sign}${h} h${m ? ` ${m} min` : ''}`;
  return `${sign}${m} min${s ? ` ${s} s` : ''}`;
}
