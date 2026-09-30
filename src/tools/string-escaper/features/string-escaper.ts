// Escape and unescape text for string literals and other quoting contexts.
// Pure TypeScript: no DOM, unit-tested in Node (including round trips for every format).

export type FormatId =
  | 'json'
  | 'js-single'
  | 'js-double'
  | 'js-template'
  | 'python'
  | 'java'
  | 'c'
  | 'csharp'
  | 'go'
  | 'sql'
  | 'sql-mysql'
  | 'regex'
  | 'shell-single'
  | 'shell-double'
  | 'powershell-single'
  | 'powershell-double'
  | 'csv'
  | 'xml-text'
  | 'xml-attr'
  | 'url'
  | 'unicode-u'
  | 'unicode-braces'
  | 'unicode-x';

export interface EscapeOptions {
  /** Also escape every non-ASCII character (where the format has an escape for it). */
  ascii?: boolean;
}

export interface FormatInfo {
  id: FormatId;
  label: string;
  /** How to use the output. */
  hint: string;
  /** Whether "escape non-ASCII" means anything for this format. */
  asciiOption: boolean;
}

export class EscapeError extends Error {
  offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

export type EscapeResult = { ok: true; value: string } | { ok: false; error: string; offset?: number };

const hex = (n: number, w: number) => n.toString(16).toUpperCase().padStart(w, '0');
const u4 = (c: number) => `\\u${hex(c, 4)}`;
const isCtl = (c: number) => c < 0x20 || c === 0x7f;
const utf8 = new TextEncoder();

/** \uXXXX for a code point, as a surrogate pair when needed. */
function u16(cp: number): string {
  if (cp < 0x10000) return u4(cp);
  const v = cp - 0x10000;
  return u4(0xd800 + (v >> 10)) + u4(0xdc00 + (v & 0x3ff));
}

/** Walks code points, letting `fn` return a replacement or undefined to keep the character. */
function mapChars(s: string, fn: (ch: string, cp: number, i: number) => string | undefined): string {
  let out = '';
  for (let i = 0; i < s.length; ) {
    const cp = s.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    const r = fn(ch, cp, i);
    out += r ?? ch;
    i += ch.length;
  }
  return out;
}

function checkWellFormed(s: string) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) i++;
      else throw new EscapeError('The text has a lone surrogate (half of an emoji or other astral character).', i);
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new EscapeError('The text has a lone surrogate (half of an emoji or other astral character).', i);
  }
}

// ---------------------------------------------------------------------------------------------
// Escapers

const JS_SIMPLE: Record<string, string> = { '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f', '\v': '\\v' };

function escapeJs(s: string, quote: "'" | '"' | '`', o: EscapeOptions): string {
  return mapChars(s, (ch, cp, i) => {
    if (ch === quote) return `\\${ch}`;
    if (quote === '`' && ch === '$' && s[i + 1] === '{') return '\\$';
    if (JS_SIMPLE[ch]) return JS_SIMPLE[ch];
    if (cp === 0) return /\d/.test(s[i + 1] ?? '') ? '\\x00' : '\\0';
    if (isCtl(cp)) return `\\x${hex(cp, 2)}`;
    if (cp === 0x2028 || cp === 0x2029) return u4(cp);
    if (o.ascii && cp > 0x7e) return cp > 0xffff ? `\\u{${hex(cp, 1)}}` : u4(cp);
    return undefined;
  });
}

function escapeJson(s: string, o: EscapeOptions): string {
  const JSON_SIMPLE: Record<string, string> = { '"': '\\"', '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f' };
  return mapChars(s, (ch, cp) => {
    if (JSON_SIMPLE[ch]) return JSON_SIMPLE[ch];
    if (cp < 0x20 || cp === 0x2028 || cp === 0x2029) return u4(cp);
    if (o.ascii && cp > 0x7e) return u16(cp);
    return undefined;
  });
}

function escapePython(s: string, o: EscapeOptions): string {
  const T: Record<string, string> = { '\\': '\\\\', "'": "\\'", '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
  return mapChars(s, (ch, cp) => {
    if (T[ch]) return T[ch];
    if (isCtl(cp)) return `\\x${hex(cp, 2).toLowerCase()}`;
    if (o.ascii && cp > 0x7e) return cp <= 0xff ? `\\x${hex(cp, 2).toLowerCase()}` : cp <= 0xffff ? `\\u${hex(cp, 4).toLowerCase()}` : `\\U${hex(cp, 8).toLowerCase()}`;
    return undefined;
  });
}

const C_SIMPLE: Record<string, string> = { '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f' };
const octal = (b: number) => `\\${b.toString(8).padStart(3, '0')}`;

function escapeJava(s: string, o: EscapeOptions): string {
  // Java turns \uXXXX into characters before lexing, so line breaks and quotes must never use it.
  return mapChars(s, (ch, cp) => {
    if (C_SIMPLE[ch]) return C_SIMPLE[ch];
    if (ch === "'") return "\\'";
    if (isCtl(cp)) return octal(cp);
    if (o.ascii && cp > 0x7e) return u16(cp);
    return undefined;
  });
}

function escapeC(s: string, o: EscapeOptions): string {
  return mapChars(s, (ch, cp, i) => {
    if (C_SIMPLE[ch]) return C_SIMPLE[ch];
    if (ch === "'") return "\\'";
    if (ch === '?' && s[i - 1] === '?') return '\\?'; // no trigraphs
    if (cp === 0x0b) return '\\v';
    if (cp === 0x07) return '\\a';
    if (isCtl(cp)) return octal(cp);
    if (o.ascii && cp > 0x7e) return Array.from(utf8.encode(ch), octal).join('');
    return undefined;
  });
}

function escapeCsharp(s: string, o: EscapeOptions): string {
  return mapChars(s, (ch, cp) => {
    if (C_SIMPLE[ch]) return C_SIMPLE[ch];
    if (ch === "'") return "\\'";
    if (cp === 0) return '\\0';
    if (cp === 0x0b) return '\\v';
    if (cp === 0x07) return '\\a';
    if (isCtl(cp) || cp === 0x2028 || cp === 0x2029 || cp === 0x85) return u4(cp);
    if (o.ascii && cp > 0x7e) return cp > 0xffff ? `\\U${hex(cp, 8)}` : u4(cp);
    return undefined;
  });
}

function escapeGo(s: string, o: EscapeOptions): string {
  return mapChars(s, (ch, cp) => {
    if (C_SIMPLE[ch]) return C_SIMPLE[ch];
    if (cp === 0x0b) return '\\v';
    if (cp === 0x07) return '\\a';
    if (isCtl(cp)) return `\\x${hex(cp, 2).toLowerCase()}`;
    if (o.ascii && cp > 0x7e) return cp > 0xffff ? `\\U${hex(cp, 8).toLowerCase()}` : `\\u${hex(cp, 4).toLowerCase()}`;
    return undefined;
  });
}

function escapeMysql(s: string): string {
  const T: Record<string, string> = { '\\': '\\\\', "'": "\\'", '"': '\\"', '\0': '\\0', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\x1a': '\\Z' };
  return mapChars(s, (ch) => T[ch]);
}

/** Characters that mean something in a regular expression (valid to escape even with the `u` flag). */
const REGEX_META = /[\\^$.*+?()[\]{}|/]/g;

function escapeUnicode(s: string, mode: 'u' | 'braces' | 'x'): string {
  return mapChars(s, (ch, cp) => {
    if (ch === '\\') return '\\\\';
    if (cp >= 0x20 && cp < 0x7f) return undefined;
    if (mode === 'u') return u16(cp);
    if (mode === 'braces') return `\\u{${hex(cp, 1)}}`;
    return Array.from(utf8.encode(ch), (b) => `\\x${hex(b, 2)}`).join('');
  });
}

function escapePowershellDouble(s: string): string {
  const T: Record<string, string> = { '`': '``', '$': '`$', '\0': '`0', '\n': '`n', '\r': '`r', '\t': '`t', '\x07': '`a', '\b': '`b', '\f': '`f', '\v': '`v', '\x1b': '`e' };
  // PowerShell also treats curly double quotes as quote characters.
  return `"${mapChars(s, (ch) => T[ch] ?? (/["\u201c\u201d\u201e]/.test(ch) ? `\`${ch}` : undefined))}"`;
}

function escapeXml(s: string, attr: boolean): string {
  return mapChars(s, (ch, cp) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (attr) {
      if (ch === '"') return '&quot;';
      if (ch === "'") return '&#39;';
      if (ch === '\n') return '&#10;';
      if (ch === '\r') return '&#13;';
      if (ch === '\t') return '&#9;';
    } else if (ch === '\r') return '&#13;';
    if (cp < 0x20 && ch !== '\n' && ch !== '\t') return `&#${cp};`;
    return undefined;
  });
}

// ---------------------------------------------------------------------------------------------
// Unescapers

type EscapeHandler = (s: string, i: number, out: Out) => number;

/** Collects decoded text; bytes from \x or octal escapes are decoded as UTF-8 where the language does that. */
class Out {
  text = '';
  private bytes: number[] = [];
  private bytesAt = 0;
  push(t: string) {
    this.flush();
    this.text += t;
  }
  byte(b: number, at: number) {
    if (!this.bytes.length) this.bytesAt = at;
    this.bytes.push(b);
  }
  flush() {
    if (!this.bytes.length) return;
    try {
      this.text += new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(this.bytes));
    } catch {
      throw new EscapeError('These byte escapes aren’t valid UTF-8.', this.bytesAt);
    }
    this.bytes = [];
  }
}

function hexAt(s: string, i: number, len: number, what: string, backslashAt: number): number {
  const h = s.slice(i, i + len);
  if (h.length !== len || !/^[0-9A-Fa-f]+$/.test(h)) throw new EscapeError(`${what} needs ${len} hex digits.`, backslashAt);
  return parseInt(h, 16);
}

function codePoint(cp: number, at: number): string {
  if (cp > 0x10ffff) throw new EscapeError('Code point is beyond U+10FFFF.', at);
  return String.fromCodePoint(cp);
}

/** \uXXXX, joining a following \uXXXX low surrogate. Returns the index after the escape(s). */
function readU4(s: string, i: number, out: Out, at: number): number {
  const hi = hexAt(s, i, 4, '\\u', at);
  let next = i + 4;
  if (hi >= 0xd800 && hi <= 0xdbff && s[next] === '\\' && s[next + 1] === 'u' && /^[0-9A-Fa-f]{4}$/.test(s.slice(next + 2, next + 6))) {
    const lo = parseInt(s.slice(next + 2, next + 6), 16);
    if (lo >= 0xdc00 && lo <= 0xdfff) {
      out.push(String.fromCharCode(hi, lo));
      return next + 6;
    }
  }
  out.push(String.fromCharCode(hi));
  return next;
}

function readBraces(s: string, i: number, out: Out, at: number): number {
  const end = s.indexOf('}', i);
  const h = end === -1 ? '' : s.slice(i + 1, end);
  if (!/^[0-9A-Fa-f]{1,8}$/.test(h)) throw new EscapeError('\\u{…} needs 1 to 6 hex digits.', at);
  out.push(codePoint(parseInt(h, 16), at));
  return end + 1;
}

function unescapeBackslash(s: string, handle: EscapeHandler, strict = true): string {
  const out = new Out();
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    if (c !== '\\') {
      out.push(c);
      i++;
      continue;
    }
    if (i + 1 >= s.length) {
      if (!strict) {
        out.push('\\');
        break;
      }
      throw new EscapeError('The text ends with a lone backslash.', i);
    }
    i = handle(s, i, out);
  }
  out.flush();
  return out.text;
}

const COMMON: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '\\': '\\', "'": "'", '"': '"' };

function unknownEscape(s: string, i: number): never {
  throw new EscapeError(`Unknown escape sequence \\${String.fromCodePoint(s.codePointAt(i + 1)!)}.`, i);
}

const jsHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'x') {
    out.push(String.fromCharCode(hexAt(s, i + 2, 2, '\\x', i)));
    return i + 4;
  }
  if (e === 'u') return s[i + 2] === '{' ? readBraces(s, i + 2, out, i) : readU4(s, i + 2, out, i);
  if (e === '0' && !/\d/.test(s[i + 2] ?? '')) {
    out.push('\0');
    return i + 2;
  }
  if (e === '\r') return s[i + 2] === '\n' ? i + 3 : i + 2; // line continuation
  if (e === '\n' || e === '\u2028' || e === '\u2029') return i + 2;
  if (/[0-7]/.test(e)) {
    // Legacy octal escape (not allowed in strict mode or templates, but still seen in the wild).
    const oct = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/.exec(s.slice(i + 1))![0];
    out.push(String.fromCharCode(parseInt(oct, 8)));
    return i + 1 + oct.length;
  }
  out.push(COMMON[e] ?? String.fromCodePoint(s.codePointAt(i + 1)!)); // identity escape: \` \$ \q …
  return i + 1 + String.fromCodePoint(s.codePointAt(i + 1)!).length;
};

const jsonHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'u') return readU4(s, i + 2, out, i);
  if (e === '/') {
    out.push('/');
    return i + 2;
  }
  if (e !== 'v' && e !== "'" && COMMON[e]) {
    out.push(COMMON[e]);
    return i + 2;
  }
  unknownEscape(s, i);
};

const pythonHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'x') {
    out.push(String.fromCharCode(hexAt(s, i + 2, 2, '\\x', i)));
    return i + 4;
  }
  if (e === 'u') {
    out.push(String.fromCharCode(hexAt(s, i + 2, 4, '\\u', i)));
    return i + 6;
  }
  if (e === 'U') {
    out.push(codePoint(hexAt(s, i + 2, 8, '\\U', i), i));
    return i + 10;
  }
  if (e === 'a') {
    out.push('\x07');
    return i + 2;
  }
  if (e === '\n') return i + 2;
  if (/[0-7]/.test(e)) {
    const oct = /^[0-7]{1,3}/.exec(s.slice(i + 1))![0];
    out.push(String.fromCharCode(parseInt(oct, 8)));
    return i + 1 + oct.length;
  }
  if (COMMON[e]) {
    out.push(COMMON[e]);
    return i + 2;
  }
  out.push('\\'); // Python keeps unknown escapes as written
  return i + 1;
};

function octalBytes(s: string, i: number, out: Out, max: number): number {
  const oct = /^[0-7]{1,3}/.exec(s.slice(i + 1))![0];
  const val = parseInt(oct, 8);
  if (val > max) throw new EscapeError(`Octal escape \\${oct} is too large.`, i);
  out.byte(val, i);
  return i + 1 + oct.length;
}

const javaHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'u') {
    let j = i + 1;
    while (s[j] === 'u') j++;
    return readU4(s, j, out, i);
  }
  if (e === 's') {
    out.push(' ');
    return i + 2;
  }
  if (/[0-7]/.test(e)) {
    const oct = /^[0-7]{1,3}/.exec(s.slice(i + 1))![0];
    const take = oct.length === 3 && oct[0] > '3' ? oct.slice(0, 2) : oct;
    out.push(String.fromCharCode(parseInt(take, 8)));
    return i + 1 + take.length;
  }
  if (e !== 'v' && COMMON[e]) {
    out.push(COMMON[e]);
    return i + 2;
  }
  if (e === '\n') return i + 2; // text blocks
  unknownEscape(s, i);
};

const cHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'x') {
    const m = /^[0-9A-Fa-f]+/.exec(s.slice(i + 2));
    if (!m) throw new EscapeError('\\x needs hex digits.', i);
    const val = parseInt(m[0], 16);
    if (val > 0xff) throw new EscapeError(`\\x${m[0]} is too large for a char (hex escapes read every following hex digit).`, i);
    out.byte(val, i);
    return i + 2 + m[0].length;
  }
  if (e === 'u' || e === 'U') {
    const n = e === 'u' ? 4 : 8;
    out.push(codePoint(hexAt(s, i + 2, n, `\\${e}`, i), i));
    return i + 2 + n;
  }
  if (/[0-7]/.test(e)) return octalBytes(s, i, out, 0xff);
  const extra: Record<string, string> = { a: '\x07', '?': '?', e: '\x1b' };
  if (COMMON[e] ?? extra[e]) {
    out.push(COMMON[e] ?? extra[e]);
    return i + 2;
  }
  if (e === '\n') return i + 2;
  unknownEscape(s, i);
};

const csharpHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'u') return readU4(s, i + 2, out, i);
  if (e === 'U') {
    out.push(codePoint(hexAt(s, i + 2, 8, '\\U', i), i));
    return i + 10;
  }
  if (e === 'x') {
    const m = /^[0-9A-Fa-f]{1,4}/.exec(s.slice(i + 2));
    if (!m) throw new EscapeError('\\x needs 1 to 4 hex digits.', i);
    out.push(String.fromCharCode(parseInt(m[0], 16)));
    return i + 2 + m[0].length;
  }
  const extra: Record<string, string> = { a: '\x07', '0': '\0', e: '\x1b' };
  if (COMMON[e] ?? extra[e]) {
    out.push(COMMON[e] ?? extra[e]);
    return i + 2;
  }
  unknownEscape(s, i);
};

const goHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  if (e === 'x') {
    out.byte(hexAt(s, i + 2, 2, '\\x', i), i);
    return i + 4;
  }
  if (e === 'u' || e === 'U') {
    const n = e === 'u' ? 4 : 8;
    const cp = hexAt(s, i + 2, n, `\\${e}`, i);
    if (cp >= 0xd800 && cp <= 0xdfff) throw new EscapeError('Go doesn’t allow surrogate halves in \\u escapes.', i);
    out.push(codePoint(cp, i));
    return i + 2 + n;
  }
  if (/[0-7]/.test(e)) {
    if (!/^[0-7]{3}/.test(s.slice(i + 1))) throw new EscapeError('Octal escapes in Go need exactly 3 digits.', i);
    return octalBytes(s, i, out, 0xff);
  }
  if (e === 'a') {
    out.push('\x07');
    return i + 2;
  }
  if (e !== "'" && COMMON[e]) {
    out.push(COMMON[e]);
    return i + 2;
  }
  unknownEscape(s, i);
};

const mysqlHandler: EscapeHandler = (s, i, out) => {
  const e = s[i + 1];
  const T: Record<string, string> = { '0': '\0', "'": "'", '"': '"', b: '\b', n: '\n', r: '\r', t: '\t', Z: '\x1a', '\\': '\\', '%': '\\%', _: '\\_' };
  const cp = String.fromCodePoint(s.codePointAt(i + 1)!);
  out.push(T[e] ?? cp);
  return i + 1 + cp.length;
};

function unescapeRegex(s: string): string {
  return unescapeBackslash(s, (str, i, out) => {
    const e = str[i + 1];
    if (/[\\^$.*+?()[\]{}|/\-,:=!<>#&~'"`@%;\s]/.test(e)) {
      out.push(e);
      return i + 2;
    }
    const simple: Record<string, string> = { n: '\n', r: '\r', t: '\t', f: '\f', v: '\v' };
    if (simple[e]) {
      out.push(simple[e]);
      return i + 2;
    }
    if (e === '0' && !/\d/.test(str[i + 2] ?? '')) {
      out.push('\0');
      return i + 2;
    }
    if (e === 'x') {
      out.push(String.fromCharCode(hexAt(str, i + 2, 2, '\\x', i)));
      return i + 4;
    }
    if (e === 'u') return str[i + 2] === '{' ? readBraces(str, i + 2, out, i) : readU4(str, i + 2, out, i);
    throw new EscapeError(`\\${e} is a pattern class or assertion, not an escaped character.`, i);
  });
}

function unescapeUnicode(s: string): string {
  return unescapeBackslash(
    s,
    (str, i, out) => {
      const e = str[i + 1];
      if (e === '\\') {
        out.push('\\');
        return i + 2;
      }
      if (e === 'u' && str[i + 2] === '{') return readBraces(str, i + 2, out, i);
      if (e === 'u' && /^[0-9A-Fa-f]{4}/.test(str.slice(i + 2))) return readU4(str, i + 2, out, i);
      if (e === 'x' && /^[0-9A-Fa-f]{2}/.test(str.slice(i + 2))) {
        out.byte(parseInt(str.slice(i + 2, i + 4), 16), i);
        return i + 4;
      }
      out.push('\\');
      return i + 1;
    },
    false,
  );
}

/** Reads a POSIX shell word: 'single', "double" (\ before $ ` " \ newline), and unquoted \x. */
function unescapeShell(s: string): string {
  let out = '';
  let i = 0;
  const t = s.replace(/^\s+|\s+$/g, '');
  while (i < t.length) {
    const c = t[i];
    if (c === "'") {
      const end = t.indexOf("'", i + 1);
      if (end === -1) throw new EscapeError('Unterminated single quote.', i);
      out += t.slice(i + 1, end);
      i = end + 1;
    } else if (c === '"') {
      let j = i + 1;
      for (;;) {
        if (j >= t.length) throw new EscapeError('Unterminated double quote.', i);
        const d = t[j];
        if (d === '"') break;
        if (d === '\\' && '$`"\\\n'.includes(t[j + 1] ?? '')) {
          if (t[j + 1] !== '\n') out += t[j + 1];
          j += 2;
          continue;
        }
        if (d === '$' || d === '`') throw new EscapeError(`Unescaped ${d} inside double quotes would be expanded by the shell.`, j);
        out += d;
        j++;
      }
      i = j + 1;
    } else if (c === '$' && t[i + 1] === "'") {
      // Bash ANSI-C quoting: $'…'
      let j = i + 2;
      let body = '';
      while (j < t.length && t[j] !== "'") {
        if (t[j] === '\\' && j + 1 < t.length) {
          body += t.slice(j, j + 2);
          j += 2;
        } else body += t[j++];
      }
      if (j >= t.length) throw new EscapeError("Unterminated $'…' quote.", i);
      out += unescapeBackslash(body, cHandler);
      i = j + 1;
    } else if (c === '\\') {
      if (t[i + 1] === undefined) throw new EscapeError('The text ends with a lone backslash.', i);
      if (t[i + 1] !== '\n') out += t[i + 1];
      i += 2;
    } else if (/\s/.test(c)) {
      throw new EscapeError('Unquoted whitespace: this is more than one shell word.', i);
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function stripWrap(s: string, open: RegExp, close: RegExp, name: string): string {
  const t = s.trim();
  if (!open.test(t[0] ?? '') || t.length < 2 || !close.test(t[t.length - 1])) throw new EscapeError(`Expected a ${name} string wrapped in quotes.`, 0);
  return t.slice(1, -1);
}

function unescapePowershellSingle(s: string): string {
  const body = stripWrap(s, /['\u2018\u2019\u201a\u201b]/, /['\u2018\u2019\u201a\u201b]/, 'single-quoted');
  return body.replace(/(['\u2018\u2019\u201a\u201b])\1?/g, '$1');
}

function unescapePowershellDouble(s: string): string {
  const body = stripWrap(s, /["\u201c\u201d\u201e]/, /["\u201c\u201d\u201e]/, 'double-quoted');
  let out = '';
  const T: Record<string, string> = { '0': '\0', a: '\x07', b: '\b', e: '\x1b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v' };
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '`') {
      const e = body[i + 1];
      if (e === undefined) throw new EscapeError('The text ends with a lone backtick.', i + 1);
      if (e === 'u' && body[i + 2] === '{') {
        const end = body.indexOf('}', i);
        const h = body.slice(i + 3, end);
        if (end === -1 || !/^[0-9A-Fa-f]{1,6}$/.test(h)) throw new EscapeError('`u{…} needs 1 to 6 hex digits.', i + 1);
        out += codePoint(parseInt(h, 16), i + 1);
        i = end;
        continue;
      }
      out += T[e] ?? e;
      i++;
    } else if (/["\u201c\u201d\u201e]/.test(c) && /["\u201c\u201d\u201e]/.test(body[i + 1] ?? '')) {
      out += c;
      i++;
    } else out += c;
  }
  return out;
}

function escapeCsv(s: string): string {
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function unescapeCsv(s: string): string {
  if (!s.startsWith('"')) {
    if (s.includes('"')) throw new EscapeError('A quote inside an unquoted field; the field should be wrapped in quotes.', s.indexOf('"'));
    return s;
  }
  let out = '';
  for (let i = 1; i < s.length; i++) {
    if (s[i] === '"') {
      if (s[i + 1] === '"') {
        out += '"';
        i++;
      } else {
        if (i !== s.length - 1) throw new EscapeError('Text after the closing quote.', i + 1);
        return out;
      }
    } else out += s[i];
  }
  throw new EscapeError('Unterminated quoted field.', 0);
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', euro: '€', pound: '£', yen: '¥', cent: '¢', sect: '§', deg: '°',
  middot: '·', bull: '•', times: '×', divide: '÷', plusmn: '±', para: '¶', shy: '\u00ad', zwj: '\u200d', zwnj: '\u200c',
};

function unescapeXml(s: string): string {
  return s.replace(/&(#x[0-9A-Fa-f]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (m, body: string, offset: number) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) throw new EscapeError(`${m} isn’t a valid character reference.`, offset);
      return String.fromCodePoint(cp);
    }
    return ENTITIES[body] ?? m;
  });
}

function unescapeUrl(s: string): string {
  const bad = /%(?![0-9A-Fa-f]{2})/.exec(s);
  if (bad) throw new EscapeError('% must be followed by two hex digits.', bad.index);
  try {
    return decodeURIComponent(s);
  } catch {
    throw new EscapeError('These percent escapes aren’t valid UTF-8.', 0);
  }
}

// ---------------------------------------------------------------------------------------------
// Registry

interface Impl extends FormatInfo {
  escape: (s: string, o: EscapeOptions) => string;
  unescape: (s: string) => string;
}

const IMPLS: Impl[] = [
  { id: 'json', label: 'JSON string', hint: 'Goes between double quotes in JSON.', asciiOption: true, escape: escapeJson, unescape: (s) => unescapeBackslash(s, jsonHandler) },
  { id: 'js-single', label: "JavaScript / TypeScript '…'", hint: 'Goes between single quotes.', asciiOption: true, escape: (s, o) => escapeJs(s, "'", o), unescape: (s) => unescapeBackslash(s, jsHandler) },
  { id: 'js-double', label: 'JavaScript / TypeScript "…"', hint: 'Goes between double quotes.', asciiOption: true, escape: (s, o) => escapeJs(s, '"', o), unescape: (s) => unescapeBackslash(s, jsHandler) },
  { id: 'js-template', label: 'JavaScript / TypeScript `…`', hint: 'Goes between backticks; ${ is escaped so nothing is interpolated.', asciiOption: true, escape: (s, o) => escapeJs(s, '`', o), unescape: (s) => unescapeBackslash(s, jsHandler) },
  { id: 'python', label: 'Python', hint: "Goes between '…' or \"…\" (not a raw string).", asciiOption: true, escape: escapePython, unescape: (s) => unescapeBackslash(s, pythonHandler) },
  { id: 'java', label: 'Java', hint: 'Goes between double quotes.', asciiOption: true, escape: escapeJava, unescape: (s) => unescapeBackslash(s, javaHandler) },
  { id: 'c', label: 'C / C++', hint: 'Goes between double quotes. Non-ASCII is escaped as UTF-8 bytes.', asciiOption: true, escape: escapeC, unescape: (s) => unescapeBackslash(s, cHandler) },
  { id: 'csharp', label: 'C#', hint: 'Goes between double quotes (a regular, not verbatim, string).', asciiOption: true, escape: escapeCsharp, unescape: (s) => unescapeBackslash(s, csharpHandler) },
  { id: 'go', label: 'Go', hint: 'Goes between double quotes (an interpreted string literal).', asciiOption: true, escape: escapeGo, unescape: (s) => unescapeBackslash(s, goHandler) },
  { id: 'sql', label: "SQL (standard '')", hint: "Goes between single quotes. Prefer query parameters over building SQL by hand.", asciiOption: false, escape: (s) => s.replace(/'/g, "''"), unescape: (s) => s.replace(/''/g, "'") },
  { id: 'sql-mysql', label: 'SQL (MySQL backslash)', hint: "Goes between single quotes in MySQL (without NO_BACKSLASH_ESCAPES).", asciiOption: false, escape: escapeMysql, unescape: (s) => unescapeBackslash(s.replace(/''/g, "\\'"), mysqlHandler) },
  { id: 'regex', label: 'Regular expression', hint: 'Matches the text literally; safe with the u flag and inside /…/.', asciiOption: false, escape: (s) => s.replace(REGEX_META, '\\$&'), unescape: unescapeRegex },
  { id: 'shell-single', label: "Shell (POSIX '…')", hint: 'A complete shell word: nothing inside is expanded.', asciiOption: false, escape: (s) => `'${s.replace(/'/g, "'\\''")}'`, unescape: unescapeShell },
  { id: 'shell-double', label: 'Shell (POSIX "…")', hint: 'A complete shell word. In interactive Bash, ! may still trigger history expansion.', asciiOption: false, escape: (s) => `"${s.replace(/[$`"\\]/g, '\\$&')}"`, unescape: unescapeShell },
  { id: 'powershell-single', label: "PowerShell '…'", hint: 'A complete PowerShell string: nothing inside is expanded.', asciiOption: false, escape: (s) => `'${s.replace(/['\u2018\u2019\u201a\u201b]/g, '$&$&')}'`, unescape: unescapePowershellSingle },
  { id: 'powershell-double', label: 'PowerShell "…"', hint: 'A complete PowerShell string with backtick escapes; $ is escaped so nothing expands.', asciiOption: false, escape: escapePowershellDouble, unescape: unescapePowershellDouble },
  { id: 'csv', label: 'CSV field', hint: 'One field (RFC 4180): quoted only when it needs to be.', asciiOption: false, escape: escapeCsv, unescape: unescapeCsv },
  { id: 'xml-text', label: 'XML / HTML text', hint: 'Element content.', asciiOption: false, escape: (s) => escapeXml(s, false), unescape: unescapeXml },
  { id: 'xml-attr', label: 'XML / HTML attribute', hint: 'Goes inside a quoted attribute value ("…" or \'…\').', asciiOption: false, escape: (s) => escapeXml(s, true), unescape: unescapeXml },
  { id: 'url', label: 'URL component', hint: 'Percent-encoded for a query value or path segment (encodeURIComponent).', asciiOption: false, escape: (s) => encodeURIComponent(s), unescape: unescapeUrl },
  { id: 'unicode-u', label: 'Unicode \\uXXXX', hint: 'Every non-ASCII or control character as UTF-16 \\uXXXX.', asciiOption: false, escape: (s) => escapeUnicode(s, 'u'), unescape: unescapeUnicode },
  { id: 'unicode-braces', label: 'Unicode \\u{…}', hint: 'Every non-ASCII or control character as a \\u{code point}.', asciiOption: false, escape: (s) => escapeUnicode(s, 'braces'), unescape: unescapeUnicode },
  { id: 'unicode-x', label: 'UTF-8 bytes \\xNN', hint: 'Every non-ASCII or control character as its UTF-8 bytes.', asciiOption: false, escape: (s) => escapeUnicode(s, 'x'), unescape: unescapeUnicode },
];

const BY_ID = new Map(IMPLS.map((f) => [f.id, f]));

export const FORMATS: FormatInfo[] = IMPLS.map(({ id, label, hint, asciiOption }) => ({ id, label, hint, asciiOption }));
export const FORMAT_IDS = FORMATS.map((f) => f.id);

function run(fn: () => string): EscapeResult {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    if (err instanceof EscapeError) return { ok: false, error: err.message, offset: err.offset };
    return { ok: false, error: err instanceof Error ? err.message : 'Couldn’t convert this text.' };
  }
}

export function escapeText(format: FormatId, text: string, opts: EscapeOptions = {}): EscapeResult {
  const f = BY_ID.get(format)!;
  return run(() => {
    if (format !== 'xml-text' && format !== 'xml-attr' && format !== 'sql' && format !== 'csv' && !format.startsWith('shell') && !format.startsWith('powershell')) checkWellFormed(text);
    return f.escape(text, opts);
  });
}

export function unescapeText(format: FormatId, text: string): EscapeResult {
  const f = BY_ID.get(format)!;
  return run(() => f.unescape(text));
}
