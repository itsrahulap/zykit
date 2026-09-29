// Helpers for pointing at a position in text: offset → line/column, a caret snippet,
// and JSON.parse with a located error. Used by the data-conversion tools.

export interface TextError {
  message: string;
  /** 1-based. */
  line: number;
  /** 1-based, in UTF-16 code units. */
  column: number;
  offset: number;
}

/** 1-based line and column of `offset` in `text`. */
export function lineCol(text: string, offset: number): { line: number; column: number } {
  const end = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lineStart = 0;
  for (let i = text.indexOf('\n'); i !== -1 && i < end; i = text.indexOf('\n', i + 1)) {
    line++;
    lineStart = i + 1;
  }
  return { line, column: end - lineStart + 1 };
}

/** Offset of a 1-based line/column. */
export function offsetOf(text: string, line: number, column: number): number {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const i = text.indexOf('\n', offset);
    if (i === -1) return text.length;
    offset = i + 1;
  }
  return Math.min(text.length, offset + Math.max(0, column - 1));
}

export function textError(text: string, offset: number, message: string): TextError {
  return { message, offset, ...lineCol(text, offset) };
}

/** The offending line with a caret under the column, clipped to `width` characters. */
export function errorSnippet(text: string, error: Pick<TextError, 'line' | 'column'>, width = 80): string {
  const lines = text.split('\n');
  const raw = (lines[error.line - 1] ?? '').replace(/\r$/, '');
  let start = 0;
  let col = error.column - 1;
  if (raw.length > width) start = Math.max(0, Math.min(col - Math.floor(width / 2), raw.length - width));
  const prefix = start > 0 ? '…' : '';
  const suffix = start + width < raw.length ? '…' : '';
  const shown = raw.slice(start, start + width);
  col -= start;
  const gutter = `${error.line} | `;
  const caretPad = shown.slice(0, Math.max(0, col)).replace(/[^\t]/g, ' ');
  return `${gutter}${prefix}${shown}${suffix}\n${' '.repeat(gutter.length - 2)}| ${prefix ? ' ' : ''}${caretPad}^`;
}

export type JsonParse = { ok: true; value: unknown } | { ok: false; error: TextError };

/** JSON.parse, but a failure comes back with a line and column. */
export function parseJsonText(text: string): JsonParse {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Invalid JSON';
    let offset = text.length;
    const lc = /\(line (\d+) column (\d+)\)/.exec(raw);
    const pos = /at position (\d+)/.exec(raw);
    if (lc) offset = offsetOf(text, Number(lc[1]), Number(lc[2]));
    else if (pos) offset = Number(pos[1]);
    else offset = jsonErrorOffset(text);
    const message = raw
      .replace(/, ".*" is not valid JSON$/s, '')
      .replace(/\s*\(line \d+ column \d+\)/, '')
      .replace(/\s+in JSON at position \d+/, '')
      .replace(/^JSON\.parse: /, '');
    return { ok: false, error: textError(text, offset, message || 'Invalid JSON') };
  }
}

const JSON_NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

/** Offset of the first character that makes `s` invalid JSON (s.length if it is only incomplete). */
export function jsonErrorOffset(s: string): number {
  const n = s.length;
  let i = 0;
  const ws = () => {
    while (i < n && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++;
  };
  const str = (): boolean => {
    i++;
    while (i < n) {
      const c = s.charCodeAt(i);
      if (c === 34) {
        i++;
        return true;
      }
      if (c === 92) {
        const e = s[i + 1];
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) return false;
          i += 6;
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) i += 2;
        else {
          i++;
          return false;
        }
      } else if (c < 0x20) return false;
      else i++;
    }
    return false;
  };
  const value = (depth: number): boolean => {
    if (depth > 10_000) return false;
    ws();
    const c = s[i];
    if (c === '{' || c === '[') {
      const close = c === '{' ? '}' : ']';
      i++;
      ws();
      if (s[i] === close) {
        i++;
        return true;
      }
      for (;;) {
        if (c === '{') {
          ws();
          if (s[i] !== '"' || !str()) return false;
          ws();
          if (s[i] !== ':') return false;
          i++;
        }
        if (!value(depth + 1)) return false;
        ws();
        if (s[i] === ',') {
          i++;
          continue;
        }
        if (s[i] === close) {
          i++;
          return true;
        }
        return false;
      }
    }
    if (c === '"') return str();
    for (const lit of ['true', 'false', 'null']) {
      if (s.startsWith(lit, i)) {
        i += lit.length;
        return true;
      }
    }
    JSON_NUMBER.lastIndex = i;
    if (JSON_NUMBER.test(s)) {
      i = JSON_NUMBER.lastIndex;
      return true;
    }
    return false;
  };
  if (!value(0)) return Math.min(i, n);
  ws();
  return i;
}
