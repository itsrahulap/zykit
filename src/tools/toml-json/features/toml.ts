// Own TOML 1.0 parser and a JSON -> TOML writer. No dependencies.

import { parseJsonText, textError, type TextError } from '../../../shared/lib/textpos';

/** A TOML date, time or datetime. JSON.stringify writes it as its original text. */
export class TomlDate {
  readonly text: string;
  readonly kind: 'offset-datetime' | 'local-datetime' | 'local-date' | 'local-time';
  constructor(text: string, kind: TomlDate['kind']) {
    this.text = text;
    this.kind = kind;
  }
  toJSON() {
    return this.text;
  }
}

class TomlSyntaxError extends Error {
  readonly offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

type Table = Record<string, unknown>;
const newTable = (): Table => Object.create(null) as Table;

const BARE = /^[A-Za-z0-9_-]+$/;
const INT = /^[+-]?(?:0|[1-9](?:_?\d)*)$/;
const FLOAT = /^[+-]?(?:0|[1-9](?:_?\d)*)(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?$/;
const RADIX: Record<string, RegExp> = { x: /^0x[0-9a-fA-F](?:_?[0-9a-fA-F])*$/, o: /^0o[0-7](?:_?[0-7])*$/, b: /^0b[01](?:_?[01])*$/ };
const DATE_TIME = /^(\d{4})-(\d\d)-(\d\d)(?:[Tt ](\d\d):(\d\d):(\d\d)(?:\.\d+)?([Zz]|[+-]\d\d:\d\d)?)?$/;
const TIME = /^(\d\d):(\d\d):(\d\d)(?:\.\d+)?$/;
const ESC: Record<string, string> = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r', '"': '"', '\\': '\\' };

export function parseToml(src: string): { value: Table; warnings: string[] } {
  let i = 0;
  const root = newTable();
  const frozen = new WeakSet<object>(); // inline tables and static arrays
  const headers = new WeakSet<object>(); // tables defined by [header]
  const dotted = new WeakSet<object>(); // tables created by dotted keys
  const arrayTables = new WeakSet<object>();
  const warnings = new Set<string>();

  const fail = (msg: string, at = i): never => {
    throw new TomlSyntaxError(msg, at);
  };
  const isCtl = (c: number) => (c < 0x20 && c !== 9) || c === 0x7f;
  const ws = () => {
    while (src[i] === ' ' || src[i] === '\t') i++;
  };
  const comment = () => {
    if (src[i] !== '#') return;
    while (i < src.length && src[i] !== '\n') {
      if (isCtl(src.charCodeAt(i)) && !(src[i] === '\r' && src[i + 1] === '\n')) fail('Control character in comment');
      i++;
    }
  };
  const newline = () => {
    if (src[i] === '\n') i++;
    else if (src[i] === '\r' && src[i + 1] === '\n') i += 2;
    else return false;
    return true;
  };
  const wsNl = () => {
    for (;;) {
      ws();
      comment();
      if (!newline()) return;
    }
  };

  function basicString(multi: boolean): string {
    let out = '';
    const q = multi ? '"""' : '"';
    const begin = i;
    i += q.length;
    if (multi) newline();
    for (;;) {
      if (i >= src.length) fail('Unterminated string', begin);
      const c = src[i];
      if (multi && c === '"' && src.startsWith('"""', i)) {
        let n = 0;
        while (src[i + n] === '"') n++;
        if (n > 5) fail('Too many quotes in string', i + 5);
        i += n;
        return out + '"'.repeat(n - 3);
      }
      if (!multi && c === '"') {
        i++;
        return out;
      }
      if (c === '\\') {
        const e = src[i + 1] ?? '';
        if (e === 'u' || e === 'U') {
          const len = e === 'u' ? 4 : 8;
          const hex = src.slice(i + 2, i + 2 + len);
          const cp = parseInt(hex, 16);
          if (hex.length < len || !/^[0-9a-fA-F]+$/.test(hex) || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) fail('Invalid unicode escape');
          out += String.fromCodePoint(cp);
          i += 2 + len;
        } else if (e in ESC) {
          out += ESC[e];
          i += 2;
        } else if (multi && /[ \t\r\n]/.test(e)) {
          let j = i + 1;
          while (src[j] === ' ' || src[j] === '\t') j++;
          if (src[j] === '\r' && src[j + 1] === '\n') j++;
          if (src[j] !== '\n') fail('Invalid escape sequence');
          while (/[ \t\r\n]/.test(src[j] ?? '')) j++;
          i = j;
        } else fail(`Invalid escape sequence "\\${e}"`);
      } else if (c === '\n' || (c === '\r' && src[i + 1] === '\n')) {
        if (!multi) fail('Unterminated string', begin);
        out += c === '\n' ? '\n' : '\r\n';
        i += c === '\n' ? 1 : 2;
      } else {
        if (isCtl(src.charCodeAt(i))) fail('Control character in string');
        out += c;
        i++;
      }
    }
  }

  function literalString(multi: boolean): string {
    const q = multi ? "'''" : "'";
    i += q.length;
    if (multi) newline();
    const start = i;
    for (;;) {
      if (i >= src.length) fail('Unterminated string', start);
      if (multi && src.startsWith("'''", i)) {
        let n = 0;
        while (src[i + n] === "'") n++;
        if (n > 5) fail('Too many quotes in string', i + 5);
        const out = src.slice(start, i) + "'".repeat(n - 3);
        i += n;
        return out;
      }
      if (!multi && src[i] === "'") return src.slice(start, i++);
      const c = src[i];
      if (c === '\n' || (c === '\r' && src[i + 1] === '\n')) {
        if (!multi) fail('Unterminated string', start);
        i += c === '\n' ? 1 : 2;
      } else {
        if (isCtl(src.charCodeAt(i))) fail('Control character in string');
        i++;
      }
    }
  }

  const string = (): string => {
    const lit = src[i] === "'";
    const multi = src.startsWith(lit ? "'''" : '"""', i);
    return lit ? literalString(multi) : basicString(multi);
  };

  function key(): string[] {
    const parts: string[] = [];
    for (;;) {
      ws();
      const c = src[i];
      if (c === '"' || c === "'") {
        if (src.startsWith(c.repeat(3), i)) fail('Multi-line strings cannot be keys');
        parts.push(c === '"' ? basicString(false) : literalString(false));
      } else {
        const m = /^[A-Za-z0-9_-]+/.exec(src.slice(i, i + 256));
        if (!m) fail(c === undefined || c === '\n' ? 'Expected a key' : `Unexpected character "${c}", expected a key`);
        parts.push(m![0]);
        i += m![0].length;
      }
      ws();
      if (src[i] !== '.') return parts;
      i++;
    }
  }

  const validDate = (y: number, mo: number, d: number) => mo >= 1 && mo <= 12 && d >= 1 && d <= new Date(Date.UTC(2001 + (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 3 : 0), mo, 0)).getUTCDate();

  function scalar(): unknown {
    const start = i;
    const m = /^[^\s,\]}#]+(?: \d\d:\d\d:\d\d(?:\.\d+)?(?:[Zz]|[+-]\d\d:\d\d)?)?/.exec(src.slice(i, i + 80));
    if (!m) return fail(`Unexpected character "${src[i] ?? 'end of input'}", expected a value`);
    let tok = m[0];
    if (!/^\d{4}-\d\d-\d\d /.test(tok)) tok = tok.split(' ')[0];
    i += tok.length;
    if (tok === 'true' || tok === 'false') return tok === 'true';
    const bad = (what: string) => fail(`Invalid ${what} "${tok}"`, start);
    let mm: RegExpExecArray | null;
    if ((mm = DATE_TIME.exec(tok))) {
      const [, y, mo, d, h, mi, s, off] = mm;
      if (!validDate(+y, +mo, +d)) bad('date');
      if (h !== undefined && (+h > 23 || +mi > 59 || +s > 60)) bad('time');
      if (off && off !== 'Z' && off !== 'z' && (+off.slice(1, 3) > 23 || +off.slice(4) > 59)) bad('offset');
      return new TomlDate(tok, h === undefined ? 'local-date' : off ? 'offset-datetime' : 'local-datetime');
    }
    if ((mm = TIME.exec(tok))) {
      if (+mm[1] > 23 || +mm[2] > 59 || +mm[3] > 60) bad('time');
      return new TomlDate(tok, 'local-time');
    }
    if (/^[+-]?inf$/.test(tok)) {
      warnings.add('inf and nan have no JSON form and became null.');
      return tok[0] === '-' ? -Infinity : Infinity;
    }
    if (/^[+-]?nan$/.test(tok)) {
      warnings.add('inf and nan have no JSON form and became null.');
      return NaN;
    }
    const radix = RADIX[tok[1] ?? ''];
    if (tok[0] === '0' && radix) {
      if (!radix.test(tok)) bad('integer');
      return safeInt(BigInt(tok.replace(/_/g, '')), start);
    }
    if (INT.test(tok)) return safeInt(BigInt(tok.replace(/_/g, '')), start);
    if (FLOAT.test(tok)) return Number(tok.replace(/_/g, ''));
    return fail(`Invalid value "${tok.length > 20 ? `${tok.slice(0, 20)}…` : tok}"`, start);
  }

  function safeInt(b: bigint, at: number): number {
    if (b > 0x7fffffffffffffffn || b < -0x8000000000000000n) fail('Integer does not fit in 64 bits', at);
    if (b > BigInt(Number.MAX_SAFE_INTEGER) || b < -BigInt(Number.MAX_SAFE_INTEGER)) warnings.add('Integers beyond 2^53 lost precision in JSON.');
    return Number(b);
  }

  function value(depth: number): unknown {
    if (depth > 200) fail('Nesting is too deep');
    const c = src[i];
    if (c === '"' || c === "'") return string();
    if (c === '[') {
      i++;
      const arr: unknown[] = [];
      for (;;) {
        wsNl();
        if (src[i] === ']') {
          i++;
          break;
        }
        arr.push(value(depth + 1));
        wsNl();
        if (src[i] === ',') i++;
        else if (src[i] !== ']') fail('Expected "," or "]" in array');
      }
      frozen.add(arr);
      return arr;
    }
    if (c === '{') {
      i++;
      const t = newTable();
      ws();
      if (src[i] === '}') i++;
      else
        for (;;) {
          ws();
          const at = i;
          assign(t, key(), at, depth);
          ws();
          if (src[i] === ',') {
            i++;
            ws();
            if (src[i] === '}') fail('Trailing comma is not allowed in an inline table');
          } else if (src[i] === '}') {
            i++;
            break;
          } else fail('Expected "," or "}" in inline table');
        }
      frozen.add(t);
      return t;
    }
    return scalar();
  }

  /** `a.b.c = value` into `table`; dotted parts create tables. */
  function assign(table: Table, keys: string[], at: number, depth: number) {
    let t = table;
    for (const k of keys.slice(0, -1)) {
      const next = t[k];
      if (next === undefined) {
        const n = newTable();
        dotted.add(n);
        t[k] = n;
        t = n;
      } else if (next && typeof next === 'object' && !Array.isArray(next) && !(next instanceof TomlDate) && !frozen.has(next) && !headers.has(next)) t = next as Table;
      else fail(`Key "${k}" is already defined and is not a table`, at);
    }
    const last = keys[keys.length - 1];
    if (last in t) fail(`Duplicate key "${last}"`, at);
    ws();
    if (src[i] !== '=') fail('Expected "=" after key');
    i++;
    ws();
    t[last] = value(depth + 1);
  }

  function header(): Table {
    const isArr = src[i + 1] === '[';
    i += isArr ? 2 : 1;
    const at = i;
    const keys = key();
    ws();
    if (!src.startsWith(isArr ? ']]' : ']', i)) fail(`Expected "${isArr ? ']]' : ']'}"`);
    i += isArr ? 2 : 1;
    let t = root;
    keys.forEach((k, n) => {
      const last = n === keys.length - 1;
      let next = t[k];
      if (Array.isArray(next)) {
        if (!arrayTables.has(next)) fail(`"${k}" is a static array and cannot be extended`, at);
        if (last && isArr) {
          const fresh = newTable();
          next.push(fresh);
          t = fresh;
          return;
        }
        if (last) fail(`"${k}" is already defined as an array of tables`, at);
        t = next[next.length - 1] as Table;
        return;
      }
      if (next === undefined) {
        if (last && isArr) {
          const arr: unknown[] = [];
          arrayTables.add(arr);
          t[k] = arr;
          t = newTable();
          arr.push(t);
          return;
        }
        next = newTable();
        t[k] = next;
      } else if (typeof next !== 'object' || next instanceof TomlDate || frozen.has(next as object) || dotted.has(next as object)) {
        fail(`"${k}" is already defined and is not an extendable table`, at);
      }
      if (last && (isArr || headers.has(next as object))) fail(`Table "${keys.join('.')}" is already defined`, at);
      if (last) headers.add(next as object);
      t = next as Table;
    });
    return t;
  }

  let current = root;
  for (;;) {
    wsNl();
    if (i >= src.length) break;
    if (src[i] === '[') current = header();
    else {
      const at = i;
      assign(current, key(), at, 0);
    }
    ws();
    comment();
    if (i < src.length && !newline()) fail('Expected a new line after the value');
  }
  return { value: root, warnings: [...warnings] };
}

export type JsonIndent = 2 | 4 | 'tab' | 'min';
export type ConvertResult = { ok: true; output: string; warnings: string[] } | { ok: false; error: TextError };

export function tomlToJson(text: string, indent: JsonIndent): ConvertResult {
  try {
    const { value, warnings } = parseToml(text);
    const space = indent === 'min' ? undefined : indent === 'tab' ? '\t' : indent;
    return { ok: true, output: JSON.stringify(value, null, space), warnings };
  } catch (err) {
    if (err instanceof TomlSyntaxError) return { ok: false, error: textError(text, err.offset, err.message) };
    throw err;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const qKey = (k: string) => (BARE.test(k) ? k : qStr(k));
// eslint-disable-next-line no-control-regex
const qStr = (s: string) => `"${s.replace(/[\\"\u0000-\u001f\u007f]/g, (c) => ({ '\\': '\\\\', '"': '\\"', '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r' })[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)}"`;

function inline(v: unknown, dropped: { n: number }): string | undefined {
  if (v === null || v === undefined) {
    dropped.n++;
    return undefined;
  }
  if (typeof v === 'string') return qStr(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `[${v.map((x) => inline(x, dropped)).filter((x) => x !== undefined).join(', ')}]`;
  const parts = Object.entries(v as object).flatMap(([k, x]) => {
    const s = inline(x, dropped);
    return s === undefined ? [] : [`${qKey(k)} = ${s}`];
  });
  return parts.length ? `{ ${parts.join(', ')} }` : '{}';
}

export function jsonToToml(value: unknown): { output: string; warnings: string[] } {
  if (!isObj(value)) throw new Error('TOML needs a JSON object at the top level.');
  const dropped = { n: 0 };
  const blocks: string[] = [];
  const emit = (t: Record<string, unknown>, path: string[], arrayItem: boolean) => {
    const lines: string[] = [];
    const subs: [string, unknown][] = [];
    for (const [k, v] of Object.entries(t)) {
      if (isObj(v) || (Array.isArray(v) && v.length > 0 && v.every(isObj))) subs.push([k, v]);
      else {
        const s = inline(v, dropped);
        if (s !== undefined) lines.push(`${qKey(k)} = ${s}`);
      }
    }
    if (path.length && (lines.length || !subs.length || arrayItem)) {
      const name = path.map(qKey).join('.');
      blocks.push([arrayItem ? `[[${name}]]` : `[${name}]`, ...lines].join('\n'));
    } else if (lines.length) blocks.push(lines.join('\n'));
    for (const [k, v] of subs) {
      if (Array.isArray(v)) v.forEach((item) => emit(item as Record<string, unknown>, [...path, k], true));
      else emit(v as Record<string, unknown>, [...path, k], false);
    }
  };
  emit(value, [], false);
  const warnings = dropped.n ? [`${dropped.n} null value${dropped.n === 1 ? '' : 's'} were left out; TOML has no null.`] : [];
  return { output: blocks.length ? `${blocks.join('\n\n')}\n` : '', warnings };
}

export function jsonTextToToml(text: string): ConvertResult {
  const parsed = parseJsonText(text);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, ...jsonToToml(parsed.value) };
  } catch (err) {
    return { ok: false, error: textError(text, 0, err instanceof Error ? err.message : 'Conversion failed') };
  }
}
