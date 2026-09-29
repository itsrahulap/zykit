// Regex matching, replacement preview and a small pattern explainer. Pure logic.
// Matching can backtrack catastrophically, so the page runs it in a worker with a timeout.

export const MAX_MATCHES = 5000;
export const MAX_TEXT = 1_000_000;
export const TIMEOUT_MS = 1000;

export const FLAGS = [
  { flag: 'g', name: 'global', info: 'Find every match, not just the first.' },
  { flag: 'i', name: 'ignore case', info: 'Letters match regardless of case.' },
  {
    flag: 'm',
    name: 'multiline',
    info: '^ and $ match at the start and end of each line.',
  },
  { flag: 's', name: 'dotAll', info: '. also matches line breaks.' },
  {
    flag: 'u',
    name: 'unicode',
    info: 'Treat the pattern as Unicode code points; enables \\p{…}.',
  },
  {
    flag: 'y',
    name: 'sticky',
    info: 'Match only at lastIndex (each match must follow the previous one).',
  },
  {
    flag: 'd',
    name: 'indices',
    info: 'Record start and end indices for each capture group.',
  },
] as const;

export interface Match {
  index: number;
  end: number;
  text: string;
  /** Numbered groups ($1, $2, …); undefined when the group did not take part. */
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
  /** Group spans when the d flag is set. */
  indices?: ([number, number] | undefined)[];
}

export type MatchResult = { ok: true; matches: Match[]; truncated: boolean; replaced?: string } | { ok: false; error: string };

export function compile(pattern: string, flags: string): { ok: true; re: RegExp } | { ok: false; error: string } {
  try {
    return { ok: true, re: new RegExp(pattern, flags) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message.replace(/^Invalid regular expression: /, '') : 'Invalid pattern.',
    };
  }
}

export function findMatches(pattern: string, flags: string, text: string, max = MAX_MATCHES): MatchResult {
  const c = compile(pattern, flags);
  if (!c.ok) return c;
  const re = c.re;
  const matches: Match[] = [];
  let truncated = false;
  re.lastIndex = 0;
  for (;;) {
    const m = re.exec(text);
    if (!m) break;
    if (matches.length >= max) {
      truncated = true;
      break;
    }
    matches.push({
      index: m.index,
      end: m.index + m[0].length,
      text: m[0],
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } : {},
      indices: m.indices
        ? Array.from(m.indices)
            .slice(1)
            .map((p) => (p ? [p[0], p[1]] : undefined))
        : undefined,
    });
    if (!re.global) break;
    if (m[0].length === 0) {
      // Avoid an infinite loop on empty matches; step over a whole code point in unicode mode.
      const code = text.codePointAt(re.lastIndex);
      re.lastIndex += (re.unicode || (re as RegExp & { unicodeSets?: boolean }).unicodeSets) && code !== undefined && code > 0xffff ? 2 : 1;
      if (re.lastIndex > text.length) break;
    }
  }
  return { ok: true, matches, truncated };
}

export function replacePreview(pattern: string, flags: string, text: string, replacement: string): string {
  const c = compile(pattern, flags);
  if (!c.ok) return text;
  return text.replace(c.re, replacement);
}

export interface Segment {
  text: string;
  /** Index into the matches array, or -1 for unmatched text. */
  match: number;
}

/** Splits `text` into plain and matched runs for highlighting (rendered as text, never HTML). */
export function segments(text: string, matches: Match[]): Segment[] {
  const out: Segment[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index < pos || m.end === m.index) return;
    if (m.index > pos) out.push({ text: text.slice(pos, m.index), match: -1 });
    out.push({ text: text.slice(m.index, m.end), match: i });
    pos = m.end;
  });
  if (pos < text.length) out.push({ text: text.slice(pos), match: -1 });
  return out;
}

export function groupNames(pattern: string): string[] {
  const names: string[] = [];
  const re = /\(\?<([A-Za-z_$][\w$]*)>/g;
  for (let m = re.exec(pattern); m; m = re.exec(pattern)) names.push(m[1]);
  return names;
}

// ---------- Explainer ----------

export interface Token {
  text: string;
  kind: 'literal' | 'escape' | 'class' | 'group' | 'quantifier' | 'anchor' | 'alternation' | 'any' | 'backref';
  info: string;
}

const ESCAPES: Record<string, string> = {
  d: 'A digit (0–9)',
  D: 'Any character except a digit',
  w: 'A word character (letter, digit or _)',
  W: 'Any character except a word character',
  s: 'Whitespace (space, tab, line break, …)',
  S: 'Any character except whitespace',
  b: 'A word boundary',
  B: 'Not a word boundary',
  n: 'Line feed',
  r: 'Carriage return',
  t: 'Tab',
  v: 'Vertical tab',
  f: 'Form feed',
  '0': 'NUL character',
};

function readEscape(p: string, i: number): Token {
  const c = p[i + 1];
  if (c === undefined) return { text: '\\', kind: 'escape', info: 'Trailing backslash (invalid)' };
  if (c in ESCAPES)
    return {
      text: `\\${c}`,
      kind: c === 'b' || c === 'B' ? 'anchor' : 'escape',
      info: ESCAPES[c],
    };
  if (/[1-9]/.test(c)) {
    const num = /^\d+/.exec(p.slice(i + 1))![0];
    return {
      text: `\\${num}`,
      kind: 'backref',
      info: `Back-reference to group ${num}`,
    };
  }
  if (c === 'k') {
    const m = /^k<([^>]*)>/.exec(p.slice(i + 1));
    if (m)
      return {
        text: `\\${m[0]}`,
        kind: 'backref',
        info: `Back-reference to group “${m[1]}”`,
      };
  }
  if (c === 'p' || c === 'P') {
    const m = /^[pP]\{([^}]*)\}/.exec(p.slice(i + 1));
    if (m)
      return {
        text: `\\${m[0]}`,
        kind: 'escape',
        info: `${c === 'P' ? 'Not a' : 'A'} character with Unicode property ${m[1]}`,
      };
  }
  if (c === 'u') {
    const m = /^u(\{[0-9a-fA-F]+\}|[0-9a-fA-F]{4})/.exec(p.slice(i + 1));
    if (m)
      return {
        text: `\\${m[0]}`,
        kind: 'escape',
        info: `Unicode character U+${m[1].replace(/[{}]/g, '').toUpperCase()}`,
      };
  }
  if (c === 'x') {
    const m = /^x[0-9a-fA-F]{2}/.exec(p.slice(i + 1));
    if (m)
      return {
        text: `\\${m[0]}`,
        kind: 'escape',
        info: `Character 0x${m[0].slice(1).toUpperCase()}`,
      };
  }
  if (c === 'c' && /[A-Za-z]/.test(p[i + 2] ?? ''))
    return {
      text: `\\c${p[i + 2]}`,
      kind: 'escape',
      info: `Control character Ctrl-${p[i + 2].toUpperCase()}`,
    };
  return { text: `\\${c}`, kind: 'literal', info: `The character “${c}”` };
}

function quantifierInfo(q: string): string {
  const lazy = q.length > 1 && q.endsWith('?') ? ' (lazy: as few as possible)' : '';
  const base = lazy ? q.slice(0, -1) : q;
  if (base === '*') return `Zero or more times${lazy}`;
  if (base === '+') return `One or more times${lazy}`;
  if (base === '?') return `Optional (zero or one time)${lazy}`;
  const m = /^\{(\d+)(,(\d*))?\}$/.exec(base)!;
  if (!m[2]) return `Exactly ${m[1]} times${lazy}`;
  if (m[3] === '') return `${m[1]} or more times${lazy}`;
  return `Between ${m[1]} and ${m[3]} times${lazy}`;
}

/** Splits a pattern into tokens with a one-line description each. Best effort, not a full parser. */
export function explain(pattern: string, max = 200): Token[] {
  const out: Token[] = [];
  let groupNo = 0;
  let i = 0;
  const push = (t: Token) => {
    const last = out[out.length - 1];
    if (last?.kind === 'literal' && last.info.startsWith('Literal')) {
      last.text += t.text;
      last.info = `Literal text “${last.text}”`;
    } else out.push(t);
  };
  while (i < pattern.length && out.length < max) {
    const c = pattern[i];
    if (c === '\\') {
      const t = readEscape(pattern, i);
      out.push(t);
      i += t.text.length;
    } else if (c === '[') {
      let j = i + 1;
      if (pattern[j] === '^') j++;
      if (pattern[j] === ']') j++;
      while (j < pattern.length && pattern[j] !== ']') j += pattern[j] === '\\' ? 2 : 1;
      const text = pattern.slice(i, j + 1);
      const negated = text.startsWith('[^');
      const body = text.slice(negated ? 2 : 1, -1);
      out.push({
        text,
        kind: 'class',
        info: `${negated ? 'Any character except' : 'One character from'} ${body ? `“${body}”` : 'an empty set'}`,
      });
      i = j + 1;
    } else if (c === '(') {
      const rest = pattern.slice(i);
      let m: RegExpExecArray | null;
      if (rest.startsWith('(?:'))
        out.push({
          text: '(?:',
          kind: 'group',
          info: 'Start of a non-capturing group',
        });
      else if (rest.startsWith('(?='))
        out.push({
          text: '(?=',
          kind: 'group',
          info: 'Lookahead: followed by …',
        });
      else if (rest.startsWith('(?!'))
        out.push({
          text: '(?!',
          kind: 'group',
          info: 'Negative lookahead: not followed by …',
        });
      else if (rest.startsWith('(?<='))
        out.push({
          text: '(?<=',
          kind: 'group',
          info: 'Lookbehind: preceded by …',
        });
      else if (rest.startsWith('(?<!'))
        out.push({
          text: '(?<!',
          kind: 'group',
          info: 'Negative lookbehind: not preceded by …',
        });
      else if ((m = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(rest)))
        out.push({
          text: m[0],
          kind: 'group',
          info: `Start of capture group ${++groupNo} named “${m[1]}”`,
        });
      else if ((m = /^\(\?[imsx-]+:/.exec(rest)))
        out.push({
          text: m[0],
          kind: 'group',
          info: 'Start of a group with modifiers',
        });
      else
        out.push({
          text: '(',
          kind: 'group',
          info: `Start of capture group ${++groupNo}`,
        });
      i += out[out.length - 1].text.length;
    } else if (c === ')') {
      out.push({ text: ')', kind: 'group', info: 'End of group' });
      i++;
    } else if (c === '*' || c === '+' || c === '?' || (c === '{' && /^\{\d+(,\d*)?\}/.test(pattern.slice(i)))) {
      let q = c === '{' ? /^\{\d+(,\d*)?\}/.exec(pattern.slice(i))![0] : c;
      if (pattern[i + q.length] === '?') q += '?';
      out.push({ text: q, kind: 'quantifier', info: quantifierInfo(q) });
      i += q.length;
    } else if (c === '^') {
      out.push({
        text: '^',
        kind: 'anchor',
        info: 'Start of input (or line with m)',
      });
      i++;
    } else if (c === '$') {
      out.push({
        text: '$',
        kind: 'anchor',
        info: 'End of input (or line with m)',
      });
      i++;
    } else if (c === '.') {
      out.push({
        text: '.',
        kind: 'any',
        info: 'Any character except line breaks (any at all with s)',
      });
      i++;
    } else if (c === '|') {
      out.push({
        text: '|',
        kind: 'alternation',
        info: 'Or: match the left side or the right side',
      });
      i++;
    } else {
      const cp = String.fromCodePoint(pattern.codePointAt(i)!);
      push({ text: cp, kind: 'literal', info: `Literal text “${cp}”` });
      i += cp.length;
    }
  }
  return out;
}
