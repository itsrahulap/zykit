// Parses raw HTTP headers pasted from curl -I / -v, DevTools or a raw HTTP message.

export interface Header {
  name: string;
  value: string;
  /** 1-based line where the header starts. */
  line: number;
}

export type StartLine =
  | { kind: 'response'; version: string; status: number; reason: string }
  | { kind: 'request'; method: string; target: string; version: string };

export interface ParsedHeaders {
  start: StartLine | null;
  headers: Header[];
  /** Lines that could not be understood. */
  invalid: { line: number; text: string }[];
  notices: string[];
  /** Best guess whether these are response or request headers. */
  kind: 'response' | 'request';
}

export const MAX_INPUT_CHARS = 512 * 1024;

const STATUS_LINE = /^(HTTP\/[\d.]+)\s+(\d{3})(?:\s+(.*))?$/i;
const REQUEST_LINE = /^([A-Z]+)\s+(\S+)\s+(HTTP\/[\d.]+)$/;
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

const REQUEST_ONLY = new Set(['host', 'user-agent', 'accept', 'accept-language', 'accept-encoding', 'cookie', 'referer', 'origin', 'authorization', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'if-none-match', 'if-modified-since']);
const RESPONSE_ONLY = new Set(['server', 'set-cookie', 'date', 'etag', 'last-modified', 'content-security-policy', 'strict-transport-security', 'x-powered-by', 'location', 'age', 'expires', 'vary']);

interface Block {
  start: StartLine | null;
  lines: { text: string; line: number }[];
}

export function parseHeaders(input: string): ParsedHeaders {
  const notices: string[] = [];
  let text = input;
  if (text.length > MAX_INPUT_CHARS) {
    text = text.slice(0, MAX_INPUT_CHARS);
    notices.push('The input is longer than 512 KB; only the start was read.');
  }
  // Split into messages at every status/request line (curl -IL prints one per redirect).
  const blocks: Block[] = [{ start: null, lines: [] }];
  const rows = text.split(/\r?\n/);
  let sawCurlPrefix = false;
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    // curl -v prefixes: "< " response, "> " request, "* " info.
    const m = row.match(/^([<>*])\s?(.*)$/);
    if (m) {
      sawCurlPrefix = true;
      if (m[1] === '*') continue;
      row = m[2];
    }
    const trimmed = row.trim();
    const status = trimmed.match(STATUS_LINE);
    const request = trimmed.match(REQUEST_LINE);
    if (status || request) {
      const start: StartLine = status
        ? { kind: 'response', version: status[1].toUpperCase(), status: Number(status[2]), reason: status[3]?.trim() ?? '' }
        : { kind: 'request', method: request![1], target: request![2], version: request![3] };
      const cur = blocks[blocks.length - 1];
      if (!cur.start && !cur.lines.some((l) => l.text.trim())) cur.start = start;
      else blocks.push({ start, lines: [] });
      continue;
    }
    blocks[blocks.length - 1].lines.push({ text: row, line: i + 1 });
  }

  // With curl -v both the request and the response are present: prefer the last response.
  const responses = blocks.filter((b) => b.start?.kind === 'response');
  let chosen = blocks[blocks.length - 1];
  if (responses.length) chosen = responses[responses.length - 1];
  const meaningful = blocks.filter((b) => b.start || b.lines.some((l) => l.text.trim()));
  if (responses.length > 1) notices.push(`Found ${responses.length} responses (redirects?). Showing the last one.`);
  else if (meaningful.length > 1 && sawCurlPrefix) notices.push('Found both request and response headers. Showing the response.');

  const headers: Header[] = [];
  const invalid: { line: number; text: string }[] = [];
  let pendingName: Header | null = null;
  let status: number | null = null;
  for (const { text: raw, line } of chosen.lines) {
    if (!raw.trim()) {
      pendingName = null;
      continue;
    }
    // Obsolete line folding: continuation of the previous value.
    if (/^[ \t]/.test(raw) && headers.length && !pendingName) {
      const prev = headers[headers.length - 1];
      prev.value = `${prev.value} ${raw.trim()}`.trim();
      continue;
    }
    const trimmed = raw.trim();
    // DevTools sometimes copies "name:" and the value on the next line.
    if (pendingName && !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+:(\s|$)/.test(trimmed) && !trimmed.startsWith(':')) {
      pendingName.value = trimmed;
      pendingName = null;
      continue;
    }
    pendingName = null;
    // HTTP/2 pseudo headers (":status: 200").
    const pseudo = trimmed.match(/^:([a-z]+):\s*(.*)$/i);
    if (pseudo) {
      if (pseudo[1].toLowerCase() === 'status' && /^\d{3}$/.test(pseudo[2])) status = Number(pseudo[2]);
      continue;
    }
    const idx = trimmed.indexOf(':');
    if (idx <= 0) {
      invalid.push({ line, text: trimmed });
      continue;
    }
    const name = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!TOKEN.test(name)) {
      invalid.push({ line, text: trimmed });
      continue;
    }
    const h: Header = { name, value, line };
    headers.push(h);
    if (!value) pendingName = h;
  }
  let start = chosen.start;
  if (!start && status !== null) start = { kind: 'response', version: 'HTTP/2', status, reason: '' };
  if (invalid.length) notices.push(`${invalid.length} line${invalid.length === 1 ? " wasn't" : "s weren't"} recognised as headers and ${invalid.length === 1 ? 'was' : 'were'} skipped.`);

  let kind: 'response' | 'request' = 'response';
  if (start) kind = start.kind;
  else {
    const names = headers.map((x) => x.name.toLowerCase());
    const req = names.filter((n) => REQUEST_ONLY.has(n)).length;
    const res = names.filter((n) => RESPONSE_ONLY.has(n)).length;
    if (req > res) kind = 'request';
  }
  return { start, headers, invalid, notices, kind };
}

/** Groups headers by lower-case name, preserving first-seen order. */
export function groupHeaders(headers: Header[]): Map<string, Header[]> {
  const m = new Map<string, Header[]>();
  for (const h of headers) {
    const k = h.name.toLowerCase();
    m.set(k, [...(m.get(k) ?? []), h]);
  }
  return m;
}

/** The combined value of a header (comma-joined), or undefined. */
export function headerValue(groups: Map<string, Header[]>, name: string): string | undefined {
  const g = groups.get(name.toLowerCase());
  return g?.map((h) => h.value).join(', ');
}

export const SAMPLE_HEADERS = `HTTP/2 200
date: Tue, 29 Sep 2026 10:00:00 GMT
content-type: text/html; charset=utf-8
content-length: 18342
cache-control: public, max-age=300, s-maxage=3600, stale-while-revalidate=60
etag: "5f3c-1a2b"
vary: Accept-Encoding
server: nginx/1.18.0
x-powered-by: Express
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; img-src *; style-src 'self' 'unsafe-inline'
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
access-control-allow-origin: *
set-cookie: session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax
set-cookie: tracking=xyz; Path=/; Expires=Wed, 29 Sep 2027 10:00:00 GMT
x-request-id: 7f9d2c1e-54b1-4c7a-9a55-7cbe0b1f0e2a`;
