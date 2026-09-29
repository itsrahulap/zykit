// Adds a guard call to the condition of every `while`, `do … while` and `for (;;)` loop, so an
// endless loop in the DOM sandbox throws instead of freezing the page.
//
// Why: the sandboxed iframe may share the page's thread (browsers don't always put sandboxed
// frames in their own process), and then `while (true) {}` would freeze the whole tab before
// Stop or the time limit could react. Worker runs don't need this: a worker is terminated.
//
// `while (c)` becomes `while (G() && (c))` and `for (a; c; b)` becomes `for (a; G() && (c); b)`
// (an empty condition becomes `G()`). for-in / for-of loops are left alone; they end on their own
// unless they iterate an endless generator. Loops inside template-literal `${}` aren't guarded.

interface Token {
  kind: 'ident' | 'punct' | 'other';
  value: string;
  start: number;
  end: number;
}

// After these tokens a `/` starts a regular expression, not a division.
const REGEX_AFTER_PUNCT = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);

function skipString(code: string, i: number): number {
  const q = code[i];
  for (i++; i < code.length; i++) {
    if (code[i] === '\\') i++;
    else if (code[i] === q || (code[i] === '\n' && q !== '`')) return i + 1;
    else if (q === '`' && code[i] === '$' && code[i + 1] === '{') i = skipTemplateExpr(code, i + 2) - 1;
  }
  return code.length;
}

/** From just inside `${`, returns the index after the matching `}`. */
function skipTemplateExpr(code: string, i: number): number {
  let depth = 1;
  while (i < code.length) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(code, i);
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
    i++;
  }
  return code.length;
}

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '/' && code[i + 1] === '/') {
      while (i < n && code[i] !== '\n') i++;
    } else if (c === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      i = close === -1 ? n : close + 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const end = skipString(code, i);
      tokens.push({ kind: 'other', value: code.slice(i, end), start: i, end });
      i = end;
    } else if (c === '/') {
      const prev = tokens[tokens.length - 1];
      const regex = !prev || (prev.kind === 'punct' && REGEX_AFTER_PUNCT.has(prev.value)) || (prev.kind === 'ident' && REGEX_AFTER_WORD.has(prev.value));
      if (regex) {
        let j = i + 1;
        let inClass = false;
        for (; j < n && code[j] !== '\n'; j++) {
          if (code[j] === '\\') j++;
          else if (code[j] === '[') inClass = true;
          else if (code[j] === ']') inClass = false;
          else if (code[j] === '/' && !inClass) break;
        }
        j++;
        while (j < n && /[a-z]/i.test(code[j])) j++;
        tokens.push({ kind: 'other', value: code.slice(i, j), start: i, end: j });
        i = j;
      } else {
        tokens.push({ kind: 'punct', value: '/', start: i, end: i + 1 });
        i++;
      }
    } else if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(code[j])) j++;
      tokens.push({ kind: 'ident', value: code.slice(i, j), start: i, end: j });
      i = j;
    } else if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w.]/.test(code[j])) j++;
      tokens.push({ kind: 'other', value: code.slice(i, j), start: i, end: j });
      i = j;
    } else {
      tokens.push({ kind: 'punct', value: c, start: i, end: i + 1 });
      i++;
    }
  }
  return tokens;
}

const OPEN: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

/** Index of the token closing the bracket at `open`, or -1. */
function matching(tokens: Token[], open: number): number {
  let depth = 0;
  for (let k = open; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.kind !== 'punct') continue;
    if (t.value in OPEN) depth++;
    else if (t.value === ')' || t.value === ']' || t.value === '}') {
      depth--;
      if (depth === 0) return k;
    }
  }
  return -1;
}

export function addLoopGuards(code: string, guard: string): string {
  const tokens = tokenize(code);
  const inserts: { at: number; text: string }[] = [];
  const call = `${guard}()`;

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.kind !== 'ident' || (t.value !== 'while' && t.value !== 'for')) continue;
    const before = tokens[k - 1];
    if (before && before.kind === 'punct' && (before.value === '.' || before.value === '?')) continue; // obj.for, obj?.while
    let open = k + 1;
    if (t.value === 'for' && tokens[open]?.value === 'await') open++;
    if (tokens[open]?.value !== '(') continue;
    const close = matching(tokens, open);
    if (close === -1) continue;

    if (t.value === 'while') {
      if (close === open + 1) continue; // `while ()` is a syntax error anyway
      inserts.push({ at: tokens[open].end, text: `${call} && (` }, { at: tokens[close].start, text: ')' });
      continue;
    }
    // for: find the two top-level semicolons.
    const semis: number[] = [];
    let depth = 0;
    for (let m = open + 1; m < close; m++) {
      const v = tokens[m];
      if (v.kind !== 'punct') continue;
      if (v.value in OPEN) depth++;
      else if (v.value === ')' || v.value === ']' || v.value === '}') depth--;
      else if (v.value === ';' && depth === 0) semis.push(m);
    }
    if (semis.length !== 2) continue; // for-in / for-of
    const [a, b] = semis;
    if (b === a + 1) inserts.push({ at: tokens[a].end, text: ` ${call}` });
    else inserts.push({ at: tokens[a].end, text: ` ${call} && (` }, { at: tokens[b].start, text: ')' });
  }

  if (inserts.length === 0) return code;
  // Apply from the end so earlier offsets stay valid; at equal offsets keep insertion order.
  const ordered = inserts.map((ins, idx) => ({ ...ins, idx })).sort((x, y) => y.at - x.at || y.idx - x.idx);
  let out = code;
  for (const ins of ordered) out = out.slice(0, ins.at) + ins.text + out.slice(ins.at);
  return out;
}
