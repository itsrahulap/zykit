// Strict JSON parser and formatter (RFC 8259). Pure TypeScript, no recursion, so deeply
// nested input can't overflow the call stack. Scalars keep their source text, which means
// big numbers (beyond 2^53) and string escapes come out exactly as they went in.

export type JsonNode =
  | { type: 'object'; entries: JsonEntry[] }
  | { type: 'array'; items: JsonNode[] }
  | { type: 'string'; raw: string }
  | { type: 'number'; raw: string }
  | { type: 'literal'; raw: 'true' | 'false' | 'null' };

export interface JsonEntry {
  /** Decoded property name (for sorting and duplicate checks). */
  key: string;
  /** Property name exactly as written, including quotes. */
  keyRaw: string;
  value: JsonNode;
}

export interface JsonStats {
  /** Total number of object properties. */
  keys: number;
  /** Deepest nesting of objects/arrays (a scalar alone is depth 0). */
  maxDepth: number;
  /** Numbers that JSON.parse would round (more than 15 significant digits). */
  bigNumbers: number;
  /** Property names repeated within the same object (first few). */
  duplicateKeys: string[];
}

export interface JsonError {
  message: string;
  /** UTF-16 offset into the input. */
  offset: number;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
}

export type ParseResult = { ok: true; value: JsonNode; stats: JsonStats } | { ok: false; error: JsonError };

/** Integers/decimals with more significant digits than this may lose precision as a JS number. */
export const SAFE_DIGITS = 15;
const MAX_DUPLICATES = 5;

class ParseError extends Error {
  offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

type Frame =
  | { kind: 'object'; node: Extract<JsonNode, { type: 'object' }>; open: number; seen: Set<string>; key: string; keyRaw: string }
  | { kind: 'array'; node: Extract<JsonNode, { type: 'array' }>; open: number };

/** 1-based line and column for an offset. */
export function lineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = text.indexOf('\n'); i !== -1 && i < offset; i = text.indexOf('\n', i + 1)) {
    line++;
    lineStart = i + 1;
  }
  return { line, column: offset - lineStart + 1 };
}

const isWs = (c: number) => c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
const isDigit = (c: number) => c >= 0x30 && c <= 0x39;
const isHex = (c: number) => isDigit(c) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
const IDENT = /[A-Za-z_$][\w$]*/y;

/** Human description of the character at `i` for error messages. */
function describe(text: string, i: number): string {
  if (i >= text.length) return 'end of input';
  const cp = text.codePointAt(i)!;
  if (cp < 0x20 || cp === 0x7f || cp === 0xa0 || (cp >= 0x2000 && cp <= 0x200f) || cp === 0x2028 || cp === 0x2029 || cp === 0xfeff) {
    return `character U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  return `'${String.fromCodePoint(cp)}'`;
}

function unexpectedValue(text: string, i: number, afterComma: boolean): ParseError {
  const c = text[i];
  if (i >= text.length) return new ParseError('Unexpected end of input — expected a value', i);
  if ((c === ']' || c === '}') && afterComma) return new ParseError(`Unexpected '${c}' — trailing comma?`, i);
  if (c === "'") return new ParseError('Strings must use double quotes, not single quotes', i);
  if (c === '/') return new ParseError('Comments aren’t allowed in JSON', i);
  if (c === '+') return new ParseError('Numbers can’t start with \'+\'', i);
  if (c === '.') return new ParseError('Numbers need a digit before the decimal point', i);
  if (c === ',') return new ParseError("Unexpected ',' — expected a value", i);
  IDENT.lastIndex = i;
  const word = IDENT.exec(text)?.[0];
  if (word) {
    if (word === 'NaN' || word === 'Infinity') return new ParseError(`${word} isn’t valid JSON — use null or a number`, i);
    if (word === 'undefined') return new ParseError('undefined isn’t valid JSON — use null', i);
    const lower = word.toLowerCase();
    if (lower === 'true' || lower === 'false' || lower === 'null') return new ParseError(`JSON literals are lowercase — use '${lower}'`, i);
    if (lower === 'none') return new ParseError("Unexpected 'None' — use 'null'", i);
    for (const lit of ['true', 'false', 'null']) {
      if (lit.startsWith(word) || word.startsWith(lit)) return new ParseError(`Unexpected token '${word}' — did you mean '${lit}'?`, i);
    }
    return new ParseError(`Unexpected token '${word}' — strings must be in double quotes`, i);
  }
  return new ParseError(`Unexpected ${describe(text, i)} — expected a value`, i);
}

/** Reads a string starting at the opening quote. Returns the index after the closing quote. */
function scanString(text: string, start: number): number {
  let i = start + 1;
  for (;;) {
    if (i >= text.length) throw new ParseError('Unterminated string — missing closing quote', start);
    const c = text.charCodeAt(i);
    if (c === 0x22) return i + 1;
    if (c === 0x5c) {
      const e = text[i + 1];
      if (e === undefined) throw new ParseError('Unterminated string — missing closing quote', start);
      if (e === 'u') {
        for (let k = 2; k < 6; k++) {
          if (!isHex(text.charCodeAt(i + k))) throw new ParseError('Invalid unicode escape — \\u must be followed by 4 hex digits', i);
        }
        i += 6;
        continue;
      }
      if ('"\\/bfnrt'.includes(e)) {
        i += 2;
        continue;
      }
      throw new ParseError(`Invalid escape sequence '\\${e}'`, i);
    }
    if (c === 0x0a || c === 0x0d) throw new ParseError('Unterminated string — line break inside a string (use \\n)', i);
    if (c < 0x20) throw new ParseError(`Unescaped ${describe(text, i)} in string — control characters must be escaped`, i);
    i++;
  }
}

const ESCAPES: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

/** Decodes a validated JSON string literal (including quotes). */
export function decodeString(raw: string): string {
  if (!raw.includes('\\')) return raw.slice(1, -1);
  let out = '';
  for (let i = 1; i < raw.length - 1; i++) {
    const c = raw[i];
    if (c !== '\\') {
      out += c;
      continue;
    }
    const e = raw[++i];
    if (e === 'u') {
      out += String.fromCharCode(parseInt(raw.slice(i + 1, i + 5), 16));
      i += 4;
    } else out += ESCAPES[e];
  }
  return out;
}

/** Reads a number. Returns the index after it. */
function scanNumber(text: string, start: number): number {
  let i = start;
  if (text[i] === '-') {
    i++;
    if (!isDigit(text.charCodeAt(i))) throw new ParseError("Expected a digit after '-'", i);
  }
  if (text[i] === '0') {
    i++;
    if (isDigit(text.charCodeAt(i))) throw new ParseError('Numbers can’t have leading zeros', start);
  } else while (isDigit(text.charCodeAt(i))) i++;
  if (text[i] === '.') {
    i++;
    if (!isDigit(text.charCodeAt(i))) throw new ParseError('Expected a digit after the decimal point', i);
    while (isDigit(text.charCodeAt(i))) i++;
  }
  if (text[i] === 'e' || text[i] === 'E') {
    i++;
    if (text[i] === '+' || text[i] === '-') i++;
    if (!isDigit(text.charCodeAt(i))) throw new ParseError('Expected a digit in the exponent', i);
    while (isDigit(text.charCodeAt(i))) i++;
  }
  return i;
}

/** True when a number literal has more significant digits than a double can hold exactly. */
export function isBigNumber(raw: string): boolean {
  const mantissa = raw.replace(/^-/, '').replace(/[eE].*$/, '');
  const [int, frac = ''] = mantissa.split('.');
  const digits = (int + frac.replace(/0+$/, '')).replace(/^0+/, '');
  return digits.length > SAFE_DIGITS;
}

const Mode = { Value: 0, Key: 1, After: 2, End: 3 } as const;
type Mode = (typeof Mode)[keyof typeof Mode];

/** Parses and validates JSON, reporting the exact position of the first error. */
export function parseJson(text: string): ParseResult {
  try {
    return parseOrThrow(text);
  } catch (e) {
    if (!(e instanceof ParseError)) throw e;
    return { ok: false, error: { message: e.message, offset: e.offset, ...lineCol(text, e.offset) } };
  }
}

function parseOrThrow(text: string): ParseResult {
  const n = text.length;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const skip = () => {
    while (i < n && isWs(text.charCodeAt(i))) i++;
  };
  skip();
  if (i >= n) throw new ParseError('The input is empty — nothing to parse', 0);

  const stack: Frame[] = [];
  const stats: JsonStats = { keys: 0, maxDepth: 0, bigNumbers: 0, duplicateKeys: [] };
  let root: JsonNode | null = null;
  let mode: Mode = Mode.Value;
  let afterComma = false;

  const complete = (node: JsonNode) => {
    const top = stack[stack.length - 1];
    if (!top) {
      root = node;
      mode = Mode.End;
      return;
    }
    if (top.kind === 'array') top.node.items.push(node);
    else top.node.entries.push({ key: top.key, keyRaw: top.keyRaw, value: node });
    mode = Mode.After;
  };
  const open = (frame: Frame) => {
    stack.push(frame);
    if (stack.length > stats.maxDepth) stats.maxDepth = stack.length;
  };

  for (;;) {
    skip();
    const c = text[i];
    if (mode === Mode.Value) {
      if (c === '{') {
        open({ kind: 'object', node: { type: 'object', entries: [] }, open: i, seen: new Set(), key: '', keyRaw: '' });
        i++;
        skip();
        if (text[i] === '}') {
          i++;
          complete(stack.pop()!.node);
        } else {
          mode = Mode.Key;
          afterComma = false;
        }
      } else if (c === '[') {
        open({ kind: 'array', node: { type: 'array', items: [] }, open: i });
        i++;
        skip();
        if (text[i] === ']') {
          i++;
          complete(stack.pop()!.node);
        } else afterComma = false;
      } else if (c === '"') {
        const end = scanString(text, i);
        const raw = text.slice(i, end);
        i = end;
        complete({ type: 'string', raw });
      } else if (c === '-' || (c >= '0' && c <= '9')) {
        const end = scanNumber(text, i);
        const raw = text.slice(i, end);
        i = end;
        if (isBigNumber(raw)) stats.bigNumbers++;
        complete({ type: 'number', raw });
      } else if (text.startsWith('true', i) || text.startsWith('false', i) || text.startsWith('null', i)) {
        const raw = c === 't' ? 'true' : c === 'f' ? 'false' : 'null';
        // Reject "nullx" / "trueish": the literal must end here.
        IDENT.lastIndex = i;
        const word = IDENT.exec(text)?.[0];
        if (word !== raw) throw unexpectedValue(text, i, false);
        i += raw.length;
        complete({ type: 'literal', raw });
      } else throw unexpectedValue(text, i, afterComma);
    } else if (mode === Mode.Key) {
      const top = stack[stack.length - 1] as Extract<Frame, { kind: 'object' }>;
      if (c !== '"') {
        if (i >= n) throw new ParseError(`Unexpected end of input — expected a property name (object opened at line ${lineCol(text, top.open).line})`, i);
        if (c === '}' && afterComma) throw new ParseError("Unexpected '}' — trailing comma?", i);
        if (c === "'") throw new ParseError('Property names must use double quotes, not single quotes', i);
        if (c === '/') throw new ParseError('Comments aren’t allowed in JSON', i);
        IDENT.lastIndex = i;
        if (IDENT.test(text)) throw new ParseError('Property names must be in double quotes', i);
        throw new ParseError(`Unexpected ${describe(text, i)} — expected a property name in double quotes`, i);
      }
      const end = scanString(text, i);
      top.keyRaw = text.slice(i, end);
      top.key = decodeString(top.keyRaw);
      stats.keys++;
      if (top.seen.has(top.key)) {
        if (stats.duplicateKeys.length < MAX_DUPLICATES && !stats.duplicateKeys.includes(top.key)) stats.duplicateKeys.push(top.key);
      } else top.seen.add(top.key);
      i = end;
      skip();
      if (text[i] !== ':') {
        if (text[i] === '=') throw new ParseError("Expected ':' after property name, not '='", i);
        throw new ParseError(`Expected ':' after property name, found ${describe(text, i)}`, i);
      }
      i++;
      mode = Mode.Value;
      afterComma = false;
    } else if (mode === Mode.After) {
      const top = stack[stack.length - 1];
      const close = top.kind === 'object' ? '}' : ']';
      if (c === ',') {
        i++;
        mode = top.kind === 'object' ? Mode.Key : Mode.Value;
        afterComma = true;
      } else if (c === close) {
        i++;
        stack.pop();
        complete(top.node);
      } else if (i >= n) {
        const what = top.kind === 'object' ? 'object' : 'array';
        throw new ParseError(`Unexpected end of input — expected ',' or '${close}' (${what} opened at line ${lineCol(text, top.open).line})`, i);
      } else {
        const where = top.kind === 'object' ? 'property value' : 'array item';
        const likelyValue = c === '"' || c === '{' || c === '[' || c === '-' || (c >= '0' && c <= '9') || /[tfn]/.test(c);
        const hint = likelyValue ? ' — missing comma?' : (c === '}' || c === ']') ? ` — mismatched bracket?` : '';
        throw new ParseError(`Expected ',' or '${close}' after ${where}, found ${describe(text, i)}${hint}`, i);
      }
    } else {
      if (i >= n) break;
      throw new ParseError(`Unexpected ${describe(text, i)} after the end of the JSON value`, i);
    }
  }
  return { ok: true, value: root!, stats };
}

export type Indent = 2 | 4 | 'tab';

export interface FormatOptions {
  /** null minifies. */
  indent: Indent | null;
  sortKeys?: boolean;
}

const compareKeys = (a: JsonEntry, b: JsonEntry) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/** Serialises a parsed tree. Iterative, so depth is limited only by memory. */
export function formatJson(root: JsonNode, { indent, sortKeys = false }: FormatOptions): string {
  const unit = indent === null ? '' : indent === 'tab' ? '\t' : ' '.repeat(indent);
  const pretty = indent !== null;
  const colon = pretty ? ': ' : ':';
  const pads = [''];
  const pad = (depth: number) => {
    while (pads.length <= depth) pads.push(pads[pads.length - 1] + unit);
    return pads[depth];
  };
  const out: string[] = [];
  type Open = { entries: JsonEntry[]; i: number } | { items: JsonNode[]; i: number };
  const stack: Open[] = [];

  const write = (node: JsonNode) => {
    if (node.type === 'object') {
      if (!node.entries.length) out.push('{}');
      else {
        out.push('{');
        stack.push({ entries: sortKeys ? [...node.entries].sort(compareKeys) : node.entries, i: 0 });
      }
    } else if (node.type === 'array') {
      if (!node.items.length) out.push('[]');
      else {
        out.push('[');
        stack.push({ items: node.items, i: 0 });
      }
    } else out.push(node.raw);
  };

  write(root);
  while (stack.length) {
    const top = stack[stack.length - 1];
    const list = 'entries' in top ? top.entries : top.items;
    if (top.i < list.length) {
      if (top.i > 0) out.push(',');
      if (pretty) out.push('\n', pad(stack.length));
      let child: JsonNode;
      if ('entries' in top) {
        const e = top.entries[top.i];
        out.push(e.keyRaw, colon);
        child = e.value;
      } else child = top.items[top.i];
      top.i++;
      write(child);
    } else {
      stack.pop();
      if (pretty) out.push('\n', pad(stack.length));
      out.push('entries' in top ? '}' : ']');
    }
  }
  return out.join('');
}

/** UTF-8 byte length without allocating an encoded copy. */
export function utf8Length(s: string): number {
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

/** Source line with a caret under the error column, e.g. for display in a code block. */
export function errorSnippet(text: string, error: Pick<JsonError, 'line' | 'column'>, width = 80): string {
  const lines = text.split('\n');
  const raw = (lines[error.line - 1] ?? '').replace(/\r$/, '');
  let start = 0;
  let col = error.column - 1;
  if (raw.length > width) {
    start = Math.max(0, Math.min(col - Math.floor(width / 2), raw.length - width));
  }
  const prefix = start > 0 ? '…' : '';
  const suffix = start + width < raw.length ? '…' : '';
  const shown = raw.slice(start, start + width);
  col -= start;
  const gutter = `${error.line} | `;
  const caretPad = shown.slice(0, col).replace(/[^\t]/g, ' ');
  return `${gutter}${prefix}${shown}${suffix}\n${' '.repeat(gutter.length - 2)}| ${prefix ? ' ' : ''}${caretPad}^`;
}
