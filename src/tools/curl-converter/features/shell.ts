// POSIX shell-words tokenizer: enough of sh quoting to split a pasted cURL command into argv.
// Supports '…', "…" (with \" \\ \$ \` escapes), $'…' ANSI-C strings, backslash escapes,
// backslash-newline continuations, # comments and (optionally) Windows cmd ^ continuations.

export interface ShellWord {
  /** The argument after quote removal. */
  value: string;
  /** Unquoted control operators (;, |, &&, ||, &, >, <) are returned as separate operator words. */
  operator?: boolean;
}

export interface TokenizeResult {
  words: ShellWord[];
  error?: string;
}

export interface ShellOptions {
  /** Parse with cmd.exe / Windows rules (^ escapes, only double quotes). Auto-detected from ^ line ends or ^" by default. */
  windows?: boolean;
}

const ANSI_ESCAPES: Record<string, string> = {
  a: '\x07',
  b: '\b',
  e: '\x1b',
  E: '\x1b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  '\\': '\\',
  "'": "'",
  '"': '"',
  '?': '?',
};

/** Decodes the body of a $'…' string starting at `i` (just after the opening quote). */
function readAnsiC(s: string, i: number): { value: string; end: number } | null {
  let value = '';
  while (i < s.length) {
    const c = s[i];
    if (c === "'") return { value, end: i + 1 };
    if (c !== '\\') {
      value += c;
      i++;
      continue;
    }
    const e = s[i + 1];
    if (e === undefined) return null;
    if (e in ANSI_ESCAPES) {
      value += ANSI_ESCAPES[e];
      i += 2;
    } else if (e === 'x') {
      const m = /^[0-9a-fA-F]{1,2}/.exec(s.slice(i + 2));
      if (m) {
        value += String.fromCharCode(parseInt(m[0], 16));
        i += 2 + m[0].length;
      } else {
        value += '\\x';
        i += 2;
      }
    } else if (e === 'u' || e === 'U') {
      const m = (e === 'u' ? /^[0-9a-fA-F]{1,4}/ : /^[0-9a-fA-F]{1,8}/).exec(s.slice(i + 2));
      const cp = m ? parseInt(m[0], 16) : NaN;
      if (m && cp <= 0x10ffff) {
        value += String.fromCodePoint(cp);
        i += 2 + m[0].length;
      } else {
        value += '\\' + e;
        i += 2;
      }
    } else if (/[0-7]/.test(e)) {
      const m = /^[0-7]{1,3}/.exec(s.slice(i + 1))!;
      value += String.fromCharCode(parseInt(m[0], 8) & 0xff);
      i += 1 + m[0].length;
    } else if (e === 'c' && s[i + 2]) {
      value += String.fromCharCode(s.charCodeAt(i + 2) & 0x1f);
      i += 3;
    } else {
      value += '\\' + e;
      i += 2;
    }
  }
  return null;
}

/**
 * Undoes cmd.exe escaping: "^x" → "x" and "^" + newline → continuation, except inside cmd quotes
 * where ^ is literal. What remains is parsed with Windows (MSVCRT) argument rules.
 */
function stripCmdEscapes(s: string): string {
  let out = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') quoted = !quoted;
    if (c === '^' && !quoted && i + 1 < s.length) {
      i++;
      if (s[i] !== '\n') out += s[i];
      continue;
    }
    out += c;
  }
  return out;
}

export function tokenizeShell(input: string, opts: ShellOptions = {}): TokenizeResult {
  const windows = opts.windows ?? /\^\r?\n|\^"/.test(input);
  const normalized = input.replace(/\r\n?/g, '\n');
  const s = windows ? stripCmdEscapes(normalized) : normalized;
  const words: ShellWord[] = [];
  let cur = '';
  let inWord = false;
  let i = 0;

  const end = () => {
    if (inWord) words.push({ value: cur });
    cur = '';
    inWord = false;
  };

  if (windows) {
    // MSVCRT rules: only double quotes group, \" is a literal quote, other backslashes are literal.
    while (i < s.length) {
      const c = s[i];
      if (c === ' ' || c === '\t' || c === '\n') {
        end();
        i++;
      } else if (c === '\\' && s[i + 1] === '"') {
        cur += '"';
        inWord = true;
        i += 2;
      } else if (c === '"') {
        let j = i + 1;
        for (; j < s.length && s[j] !== '"'; j++) {
          if (s[j] === '\\' && s[j + 1] === '"') {
            cur += '"';
            j++;
          } else if (s[j] === '\\' && s[j + 1] === '\\' && s[j + 2] === '"') {
            cur += '\\';
            j++;
          } else cur += s[j];
        }
        if (j >= s.length) return { words, error: 'Unterminated double quote (")' };
        inWord = true;
        i = j + 1;
      } else {
        cur += c;
        inWord = true;
        i++;
      }
    }
    end();
    return { words };
  }

  while (i < s.length) {
    const c = s[i];

    if (c === '\\' && s[i + 1] === '\n') {
      i += 2; // line continuation
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\n') {
      end();
      i++;
      continue;
    }
    if (c === '#' && !inWord) {
      while (i < s.length && s[i] !== '\n') i++;
      continue;
    }
    if (c === "'") {
      const close = s.indexOf("'", i + 1);
      if (close === -1) return { words, error: 'Unterminated single quote (\')' };
      cur += s.slice(i + 1, close);
      inWord = true;
      i = close + 1;
      continue;
    }
    if (c === '$' && s[i + 1] === "'") {
      const r = readAnsiC(s, i + 2);
      if (!r) return { words, error: "Unterminated $'…' string" };
      cur += r.value;
      inWord = true;
      i = r.end;
      continue;
    }
    if (c === '"' || (c === '$' && s[i + 1] === '"')) {
      let j = i + (c === '$' ? 2 : 1);
      let closed = false;
      while (j < s.length) {
        const d = s[j];
        if (d === '"') {
          closed = true;
          j++;
          break;
        }
        if (d === '\\' && j + 1 < s.length) {
          const e = s[j + 1];
          if (e === '\n') {
            j += 2;
            continue;
          }
          if ('"\\$`'.includes(e)) {
            cur += e;
            j += 2;
            continue;
          }
        }
        cur += d;
        j++;
      }
      if (!closed) return { words, error: 'Unterminated double quote (")' };
      inWord = true;
      i = j;
      continue;
    }
    if (c === '\\') {
      if (i + 1 < s.length) cur += s[i + 1];
      inWord = true;
      i += 2;
      continue;
    }
    const op = /^(?:&&|\|\||[;|&<>])/.exec(s.slice(i));
    if (op) {
      end();
      words.push({ value: op[0], operator: true });
      i += op[0].length;
      continue;
    }
    cur += c;
    inWord = true;
    i++;
  }
  end();
  return { words };
}

const SAFE = /^[A-Za-z0-9_\-.,:/@%+=]+$/;

/** Quotes one argument for a POSIX shell (single quotes; a literal ' becomes '\''). */
export function shellQuote(value: string): string {
  if (value !== '' && SAFE.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
