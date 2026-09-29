// fetch() snippet → cURL, without eval: a small tolerant parser for the literal parts of
// `fetch(url, { method, headers, body })`, plus a cURL command generator with shell quoting.

import { lineCol } from '../../../shared/lib/textpos';
import { hasHeader, type HttpRequest } from './curl';
import { shellQuote } from './shell';

/** A value the parser could not work out statically (a variable, a function call…). */
export class Unresolved {
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

export type JsValue = string | number | boolean | null | undefined | Unresolved | JsValue[] | { [key: string]: JsValue };

class ParseError extends Error {}

class Parser {
  i = 0;
  warnings: string[] = [];
  readonly s: string;
  constructor(s: string) {
    this.s = s;
  }

  fail(msg: string): never {
    const { line, column } = lineCol(this.s, this.i);
    throw new ParseError(`${msg} (line ${line}, column ${column})`);
  }

  skip() {
    for (;;) {
      const m = /^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(this.s.slice(this.i));
      if (!m) return;
      this.i += m[0].length;
    }
  }

  peek(): string {
    this.skip();
    return this.s[this.i] ?? '';
  }

  eat(ch: string): boolean {
    if (this.peek() === ch) {
      this.i++;
      return true;
    }
    return false;
  }

  expect(ch: string) {
    if (!this.eat(ch)) this.fail(`Expected "${ch}"`);
  }

  ident(): string | null {
    this.skip();
    const m = /^[A-Za-z_$][\w$]*/.exec(this.s.slice(this.i));
    if (!m) return null;
    this.i += m[0].length;
    return m[0];
  }

  string(): string {
    const q = this.s[this.i];
    let out = '';
    let j = this.i + 1;
    while (j < this.s.length) {
      const c = this.s[j];
      if (c === q) {
        this.i = j + 1;
        return out;
      }
      if (q === '`' && c === '$' && this.s[j + 1] === '{') {
        const close = this.s.indexOf('}', j);
        if (close === -1) break;
        this.warnings.push(`The template literal uses ${this.s.slice(j, close + 1)}; it was kept as literal text.`);
        out += this.s.slice(j, close + 1);
        j = close + 1;
        continue;
      }
      if (c === '\n' && q !== '`') break;
      if (c === '\\') {
        const e = this.s[j + 1];
        const simple: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' };
        if (e in simple) {
          out += simple[e];
          j += 2;
        } else if (e === 'x') {
          out += String.fromCharCode(parseInt(this.s.slice(j + 2, j + 4), 16));
          j += 4;
        } else if (e === 'u' && this.s[j + 2] === '{') {
          const close = this.s.indexOf('}', j);
          out += String.fromCodePoint(parseInt(this.s.slice(j + 3, close), 16));
          j = close + 1;
        } else if (e === 'u') {
          out += String.fromCharCode(parseInt(this.s.slice(j + 2, j + 6), 16));
          j += 6;
        } else if (e === '\n') {
          j += 2;
        } else {
          out += e ?? '';
          j += 2;
        }
        continue;
      }
      out += c;
      j++;
    }
    return this.fail('Unterminated string');
  }

  /** Skips a balanced expression we can't evaluate and returns its source text. */
  opaque(start: number): Unresolved {
    let depth = 0;
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === '"' || c === "'" || c === '`') {
        this.string();
        continue;
      }
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) {
        if (depth === 0) break;
        depth--;
      } else if (c === ',' && depth === 0) break;
      this.i++;
    }
    return new Unresolved(this.s.slice(start, this.i).trim());
  }

  expr(): JsValue {
    const start = (this.skip(), this.i);
    let v = this.primary();
    while (this.peek() === '+') {
      this.i++;
      const r = this.primary();
      if (typeof v === 'string' && (typeof r === 'string' || typeof r === 'number')) v = v + r;
      else if (typeof v === 'number' && typeof r === 'number') v = v + r;
      else {
        this.i = start;
        return this.opaque(start);
      }
    }
    // Anything else (a ternary, ??, a method call on a literal…) is beyond a static reading.
    const next = this.peek();
    if (next && !',)]}'.includes(next)) {
      this.i = start;
      return this.opaque(start);
    }
    return v;
  }

  primary(): JsValue {
    const c = this.peek();
    const start = this.i;
    if (c === '"' || c === "'" || c === '`') return this.string();
    if (c === '{') return this.object();
    if (c === '[') return this.array();
    if (c === '(') {
      // A parenthesised literal, or something opaque such as an arrow function or IIFE.
      try {
        this.i++;
        const v = this.expr();
        this.expect(')');
        if (!this.s.startsWith('=>', (this.skip(), this.i)) && this.peek() !== '(') return v;
      } catch (e) {
        if (!(e instanceof ParseError)) throw e;
      }
      this.i = start;
      return this.opaque(start);
    }
    const num = /^-?(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+)/.exec(this.s.slice(this.i));
    if (num) {
      this.i += num[0].length;
      return Number(num[0]);
    }
    const id = this.ident();
    if (id === null) this.fail('Unexpected character');
    if (id === 'true') return true;
    if (id === 'false') return false;
    if (id === 'null') return null;
    if (id === 'undefined') return undefined;
    if (id === 'new') {
      const ctor = this.ident();
      if ((ctor === 'Headers' || ctor === 'URLSearchParams') && this.eat('(')) {
        const arg = this.peek() === ')' ? (ctor === 'Headers' ? {} : '') : this.expr();
        this.expect(')');
        if (ctor === 'Headers') return arg;
        return urlSearchParams(arg) ?? new Unresolved(this.s.slice(start, this.i));
      }
      this.i = start;
      return this.opaque(start);
    }
    if (id === 'JSON' && this.eat('.') && this.ident() === 'stringify' && this.eat('(')) {
      const value = this.expr();
      let space: JsValue;
      if (this.eat(',')) {
        this.expr(); // replacer
        if (this.eat(',')) space = this.expr();
      }
      this.expect(')');
      const json = stringifyStatic(value, space);
      if (json !== null) return json;
      this.warnings.push('JSON.stringify() is given a value that isn’t a plain literal; the body could not be worked out.');
      return new Unresolved(this.s.slice(start, this.i));
    }
    this.i = start;
    return this.opaque(start);
  }

  object(): { [key: string]: JsValue } {
    this.expect('{');
    const out: { [key: string]: JsValue } = {};
    while (!this.eat('}')) {
      if (this.s.startsWith('...', (this.skip(), this.i))) {
        this.i += 3;
        const spread = this.expr();
        if (spread && typeof spread === 'object' && !(spread instanceof Unresolved) && !Array.isArray(spread)) Object.assign(out, spread);
        else this.warnings.push(`Skipped the spread "...${spread instanceof Unresolved ? spread.text : ''}".`);
      } else {
        let key: string;
        const c = this.peek();
        if (c === '"' || c === "'") key = this.string();
        else if (c === '[') {
          this.i++;
          const k = this.expr();
          this.expect(']');
          if (typeof k !== 'string') this.fail('Computed keys are not supported');
          key = k;
        } else {
          const id = this.ident() ?? /^\d+/.exec(this.s.slice(this.i))?.[0];
          if (id === undefined) this.fail('Expected a property name');
          if (/^\d/.test(id)) this.i += id.length;
          key = id;
        }
        if (this.eat(':')) out[key] = this.expr();
        else if (this.peek() === '(') this.fail('Methods are not supported in the options object');
        else out[key] = new Unresolved(key); // shorthand { body }
      }
      if (!this.eat(',')) {
        this.expect('}');
        break;
      }
    }
    return out;
  }

  array(): JsValue[] {
    this.expect('[');
    const out: JsValue[] = [];
    while (!this.eat(']')) {
      out.push(this.expr());
      if (!this.eat(',')) {
        this.expect(']');
        break;
      }
    }
    return out;
  }
}

function isPlain(v: JsValue): boolean {
  if (v instanceof Unresolved) return false;
  if (Array.isArray(v)) return v.every(isPlain);
  if (v && typeof v === 'object') return Object.values(v).every(isPlain);
  return true;
}

function stringifyStatic(value: JsValue, space: JsValue): string | null {
  if (!isPlain(value)) return null;
  const s = typeof space === 'number' || typeof space === 'string' ? space : undefined;
  return JSON.stringify(value, null, s) ?? null;
}

function urlSearchParams(arg: JsValue): string | null {
  if (typeof arg === 'string') return new URLSearchParams(arg).toString();
  if (Array.isArray(arg) && arg.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'string'))) {
    return new URLSearchParams(arg as [string, string][]).toString();
  }
  if (arg && typeof arg === 'object' && !(arg instanceof Unresolved) && !Array.isArray(arg)) {
    const entries = Object.entries(arg);
    if (entries.every(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      return new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
    }
  }
  return null;
}

export interface FetchParseResult {
  request?: HttpRequest;
  error?: string;
  warnings: string[];
}

const KNOWN_OPTIONS = new Set(['method', 'headers', 'body', 'credentials', 'referrer', 'redirect', 'mode', 'cache', 'signal', 'keepalive', 'integrity', 'referrerPolicy', 'priority', 'duplex']);

/** Parses the first `fetch(url, options)` call in a snippet. */
export function parseFetch(code: string): FetchParseResult {
  const m = /(?:^|[^\w$.])fetch\s*\(/.exec(code);
  if (!m) return { error: 'No fetch( … ) call found.', warnings: [] };
  const p = new Parser(code);
  p.i = m.index + m[0].length;
  try {
    const url = p.expr();
    if (typeof url !== 'string') {
      return { error: `The URL must be a string literal; found ${url instanceof Unresolved ? `"${url.text}"` : typeof url}.`, warnings: p.warnings };
    }
    let options: JsValue = {};
    if (p.eat(',') && p.peek() !== ')') options = p.expr();
    p.eat(',');
    p.expect(')');
    if (options instanceof Unresolved) {
      p.warnings.push(`The options "${options.text}" aren't an object literal, so only the URL was converted.`);
      options = {};
    }
    if (!options || typeof options !== 'object' || Array.isArray(options)) return { error: 'The second argument must be an object.', warnings: p.warnings };
    return buildRequest(url, options, p.warnings);
  } catch (e) {
    if (e instanceof ParseError) return { error: e.message, warnings: p.warnings };
    throw e;
  }
}

function buildRequest(url: string, o: { [key: string]: JsValue }, warnings: string[]): FetchParseResult {
  const headers: [string, string][] = [];
  const h = o.headers;
  if (Array.isArray(h)) {
    for (const pair of h) {
      if (Array.isArray(pair) && typeof pair[0] === 'string' && (typeof pair[1] === 'string' || typeof pair[1] === 'number')) headers.push([pair[0], String(pair[1])]);
      else warnings.push('Skipped a header entry that isn’t a [name, value] pair of strings.');
    }
  } else if (h instanceof Unresolved) {
    warnings.push(`The headers "${h.text}" aren't an object literal and were skipped.`);
  } else if (h && typeof h === 'object') {
    for (const [name, value] of Object.entries(h)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') headers.push([name, String(value)]);
      else {
        const what = value instanceof Unresolved ? value.text : 'value';
        warnings.push(`The value of header "${name}" isn't a literal (${what}); it was replaced with a placeholder.`);
        headers.push([name, `<${what}>`]);
      }
    }
  }

  const method = typeof o.method === 'string' ? o.method.toUpperCase() : 'GET';
  if (o.method !== undefined && typeof o.method !== 'string') warnings.push('The method isn’t a string literal; GET was assumed.');

  let body: HttpRequest['body'];
  const b = o.body;
  if (typeof b === 'string') {
    body = { kind: 'text', text: b };
    if (!hasHeader(headers, 'Content-Type')) {
      // fetch labels string bodies as text/plain; curl would otherwise say form-urlencoded.
      headers.push(['Content-Type', 'text/plain;charset=UTF-8']);
    }
  } else if (b instanceof Unresolved) {
    warnings.push(`The body "${b.text}" can't be worked out without running the code; a placeholder was used.`);
    body = { kind: 'text', text: `<${b.text}>` };
  } else if (b !== undefined && b !== null) {
    warnings.push('The body is an object, which fetch would send as "[object Object]". Did you mean JSON.stringify(…)?');
    body = { kind: 'text', text: '[object Object]' };
  }

  if (o.credentials === 'include' || o.credentials === 'same-origin') {
    warnings.push(`credentials: '${String(o.credentials)}' makes the browser send its cookies; add them with -b 'name=value' if the request needs them.`);
  }
  if (typeof o.referrer === 'string' && o.referrer && o.referrer !== 'about:client' && !hasHeader(headers, 'Referer')) headers.push(['Referer', o.referrer]);
  // fetch follows redirects unless told otherwise; curl needs -L for that.
  const followRedirects = o.redirect !== 'manual' && o.redirect !== 'error';
  const unknown = Object.keys(o).filter((k) => !KNOWN_OPTIONS.has(k));
  if (unknown.length) warnings.push(`Unknown fetch option${unknown.length > 1 ? 's' : ''} ignored: ${unknown.join(', ')}.`);
  if (method === 'GET' && body) warnings.push('fetch refuses a GET request with a body; the cURL command sends it anyway.');

  return { request: { method, url, headers, body, followRedirects }, warnings };
}

// ---- cURL output -------------------------------------------------------------

export function toCurl(req: HttpRequest): string {
  const args: string[] = [`curl ${shellQuote(req.url)}`];
  const hasBody = !!req.body;
  if (req.method === 'HEAD') args.push('-I');
  else if (!(req.method === 'GET' && !hasBody) && !(req.method === 'POST' && hasBody)) args.push(`-X ${shellQuote(req.method)}`);
  for (const [n, v] of req.headers) {
    if (req.body?.kind === 'multipart' && n.toLowerCase() === 'content-type') continue;
    args.push(`-H ${shellQuote(v === '' ? `${n};` : `${n}: ${v}`)}`);
  }
  if (req.basicAuth) args.push(`-u ${shellQuote(`${req.basicAuth.user}:${req.basicAuth.password}`)}`);
  if (req.body?.kind === 'text') args.push(`--data-raw ${shellQuote(req.body.text)}`);
  else if (req.body?.kind === 'multipart') {
    for (const p of req.body.parts) {
      if (p.file !== undefined) args.push(`-F ${shellQuote(`${p.name}=@${p.file}${p.type ? `;type=${p.type}` : ''}`)}`);
      else args.push(`--form-string ${shellQuote(`${p.name}=${p.value ?? ''}`)}`);
    }
  }
  if (req.followRedirects) args.push('-L');
  if (req.insecure) args.push('-k');
  if (req.compressed) args.push('--compressed');
  return args.join(' \\\n  ');
}

