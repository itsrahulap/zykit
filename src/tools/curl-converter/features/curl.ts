// cURL option parser: turns a pasted command line into a neutral HTTP request description.

import { tokenizeShell } from './shell';

export interface FormPart {
  name: string;
  /** Literal text value (for plain fields and `name=<file` content placeholders). */
  value?: string;
  /** Local file path for `name=@path` uploads. */
  file?: string;
  filename?: string;
  type?: string;
}

export type RequestBody =
  | { kind: 'text'; text: string }
  | { kind: 'multipart'; parts: FormPart[] };

export interface HttpRequest {
  method: string;
  url: string;
  /** Header order and duplicates are preserved. */
  headers: [string, string][];
  body?: RequestBody;
  basicAuth?: { user: string; password: string };
  insecure?: boolean;
  followRedirects?: boolean;
  compressed?: boolean;
}

export interface ParseResult {
  request?: HttpRequest;
  error?: string;
  warnings: string[];
  /** Informational notes (options that were understood but have no direct equivalent). */
  notes: string[];
}

type Handler = (value: string) => void;

interface OptionSpec {
  long: string[];
  short?: string;
  /** Takes a value argument. */
  arg: boolean;
}

const OPTIONS: OptionSpec[] = [
  { long: ['request'], short: 'X', arg: true },
  { long: ['header'], short: 'H', arg: true },
  { long: ['data', 'data-ascii'], short: 'd', arg: true },
  { long: ['data-raw'], arg: true },
  { long: ['data-binary'], arg: true },
  { long: ['data-urlencode'], arg: true },
  { long: ['json'], arg: true },
  { long: ['form'], short: 'F', arg: true },
  { long: ['form-string'], arg: true },
  { long: ['user'], short: 'u', arg: true },
  { long: ['cookie'], short: 'b', arg: true },
  { long: ['user-agent'], short: 'A', arg: true },
  { long: ['referer'], short: 'e', arg: true },
  { long: ['url'], arg: true },
  { long: ['oauth2-bearer'], arg: true },
  { long: ['upload-file'], short: 'T', arg: true },
  { long: ['get'], short: 'G', arg: false },
  { long: ['head'], short: 'I', arg: false },
  { long: ['location'], short: 'L', arg: false },
  { long: ['insecure'], short: 'k', arg: false },
  { long: ['compressed'], arg: false },
  // Understood and ignored: they change curl's output or logging, not the request.
  { long: ['output'], short: 'o', arg: true },
  { long: ['remote-name'], short: 'O', arg: false },
  { long: ['silent'], short: 's', arg: false },
  { long: ['show-error'], short: 'S', arg: false },
  { long: ['verbose'], short: 'v', arg: false },
  { long: ['include'], short: 'i', arg: false },
  { long: ['fail'], short: 'f', arg: false },
  { long: ['fail-with-body'], arg: false },
  { long: ['progress-bar'], short: '#', arg: false },
  { long: ['no-progress-meter'], arg: false },
  { long: ['no-buffer'], short: 'N', arg: false },
  { long: ['globoff'], short: 'g', arg: false },
  { long: ['write-out'], short: 'w', arg: true },
  { long: ['dump-header'], short: 'D', arg: true },
  { long: ['max-time'], short: 'm', arg: true },
  { long: ['connect-timeout'], arg: true },
  { long: ['retry'], arg: true },
  { long: ['http1.1', 'http2', 'http2-prior-knowledge', 'http3', 'http1.0'], arg: false },
  { long: ['location-trusted'], arg: false },
  { long: ['max-redirs'], arg: true },
  { long: ['proxy'], short: 'x', arg: true },
  { long: ['cookie-jar'], short: 'c', arg: true },
  { long: ['cacert', 'cert', 'key', 'capath'], arg: true },
  { long: ['cert-type', 'key-type'], arg: true },
  { long: ['resolve', 'connect-to', 'interface', 'limit-rate'], arg: true },
];

const IGNORED = new Set([
  'output', 'remote-name', 'silent', 'show-error', 'verbose', 'include', 'fail', 'fail-with-body', 'progress-bar',
  'no-progress-meter', 'no-buffer', 'globoff', 'write-out', 'dump-header', 'http1.1', 'http2', 'http2-prior-knowledge',
  'http3', 'http1.0', 'max-redirs', 'location-trusted',
]);

const BY_LONG = new Map<string, OptionSpec>();
const BY_SHORT = new Map<string, OptionSpec>();
for (const o of OPTIONS) {
  for (const l of o.long) BY_LONG.set(l, o);
  if (o.short) BY_SHORT.set(o.short, o);
}

/** curl's --data-urlencode encoding: like encodeURIComponent but with the RFC 3986 unreserved set. */
function urlencode(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export function hasHeader(headers: [string, string][], name: string): boolean {
  return headers.some(([n]) => n.toLowerCase() === name.toLowerCase());
}

export function getHeader(headers: [string, string][], name: string): string | undefined {
  return headers.find(([n]) => n.toLowerCase() === name.toLowerCase())?.[1];
}

export function parseCurl(command: string): ParseResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  const text = command.trim().replace(/^\$\s+/, '');
  if (!text) return { error: 'Paste a cURL command.', warnings, notes };

  const tok = tokenizeShell(text);
  if (tok.error) return { error: tok.error, warnings, notes };
  let words = tok.words;
  const opIndex = words.findIndex((w) => w.operator);
  if (opIndex !== -1) {
    warnings.push(`Only the first command was converted; everything from "${words[opIndex].value}" on was ignored.`);
    words = words.slice(0, opIndex);
  }
  const args = words.map((w) => w.value);
  if (args.length && /^curl(\.exe)?$/i.test(args[0])) args.shift();
  else if (args.length) warnings.push('The command doesn’t start with "curl"; parsing it as curl options anyway.');

  const urls: string[] = [];
  const headers: [string, string][] = [];
  const data: string[] = [];
  const jsonData: string[] = [];
  const parts: FormPart[] = [];
  let method: string | undefined;
  let get = false;
  let head = false;
  let uploadFile: string | undefined;
  const req: Omit<HttpRequest, 'method' | 'url' | 'headers'> = {};
  const unknown: string[] = [];
  const ignored = new Set<string>();

  const setHeader = (name: string, value: string) => {
    const i = headers.findIndex(([n]) => n.toLowerCase() === name.toLowerCase());
    if (i === -1) headers.push([name, value]);
    else headers[i] = [headers[i][0], value];
  };
  const fileNote = (what: string, path: string) =>
    warnings.push(`${what} reads the local file "${path}"; the generated code uses a placeholder you need to fill in.`);

  const handlers: Record<string, Handler> = {
    request: (v) => (method = v.toUpperCase()),
    header: (v) => {
      if (v.startsWith('@')) return fileNote('-H', v.slice(1));
      const semi = /^([^:;\s]+);$/.exec(v); // "Name;" sends an empty header
      if (semi) return void headers.push([semi[1], '']);
      const idx = v.indexOf(':');
      if (idx <= 0) return void warnings.push(`Ignored malformed header "${v}".`);
      const name = v.slice(0, idx).trim();
      const value = v.slice(idx + 1).trim();
      if (value === '') {
        // "Name:" removes a header curl would add itself.
        for (let i = headers.length - 1; i >= 0; i--) if (headers[i][0].toLowerCase() === name.toLowerCase()) headers.splice(i, 1);
        return;
      }
      headers.push([name, value]);
    },
    data: (v) => {
      if (v.startsWith('@')) {
        fileNote('-d', v.slice(1));
        data.push(`<contents of ${v.slice(1)}>`);
      } else data.push(v);
    },
    'data-raw': (v) => data.push(v),
    'data-binary': (v) => {
      if (v.startsWith('@')) {
        fileNote('--data-binary', v.slice(1));
        data.push(`<contents of ${v.slice(1)}>`);
      } else data.push(v);
    },
    'data-urlencode': (v) => {
      const m = /^([^=@]*)([=@])([\s\S]*)$/.exec(v);
      if (!m) return void data.push(urlencode(v));
      const [, name, sep, rest] = m;
      if (sep === '@') {
        fileNote('--data-urlencode', rest);
        data.push(`${name ? name + '=' : ''}<urlencoded contents of ${rest}>`);
      } else data.push(name ? `${name}=${urlencode(rest)}` : urlencode(rest));
    },
    json: (v) => {
      if (v.startsWith('@')) {
        fileNote('--json', v.slice(1));
        jsonData.push(`<contents of ${v.slice(1)}>`);
      } else jsonData.push(v);
    },
    form: (v) => {
      const eq = v.indexOf('=');
      if (eq <= 0) return void warnings.push(`Ignored malformed form field "${v}".`);
      const name = v.slice(0, eq);
      const [raw, ...attrs] = v.slice(eq + 1).split(';');
      const part: FormPart = { name };
      for (const a of attrs) {
        const m = /^\s*(type|filename)=(.*)$/.exec(a);
        if (m) part[m[1] as 'type' | 'filename'] = m[2].replace(/^"(.*)"$/, '$1');
        else if (!part.file && a) part.value = (part.value ?? raw) + ';' + a; // a literal ";" in the value
      }
      if (raw.startsWith('@')) {
        part.file = raw.slice(1);
        part.filename ??= part.file.split(/[\\/]/).pop();
      } else if (raw.startsWith('<')) {
        fileNote('-F', raw.slice(1));
        part.value = `<contents of ${raw.slice(1)}>`;
      } else part.value ??= raw;
      parts.push(part);
    },
    'form-string': (v) => {
      const eq = v.indexOf('=');
      if (eq <= 0) return void warnings.push(`Ignored malformed form field "${v}".`);
      parts.push({ name: v.slice(0, eq), value: v.slice(eq + 1) });
    },
    user: (v) => {
      const idx = v.indexOf(':');
      if (idx === -1) {
        warnings.push('-u has no password; curl would prompt for one. The code uses an empty password.');
        req.basicAuth = { user: v, password: '' };
      } else req.basicAuth = { user: v.slice(0, idx), password: v.slice(idx + 1) };
    },
    cookie: (v) => {
      if (!v.includes('=')) return void warnings.push(`-b "${v}" reads cookies from a file, which can't be converted.`);
      const existing = getHeader(headers, 'Cookie');
      setHeader('Cookie', existing ? `${existing}; ${v}` : v);
    },
    'user-agent': (v) => setHeader('User-Agent', v),
    referer: (v) => {
      const ref = v.replace(/;auto$/, '');
      if (ref) setHeader('Referer', ref);
    },
    url: (v) => urls.push(v),
    'oauth2-bearer': (v) => setHeader('Authorization', `Bearer ${v}`),
    'upload-file': (v) => {
      uploadFile = v;
      fileNote('-T', v);
    },
    get: () => (get = true),
    head: () => (head = true),
    location: () => (req.followRedirects = true),
    insecure: () => (req.insecure = true),
    compressed: () => (req.compressed = true),
  };

  const apply = (spec: OptionSpec, value: string, flag: string) => {
    const name = spec.long[0];
    const h = handlers[name];
    if (h) h(value);
    else if (IGNORED.has(name)) ignored.add(flag);
    else notes.push(`${flag} has no equivalent in the generated code and was skipped.`);
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      urls.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--') && a.length > 2) {
      let name = a.slice(2);
      let inline: string | undefined;
      const eq = name.indexOf('=');
      if (eq > 0 && BY_LONG.get(name.slice(0, eq))?.arg) {
        inline = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      const spec = BY_LONG.get(name);
      if (!spec) {
        unknown.push(a);
        continue;
      }
      if (spec.arg) {
        const value = inline ?? args[++i];
        if (value === undefined) return { error: `${a} needs a value.`, warnings, notes };
        apply(spec, value, `--${name}`);
      } else apply(spec, '', `--${name}`);
      continue;
    }
    if (a.startsWith('-') && a.length > 1) {
      // Short options can be bundled (-sSL) and take their value attached (-XPOST) or as the next word.
      for (let j = 1; j < a.length; j++) {
        const spec = BY_SHORT.get(a[j]);
        if (!spec) {
          unknown.push(`-${a[j]}`);
          continue;
        }
        if (spec.arg) {
          const rest = a.slice(j + 1);
          const value = rest !== '' ? rest : args[++i];
          if (value === undefined) return { error: `-${a[j]} needs a value.`, warnings, notes };
          apply(spec, value, `-${a[j]}`);
          break;
        }
        apply(spec, '', `-${a[j]}`);
      }
      continue;
    }
    urls.push(a);
  }

  if (unknown.length) warnings.push(`Unknown option${unknown.length > 1 ? 's' : ''} ignored: ${[...new Set(unknown)].join(', ')}.`);
  if (!urls.length) return { error: 'No URL found in the command.', warnings, notes };
  if (urls.length > 1) warnings.push(`Only the first URL is used; ignored: ${urls.slice(1).join(', ')}.`);

  let url = urls[0];
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    url = `http://${url}`;
    notes.push('The URL has no scheme, so http:// was assumed (as curl does).');
  }

  let body: RequestBody | undefined;
  if (jsonData.length) {
    if (!hasHeader(headers, 'Content-Type')) headers.push(['Content-Type', 'application/json']);
    if (!hasHeader(headers, 'Accept')) headers.push(['Accept', 'application/json']);
    data.push(jsonData.join(''));
  }
  if (get && data.length) {
    const q = data.join('&');
    url += (url.includes('?') ? '&' : '?') + q;
  } else if (data.length) {
    if (parts.length) warnings.push('Both -d and -F were given; curl refuses this. Only the -F fields are used.');
    else {
      body = { kind: 'text', text: data.join('&') };
      if (!hasHeader(headers, 'Content-Type')) headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
    }
  }
  if (parts.length && !get) body = { kind: 'multipart', parts };
  if (uploadFile && !body) body = { kind: 'text', text: `<contents of ${uploadFile}>` };

  const finalMethod = method ?? (head ? 'HEAD' : get ? 'GET' : uploadFile ? 'PUT' : body ? 'POST' : 'GET');
  if (req.compressed) notes.push('--compressed: fetch, axios and requests already accept and decode gzip/deflate/br responses.');
  if (ignored.size) notes.push(`Ignored output options: ${[...ignored].join(', ')}.`);

  return { request: { method: finalMethod, url, headers, body, ...req }, warnings, notes };
}
